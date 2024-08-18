"""This is the main file for the chatbot application."""
import datetime
import logging
import os
import json
import uuid
from google.cloud import firestore as google_firestore
from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse, JSONResponse
from jose import jwt
from pydantic import BaseModel, ValidationError
from typing import Optional
import requests
from langchain_openai import ChatOpenAI
import dotenv
from langchain.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain_anthropic import ChatAnthropic
from langchain_mistralai import ChatMistralAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatPerplexity
from langchain_together import ChatTogether
from langchain_core.output_parsers import StrOutputParser
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import uvicorn
import razorpay
from razorpay.resources.subscription import Subscription
from razorpay.resources.customer import Customer
from razorpay.resources.order import Order
from razorpay.resources.payment import Payment
import tiktoken
from anthropic import Anthropic
from vertexai.preview import tokenization
import hmac
import hashlib



dotenv.load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up logging with the configured log level from environment variables or default to ERROR.
logging.basicConfig(level=os.getenv("LOG_LEVEL", "ERROR"))

def get_environment_variable(key):
    """Get the environment variable or return None if not found"""
    # Try fetching from environment first
    value = os.getenv(key)
    if value is not None:
        return value
    
    # Fallback to dotenv
    value = dotenv.get_key(dotenv.find_dotenv(), key)
    return value

RAZORPAY_KEY_ID = get_environment_variable("RAZOR_PAY_KEY_ID")
RAZORPAY_KEY_SECRET = get_environment_variable("RAZOR_PAY_KEY_SECRET")
ENABLE_PAYMENT = get_environment_variable("ENABLE_PAYMENT") == "True"

# Initialize a Firestore client with a specific service account key file
if get_environment_variable("ENVIRONMENT") == "dev":
    cred = credentials.Certificate("serviceAccount.json")
    firebase_admin.initialize_app(cred)
else:
    firebase_admin.initialize_app()

db = firestore.client()

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
# Create an instance of the Subscription class
subscription = Subscription(client)
customer = Customer(client)

# This will just define that the Authorization header is required
auth_scheme = HTTPBearer()

anthropic = Anthropic()

class ChatHistory(BaseModel):
    """Chat history model for the request and response."""

    ai_message: str
    user_message: str


class ChatRequest(BaseModel):
    """Chat request model for the chat endpoint."""

    user_input: str
    chat_history: list[ChatHistory]
    chat_model: str = "gpt-3.5-turbo"
    temperature: float = 0.8
    chat_id: Optional[str] = None
    regenerate_message: Optional[bool] = False

class ChatResponse(BaseModel):
    """Chat response model for the chat endpoint."""

    response: str

class ChatEventStreaming(BaseModel):
    """Chat event streaming model for the chat endpoint."""
    event: str
    data: str
    is_final: bool
    chat_id: Optional[str] = None

class ChatUserHistory(BaseModel):
    """Chat user history model for the chat history endpoint."""
    chat_id: str
    chat_title: Optional[str]
    chat_model: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
class ChatByIdHistory(BaseModel):
    """Chat by id history model for the chat by id endpoint."""
    ai_message: str
    user_message: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    regenerate_message: bool
    model: str

class PaymentRequest(BaseModel):
    """Payment request model for the payment endpoint."""
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


model_company_mapping = {
    "gpt-3.5-turbo": {
        "model": ChatOpenAI,
        "premium": False,
        "company": "OpenAI",
        "input_token_cost_per_million": 0.5,
        "output_token_cost_per_million": 1.5
    },
    "gpt-4-turbo-preview": {
        "model": ChatOpenAI,
        "premium": True,
        "company": "OpenAI",
        "input_token_cost_per_million": 10.0,
        "output_token_cost_per_million": 30.0
    },
    "gpt-4o-mini": {
        "model": ChatOpenAI,
        "premium": False,
        "company": "OpenAI",
        "input_token_cost_per_million": 0.15,
        "output_token_cost_per_million": 0.6
    },
    "gpt-4o": {
        "model": ChatOpenAI,
        "premium": True,
        "company": "OpenAI",
        "input_token_cost_per_million": 5.0,
        "output_token_cost_per_million": 15.0
    },
    "claude-3-opus-20240229": {
        "model": ChatAnthropic,
        "premium": True,
        "company": "Anthropic",
        "input_token_cost_per_million": 15.0,
        "output_token_cost_per_million": 75.0
    },
    "claude-3-sonnet-20240229": {
        "model": ChatAnthropic,
        "premium": True,
        "company": "Anthropic",
        "input_token_cost_per_million": 3.0,
        "output_token_cost_per_million": 15.0
    },
    "claude-3-haiku-20240307": {
        "model": ChatAnthropic,
        "premium": False,
        "company": "Anthropic",
        "input_token_cost_per_million": 0.25,
        "output_token_cost_per_million": 1.25
    },
    "claude-3-5-sonnet-20240620": {
        "model": ChatAnthropic,
        "premium": True,
        "company": "Anthropic",
        "input_token_cost_per_million": 3.0,
        "output_token_cost_per_million": 15.0
    },
    "mistral-tiny-2312": {
        "model": ChatMistralAI,
        "premium": False,
        "company": "Mistral",
        "input_token_cost_per_million": 0.25,
        "output_token_cost_per_million": 0.25
    },
    "mistral-small-2312": {
        "model": ChatMistralAI,
        "premium": False,
        "company": "Mistral",
        "input_token_cost_per_million": 0.7,
        "output_token_cost_per_million": 0.7
    },
    "mistral-small-2402": {
        "model": ChatMistralAI,
        "premium": False,
        "company": "Mistral",
        "input_token_cost_per_million": 1.0,
        "output_token_cost_per_million": 3.0
    },
    "mistral-medium-2312": {
        "model": ChatMistralAI,
        "premium": True,
        "company": "Mistral",
        "input_token_cost_per_million": 2.7,
        "output_token_cost_per_million": 8.1
    },
    "mistral-large-2402": {
        "model": ChatMistralAI,
        "premium": True,
        "company": "Mistral",
        "input_token_cost_per_million": 4.0,
        "output_token_cost_per_million": 12.0
    },
    "gemini-1.0-pro": {
        "model": ChatGoogleGenerativeAI,
        "premium": False,
        "company": "Google",
        "input_token_cost_per_million": 0.5,
        "output_token_cost_per_million": 1.5
    },
    "gemini-1.5-flash-latest": {
        "model": ChatGoogleGenerativeAI,
        "premium": False,
        "company": "Google",
        "input_token_cost_per_million": 0.35,
        "output_token_cost_per_million": 1.05
    },
    "gemini-1.5-pro-latest": {
        "model": ChatGoogleGenerativeAI,
        "premium": True,
        "company": "Google",
        "input_token_cost_per_million": 3.5,
        "output_token_cost_per_million": 10.5
    },
    "llama-3-sonar-small-32k-online": {
        "model": ChatPerplexity,
        "premium": False,
        "company": "Perplexity",
        "input_token_cost_per_million": 0.2,
        "output_token_cost_per_million": 0.2
    },
    "llama-3-sonar-small-32k-chat": {
        "model": ChatPerplexity,
        "premium": True,
        "company": "Perplexity",
        "input_token_cost_per_million": 0.2,
        "output_token_cost_per_million": 0.2
    },
    "llama-3-sonar-large-32k-online": {
        "model": ChatPerplexity,
        "premium": False,
        "company": "Perplexity",
        "input_token_cost_per_million": 1,
        "output_token_cost_per_million": 1
    },
    "llama-3-sonar-large-32k-chat": {
        "model": ChatPerplexity,
        "premium": True,
        "company": "Perplexity",
        "input_token_cost_per_million": 1,
        "output_token_cost_per_million": 1
    },
    "llama-3.1-sonar-small-128k-online": {
        "model": ChatPerplexity,
        "premium": True,
        "company": "Perplexity",
        "input_token_cost_per_million": 0.2,
        "output_token_cost_per_million": 0.2
    },
    "llama-3.1-sonar-small-128k-chat": {
        "model": ChatPerplexity,
        "premium": True,
        "company": "Perplexity",
        "input_token_cost_per_million": 0.2,
        "output_token_cost_per_million": 0.2
    },
    "llama-3.1-sonar-large-128k-online": {
        "model": ChatPerplexity,
        "premium": True,
        "company": "Perplexity",
        "input_token_cost_per_million": 1,
        "output_token_cost_per_million": 1
    },
    "llama-3.1-sonar-large-128k-chat": {
        "model": ChatPerplexity,
        "premium": True,
        "company": "Perplexity",
        "input_token_cost_per_million": 1,
        "output_token_cost_per_million": 1
    },
    "codellama/CodeLlama-34b-Instruct-hf": {
        "model": ChatTogether,
        "premium": False,
        "company": "Meta",
        "input_token_cost_per_million": 0.78,
        "output_token_cost_per_million": 0.78
    },
    "codellama/CodeLlama-70b-Instruct-hf": {
        "model": ChatTogether,
        "premium": True,
        "company": "Meta",
        "input_token_cost_per_million": 0.9,
        "output_token_cost_per_million": 0.9
    },
    "meta-llama/Llama-2-13b-chat-hf": {
        "model": ChatTogether,
        "premium": False,
        "company": "Meta",
        "input_token_cost_per_million": 0.22,
        "output_token_cost_per_million": 0.22
    },
    "meta-llama/Llama-2-70b-chat-hf": {
        "model": ChatTogether,
        "premium": True,
        "company": "Meta",
        "input_token_cost_per_million": 0.9,
        "output_token_cost_per_million": 0.9
    },
    "meta-llama/Llama-3-8b-chat-hf": {
        "model": ChatTogether,
        "premium": False,
        "company": "Meta",
        "input_token_cost_per_million": 0.2,
        "output_token_cost_per_million": 0.2
    },
    "meta-llama/Llama-3-70b-chat-hf": {
        "model": ChatTogether,
        "premium": True,
        "company": "Meta",
        "input_token_cost_per_million": 0.9,
        "output_token_cost_per_million": 0.9
    },
    "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo": {
        "model": ChatTogether,
        "premium": True,
        "company": "Meta",
        "input_token_cost_per_million": 0.7,
        "output_token_cost_per_million": 0.8
    },
    "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo": {
        "model": ChatTogether,
        "premium": True,
        "company": "Meta",
        "input_token_cost_per_million": 0.7,
        "output_token_cost_per_million": 0.8
    },
    "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo": {
        "model": ChatTogether,
        "premium": True,
        "company": "Meta",
        "input_token_cost_per_million": 0.7,
        "output_token_cost_per_million": 0.8
    },
    "google/gemma-2b-it": {
        "model": ChatTogether,
        "premium": False,
        "company": "Google",
        "input_token_cost_per_million": 0.1,
        "output_token_cost_per_million": 0.1
    },
    "google/gemma-7b-it": {
        "model": ChatTogether,
        "premium": False,
        "company": "Google",
        "input_token_cost_per_million": 0.2,
        "output_token_cost_per_million": 0.2
    }
}


# Get the secret key from the environment variable
SECRET_KEY = get_environment_variable("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")

GOOGLE_CLIENT_ID = get_environment_variable("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = get_environment_variable("GOOGLE_CLIENT_SECRET")
if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    raise ValueError("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variable is not set")    


async def add_user_to_db(user_ref, user_data):
    """
    Background task to add or update the user in the database.
    """
    user = user_ref.get()
    if user.exists:
        print(user.to_dict())
    else:
        print("User does not exist")
        user_ref.set(user_data)


def add_message_to_db(request, google_user_id, user_message, ai_message, stats):
    """
    Background task to add the chat message to the database.
    """
    chat_id = None

    # Check if chat_id key exists in the request
    if not hasattr(request, 'chat_id'):
        logging.error('Request object does not have a chat_id attribute')
        return None

    chat_id = request.chat_id

    # Check if the chat_id exists in the database in the chat_id column
    chat_ref = db.collection('chats').where(filter=FieldFilter('chat_id', '==', chat_id)).limit(1).stream()
    chat_data = next(chat_ref, None)

    if chat_data:
        # Check if the google_user_id matches the google_user_id in the chat
        chat_data = chat_data.to_dict()
        if chat_data['google_user_id'] == google_user_id:
            try:
                # Update the chat with the new message
                chat_doc_ref = db.collection('chats').document(chat_id)
                chat_doc_ref.update({
                    'updated_at': google_firestore.SERVER_TIMESTAMP,
                    'model' : request.chat_model
                })
                db.collection('chat_history').add({
                    'ai_message': ai_message,
                    'user_message': user_message,
                    'chat_id': chat_id,
                    'created_at': google_firestore.SERVER_TIMESTAMP,
                    'updated_at': google_firestore.SERVER_TIMESTAMP,
                    'regenerate_message' : request.regenerate_message,
                    'model' : request.chat_model,
                    'stats' : stats
                })
            except Exception as e:
                logging.error(f'Error updating chat: {e}')
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden",
            )
    else:
        try:
            # Create a new chat id and add the chat to the database
            chat_id = str(uuid.uuid4())
            new_chat_ref = db.collection('chats').document(chat_id)
            new_chat_ref.set({
                'chat_id': chat_id,
                'google_user_id': google_user_id,
                'created_at': google_firestore.SERVER_TIMESTAMP,
                'updated_at': google_firestore.SERVER_TIMESTAMP,
                'model' : request.chat_model,
            })
            db.collection('chat_history').add({
                'ai_message': ai_message,
                'user_message': user_message,
                'chat_id': chat_id,
                'created_at': google_firestore.SERVER_TIMESTAMP,
                'updated_at': google_firestore.SERVER_TIMESTAMP,
                'regenerate_message' : request.regenerate_message,
                'model' : request.chat_model,
                'stats' : stats
            })
        except Exception as e:
            logging.error(f'Error creating new chat: {e}')
            return None

    return chat_id


def calculate_cost(input_string, output_string, model_name):
    """
    Calculate the cost of the chat based on the input and output token lengths.
    """
    chat_config = model_company_mapping.get(model_name)
    input_token_length = 0
    output_token_length = 0

    if chat_config['company'] == 'OpenAI':
        encoding = tiktoken.encoding_for_model(model_name)
        input_token_length = len(encoding.encode(input_string))
        output_token_length = len(encoding.encode(output_string))
    
    if chat_config['company'] == 'Anthropic':
        input_token_length = anthropic.count_tokens(input_string)
        output_token_length = anthropic.count_tokens(output_string)
    
    if chat_config['company'] == 'Mistral' or chat_config['company'] == 'Perplexity' or chat_config['company'] == 'Meta':
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        input_token_length = len(encoding.encode(input_string))
        output_token_length = len(encoding.encode(output_string))
    
    if chat_config['company'] == 'Google':
        tokenizer = tokenization.get_tokenizer_for_model("gemini-1.5-flash-001")
        input_token_length = tokenizer.count_tokens(input_string).total_tokens
        output_token_length = tokenizer.count_tokens(output_string).total_tokens
    
    input_cost = input_token_length * chat_config['input_token_cost_per_million'] / 1000000
    output_cost = output_token_length * chat_config['output_token_cost_per_million'] / 1000000
    return input_token_length, output_token_length, input_cost + output_cost


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    """Generic exception handler to catch unexpected errors."""
    logging.error("Unexpected error occurred: %s", exc)
    return {"message": "Internal server error", "detail": str(exc)}, 500

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc: HTTPException):
    """Custom HTTP exception handler to catch HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code if exc.status_code else status.HTTP_403_FORBIDDEN,
        content={"status": exc.status_code if exc.status_code else status.HTTP_403_FORBIDDEN, "details": exc.detail},
    )

async def verify_google_token(background_tasks: BackgroundTasks, credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    """Verify the Google ID token and return the user info."""
    if credentials:
        token = credentials.credentials
        try:
            request = requests.get("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {token}"}, timeout=10)

            # Check if the request was successful
            request.raise_for_status()

            credentials = request.json()
            
            # Check if the user is in the database using the sub field, in the collection users the sub is set to google_user_id field
            user_ref = db.collection('users').document(credentials['sub'])
            user_data = {
                'email': credentials['email'],
                'username': credentials['name'],
                'profile_picture': credentials['picture'],
                'google_user_id': credentials['sub'],
            }

            # Add or update the user in the database as a background task
            background_tasks.add_task(add_user_to_db, user_ref, user_data)

            return credentials
        except ValueError as exc:
            # Invalid token
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Google ID token",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )



def get_generations(token_info: dict = Depends(verify_google_token)):
    """Verify the number of generations left for the user."""
    # check in user_generations collection for the user
    user_generations_ref = db.collection('user_generations').document(token_info['sub'])
    user_generations_data = user_generations_ref.get()
    if user_generations_data.exists:
        user_generations_data = user_generations_data.to_dict()
        return user_generations_data['remaining_generations']
    else:
        # create a new document for the user with the remaining generations
        user_generations_ref.set({
            'google_user_id': token_info['sub'],
            'remaining_generations': 20,
            'created_at': google_firestore.SERVER_TIMESTAMP,
            'updated_at': google_firestore.SERVER_TIMESTAMP,
        })
        return 20

def update_generations_left(token_info: dict = Depends(verify_google_token), generations_left: int = 30):
    """Update the number of generations left for the user."""
    user_generations_ref = db.collection('user_generations').document(token_info['sub'])
    user_generations_ref.update({
        'remaining_generations': generations_left - 1,
        'updated_at': google_firestore.SERVER_TIMESTAMP,
    })


@app.get("/auth/google", response_model=dict, tags=["Authentication Endpoints"])
async def google_auth(idinfo: dict = Depends(verify_google_token)):
    """Google authentication endpoint to verify the Google ID token."""
    # create a new JWT token using sub and the secret key with expiry time of 30 days
    token = jwt.encode({"sub": idinfo["sub"], "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30)}, SECRET_KEY, algorithm="HS256")
    return {"accessToken": token, "user": idinfo, "token_type": "Bearer"}

# Example usage within your verify_token dependency
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """Verify the JWT token and return the user info."""
    if credentials:
        token = credentials.credentials
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            return payload
        except jwt.JWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            ) from exc
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )
    
@app.get("/verify", tags=["Authentication Endpoints"])
async def verify_token_info(token_info: dict = Depends(verify_token)):
    """Verify the JWT token and return the user info."""
    return {"token_info": token_info}


@app.post("/v1/chat_event_streaming", tags=["AI Endpoints"])
async def chat_event_streaming(request: ChatRequest, token_info: dict = Depends(verify_token)):
    """Chat Event Streaming endpoint for the OpenAI chatbot."""
    try:
        # Get the chat model from the request and create the corresponding chat instance
        chat_model = request.chat_model
        chat_config = model_company_mapping.get(chat_model)

        if not chat_config:
            raise ValueError(f"Invalid chat model: {chat_model}")
        
        # check the number of generations left for the user
        generations_left = get_generations(token_info)
        if generations_left == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Generations limit exceeded",
            )
        
        chat = chat_config['model'](
            model_name=chat_model,
            model=chat_model,
            temperature=request.temperature,
        )


        prompt = ChatPromptTemplate(
            messages=[
                # SystemMessagePromptTemplate.from_template(""),
                MessagesPlaceholder(variable_name="chat_history"),
                HumanMessagePromptTemplate.from_template("{user_input}"),
            ]
        )
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        parser = StrOutputParser()

        conversation = prompt | chat | parser

        # Seed the chat history with the user's input from the request
        for chat_history in request.chat_history:
            memory.chat_memory.add_user_message(chat_history.user_message)
            memory.chat_memory.add_ai_message(chat_history.ai_message)
        
        generated_ai_message = ""

        # convert into a total input string
        total_input = prompt.format(chat_history=memory.buffer, user_input=request.user_input)
        
        # Run the conversation.invoke method in a separate thread
        def event_streaming():
            nonlocal generated_ai_message
            try:
                for token in conversation.stream({"chat_history": memory.buffer, "user_input": request.user_input}):
                    generated_ai_message += token
                    response = ChatEventStreaming(event="stream", data=token, is_final=False)
                    yield f"data: {json.dumps(jsonable_encoder(response))}\n\n"
                
                
                input_token_length, output_token_length, cost = calculate_cost(total_input, generated_ai_message, chat_model)

                # stats for the chat
                stats = {
                    "input_token_length": input_token_length,
                    "output_token_length": output_token_length,
                    "cost": cost
                }

                print("Stats: ", stats)

                # Database update after streaming is completed
                chat_id = add_message_to_db(request, token_info['sub'], request.user_input, generated_ai_message, stats)

                # update the remaining generations for the user
                update_generations_left(token_info, generations_left)

                response = ChatEventStreaming(event="stream", data="", is_final=True, chat_id=chat_id)
                yield f"data: {json.dumps(jsonable_encoder(response))}\n\n"
            except uvicorn.protocols.utils.ClientDisconnected:
                logging.info("Client disconnected.")
                response = ChatEventStreaming(event="stream", data="", is_final=True)
                yield f"data: {json.dumps(jsonable_encoder(response))}\n\n"


        return StreamingResponse(event_streaming(), media_type="text/event-stream")
    except ValidationError as ve:
        # Handle validation errors specifically for better user feedback
        logging.error("Validation error: %s", ve)
        raise HTTPException(status_code=400, detail="Invalid request data") from ve
    except HTTPException as he:
        # Handle HTTP exceptions specifically for better user feedback
        raise he
    except Exception as e:
        # Log and handle generic exceptions gracefully
        logging.error("Error processing chat request: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e



@app.get("/v1/generations", tags=["AI Endpoints"])
async def get_generations_left(token_info: dict = Depends(verify_token)):
    """Get the number of generations left for the user."""
    try:
        generations_left = get_generations(token_info)
        return {"generations_left": generations_left}
    except Exception as e:
        logging.error("Error processing generations request: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e

# chat history of the user
@app.get("/v1/chat_history", tags=["AI Endpoints"], response_model=list[ChatUserHistory])
async def user_chat_history(page: int = 1, limit: int = 10, token_info: dict = Depends(verify_token)):
    """Chat history endpoint for the OpenAI chatbot."""
    try:
        # Calculate the starting index based on the page and limit
        start_index = (page - 1) * limit

        # Get the chat history from the database with pagination
        chat_history = []
        chat_ref = db.collection('chats').where('google_user_id', '==', token_info['sub']).order_by('updated_at', direction=google_firestore.Query.DESCENDING).offset(start_index).limit(limit).stream()
        for chat_data in chat_ref:
            chat_data = chat_data.to_dict()
            chat_history.append(ChatUserHistory(chat_id=chat_data['chat_id'], created_at=chat_data['created_at'], updated_at=chat_data['updated_at'], chat_title=chat_data.get('chat_title', None) , chat_model=chat_data.get('model', 'gpt-3.5-turbo')))
                    
        return chat_history
    except Exception as e:
        # Log and handle generic exceptions gracefully
        logging.error("Error processing chat history request: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e
    


def update_chat_title(chat_id, new_chat_title):
    """
    Background task to update the chat title in the database.
    """
    try:
        chat_doc_ref = db.collection('chats').document(chat_id)
        chat_doc_ref.update({
            'chat_title': new_chat_title,
            'updated_at': google_firestore.SERVER_TIMESTAMP,
        })
    except Exception as e:
        logging.error(f'Error updating chat title: {e}')



# title of the chat generater
@app.post("/v1/chat_title", tags=["AI Endpoints"])
async def chat_title(request: ChatRequest, token_info: dict = Depends(verify_token)):
    """Chat endpoint for the OpenAI chatbot."""
    try:
        # Get the chat model from the request and create the corresponding chat instance
        chat_config = model_company_mapping.get("gpt-4o-mini")

        # check the number of generations left for the user
        generations_left = get_generations(token_info)
        if generations_left == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Generations limit exceeded",
            )
        
        chat = chat_config['model'](
            model_name="gpt-4o-mini",
            model="gpt-4o-mini",
            temperature=request.temperature,
        )


        prompt = ChatPromptTemplate(
            messages=[
                # SystemMessagePromptTemplate.from_template(""),
                MessagesPlaceholder(variable_name="chat_history"),
                HumanMessagePromptTemplate.from_template("{user_input}"),
            ]
        )
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        conversation = LLMChain(llm=chat, memory=memory, prompt=prompt, verbose=False)

        # Seed the chat history with the user's input from the request
        for chat_history in request.chat_history:
            memory.chat_memory.add_user_message(chat_history.user_message)
            memory.chat_memory.add_ai_message(chat_history.ai_message)

        # Run the conversation.invoke method in a separate thread
        response = conversation.invoke(input="Generate a concise and relevant 5-word title for the above chat based on the main topic discussed. Do not include any creative or ambiguous terms.")

        # clean the response of extra "" or /
        response["text"] = response["text"].replace('"', '').replace("/", "")

        # Database update after streaming is completed
        update_chat_title(request.chat_id, response["text"])

        return ChatResponse(response=response["text"])
    except ValidationError as ve:
        # Handle validation errors specifically for better user feedback
        logging.error("Validation error: %s", ve)
        raise HTTPException(status_code=400, detail="Invalid request data") from ve
    except HTTPException as he:
        # Handle HTTP exceptions specifically for better user feedback
        raise he
    except Exception as e:
        # Log and handle generic exceptions gracefully
        logging.error("Error processing chat request: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e


# chats by chat_id
@app.get("/v1/chat_by_id", tags=["AI Endpoints"], response_model=list[ChatByIdHistory])
async def chat_by_id(chat_id: str, token_info: dict = Depends(verify_token)):
    """Chat endpoint for the OpenAI chatbot."""
    try:
        # verify that chat_id belongs to the user using google_user_id inside token_info['sub']
        chat_ref = db.collection('chats').where('chat_id', '==', chat_id).stream()
        chat_data = next(chat_ref, None)

        if chat_data:
            chat_data = chat_data.to_dict()
            if chat_data['google_user_id'] == token_info['sub']:
                chat_history = []
                chat_history_ref = db.collection('chat_history').where('chat_id', '==', chat_id).stream()
                for chat_data in chat_history_ref:
                    chat_data = chat_data.to_dict()
                    chat_history.append(ChatByIdHistory(ai_message=chat_data['ai_message'], user_message=chat_data['user_message'], created_at=chat_data['created_at'], updated_at=chat_data['updated_at'], regenerate_message=chat_data['regenerate_message'], model=chat_data['model']))
                return chat_history
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found",
            )
    except Exception as e:
        logging.error("Error processing chat request: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e


@app.post("/v1/create_order", tags=["Order Endpoints"])
async def create_order(plan_id: str, token_info: dict = Depends(verify_token)):
    """Create an order for the user."""
    try:
        if not ENABLE_PAYMENT:
            raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payment is disabled",
            )


        amount = 0
        if plan_id == 'plan_50':
            amount = 420  
        elif plan_id == 'plan_250':
            amount = 840  
        elif plan_id == 'plan_500':
            amount = 1680
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid plan id",
            )

        order_data = {
            "amount" : amount*100,
            "currency" : "INR",
            "receipt": plan_id,
        }

    
        order = Order(client).create(order_data)
        # save the order into the orders collection
        db.collection('orders').add({
            'order_id': order['id'],
            'plan_id': plan_id,
            'customer_id': token_info['sub'],
            'created_at': google_firestore.SERVER_TIMESTAMP,
            'updated_at': google_firestore.SERVER_TIMESTAMP,
        })

        response = {
            "order_id": order['id'],
            "amount": amount,
            "currency": "INR",
            "receipt": plan_id,
        }

        # only return the order id
        return response
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error("Error creating order: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e


@app.post("/v1/verify_payment", tags=["Order Endpoints"])
async def verify_payment(request: PaymentRequest, token_info: dict = Depends(verify_token)):
    """Verify the payment for the user."""
    
    try:
        if not ENABLE_PAYMENT:
            raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payment is disabled",
            )

        # first check if the payment_id exists in the payments collection
        payment_ref = db.collection('payments').where('payment_id', '==', request.razorpay_payment_id).stream()
        payment_data = next(payment_ref, None)

        if payment_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already exists",
            )

        # verify the razorpay_signature
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode('utf-8'),
            f"{request.razorpay_order_id}|{request.razorpay_payment_id}".encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        if generated_signature != request.razorpay_signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature",
            )

        order_data = Order(client).fetch(request.razorpay_order_id)
        # check if the order is paid
        if order_data['status'] == 'paid':
            
            db.collection('payments').add({
                'order_id': request.razorpay_order_id,
                'payment_id': request.razorpay_payment_id,
                'customer_id': token_info['sub'],
                'created_at': google_firestore.SERVER_TIMESTAMP,
                'updated_at': google_firestore.SERVER_TIMESTAMP,
            })

            # get the current remaining generations for the user
            generations_left = get_generations(token_info)

            # update user_generations collection by adding the remaining generations
            if order_data['receipt'] == 'plan_50':
                db.collection('user_generations').document(token_info['sub']).update({
                    'remaining_generations': 50 + generations_left,
                    'updated_at': google_firestore.SERVER_TIMESTAMP,
                })
            elif order_data['receipt'] == 'plan_250':
                db.collection('user_generations').document(token_info['sub']).update({
                    'remaining_generations': 250 + generations_left,
                    'updated_at': google_firestore.SERVER_TIMESTAMP,
                })
            elif order_data['receipt'] == 'plan_500':
                db.collection('user_generations').document(token_info['sub']).update({
                    'remaining_generations': 500 + generations_left,
                    'updated_at': google_firestore.SERVER_TIMESTAMP,
                })

            return {"status": "success"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment failed",
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error("Error verifying payment: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e


@app.get("/v1/fetch_payments", tags=["Order Endpoints"])
async def fetch_receipt(token_info: dict = Depends(verify_token)):
    """Fetch the receipt URL for a given payment."""
    try:
        if not ENABLE_PAYMENT:
            raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payment is disabled",
            )
        
        # fetch the receipts for the user sorted by updated_at
        receipts = []
        receipt_ref = db.collection('payments').where('customer_id', '==', token_info['sub']).order_by('updated_at', direction=google_firestore.Query.DESCENDING).stream()

        for receipt_data in receipt_ref:
            receipt_data = receipt_data.to_dict()
            # remove the customer_id from the receipt
            receipt_data.pop('customer_id')
            receipts.append(receipt_data)

        return receipts
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error("Error fetching receipt: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.get("/v1/fetch_payment/{payment_id}", tags=["Order Endpoints"])
async def fetch_payment(payment_id: str, token_info: dict = Depends(verify_token)):
    """Fetch the receipt URL for a given payment."""
    try:
        if not ENABLE_PAYMENT:
            raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payment is disabled",
            )
        
        # check if the payment_id exists for that customer_id
        payment_ref = db.collection('payments').where('payment_id', '==', payment_id).where('customer_id', '==', token_info['sub']).stream()
        payment_data = next(payment_ref, None)

        if payment_data:
            # fetch the payment details
            payment_data = Payment(client).fetch(payment_id)
            payment_payload = {
                "id": payment_data['id'],
                "order_id": payment_data['order_id'],
                "status": payment_data['status'],
                "amount": payment_data['amount'],
                "currency": payment_data['currency'],
                "description": payment_data['description'],
            }
            return payment_payload
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error("Error fetching payment: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e

if __name__ == "__main__":

    # Use multiprocessing for parallel request handling
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
