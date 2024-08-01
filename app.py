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
from razorpay.resources.plan import Plan


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
PLAN_ID = get_environment_variable("PLAN_ID")

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

class SubscriptionRequest(BaseModel):
    """Subscription request model for the subscription endpoint."""
    redirect_url: str

model_company_mapping = {
    "gpt-3.5-turbo": {
        "model" : ChatOpenAI,
        "premium" : False,
    },
    "gpt-4-turbo-preview": {
        "model" : ChatOpenAI,
        "premium" : True,
    },
    "gpt-4": {
        "model" : ChatOpenAI,
        "premium" : True,
    },
    "gpt-4o-mini" : {
        "model" : ChatOpenAI,
        "premium" : False,
    },
    "gpt-4o": {
        "model" : ChatOpenAI,
        "premium" : True,
    },
    "claude-3-opus-20240229" : {
        "model" : ChatAnthropic,
        "premium" : True,
    },
    "claude-3-sonnet-20240229" : {
        "model" : ChatAnthropic,
        "premium" : True,
    },
    "claude-3-haiku-20240307" : {
        "model" : ChatAnthropic,
        "premium" : False,
    },
    "claude-3-5-sonnet-20240620" : {
        "model" : ChatAnthropic,
        "premium" : True,
    },
    "mistral-tiny-2312": {
        "model" : ChatMistralAI,
        "premium" : False,
    },
    "mistral-small-2312": {
        "model" : ChatMistralAI,
        "premium" : False,
    },
    "mistral-small-2402": {
        "model" : ChatMistralAI,
        "premium" : False,
    },
    "mistral-medium-2312": {
        "model" : ChatMistralAI,
        "premium" : True,
    },
    "mistral-large-2402": {
        "model" : ChatMistralAI,
        "premium" : True,
    },
    "gemini-1.0-pro": {
        "model" : ChatGoogleGenerativeAI,
        "premium" : False,
    },
    "gemini-1.5-flash-latest": {
        "model" : ChatGoogleGenerativeAI,
        "premium" : False,
    },
    "gemini-1.5-pro-latest": {
        "model" : ChatGoogleGenerativeAI,
        "premium" : True,
    },
    "sonar-small-chat": {
        "model" : ChatPerplexity,
        "premium" : False,
    },
    "sonar-small-online": {
        "model" : ChatPerplexity,
        "premium" : True,
    },
    "sonar-medium-chat" : {
        "model" : ChatPerplexity,
        "premium" : False,
    },
    "sonar-medium-online" : {
        "model" : ChatPerplexity,
        "premium" : True,
    },
    "codellama/CodeLlama-34b-Instruct-hf": {
        "model" : ChatTogether,
        "premium" : False,
    },
    "codellama/CodeLlama-70b-Instruct-hf": {
        "model" : ChatTogether,
        "premium" : True,
    },
    "meta-llama/Llama-2-13b-chat-hf": {
        "model" : ChatTogether,
        "premium" : False,
    },
    "meta-llama/Llama-2-70b-chat-hf": {
        "model" : ChatTogether,
        "premium" : True,
    },
    "meta-llama/Llama-3-8b-chat-hf" : {
        "model" : ChatTogether,
        "premium" : False,
    },
    "meta-llama/Llama-3-70b-chat-hf": {
        "model" : ChatTogether,
        "premium" : True,
    },
    "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" : {
        "model" : ChatTogether,
        "premium" : True,
    },
    "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" : {
        "model" : ChatTogether,
        "premium" : True,
    },
    "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo" : {
        "model" : ChatTogether,
        "premium" : True,
    },
    "google/gemma-2b-it": {
        "model" : ChatTogether,
        "premium" : False,
    },
    "google/gemma-7b-it": {
        "model" : ChatTogether,
        "premium" : False,
    },
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


def add_message_to_db(request, google_user_id, user_message, ai_message):
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
                    'model' : request.chat_model
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
                'model' : request.chat_model
            })
        except Exception as e:
            logging.error(f'Error creating new chat: {e}')
            return None

    return chat_id

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


def verify_active_subscription(token_info: dict = Depends(verify_google_token)):
    """Verify the active subscription for the user."""

    # check if the customer has a subscription
    subscription_ref = db.collection('subscriptions').where('customer_id', '==', token_info['sub']).stream()

    # check if the customer has an active subscription
    for doc in subscription_ref:
        subscription_data = doc.to_dict()
        subscription_status = subscription.fetch(subscription_data['subscription_id'])['status']
        if subscription_status == 'active':
            return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Forbidden",
    )

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




# @app.post("/v1/chat", response_model=ChatResponse, tags=["AI Endpoints"])
# async def chat_conversation(request: ChatRequest, token_info: dict = Depends(verify_token)):
#     """Chat endpoint for the OpenAI chatbot."""
#     try:
#         # Get the chat model from the request and create the corresponding chat instance
#         chat_model = request.chat_model
#         chat = model_company_mapping.get(chat_model)
#         if chat is None:
#             raise ValueError(f"Invalid chat model: {chat_model}")
        
#         print("Chat model: ", chat_model)

        
#         # Create the chat prompt and memory for the conversation
#         chat = chat(
#             model_name=chat_model,
#             model=chat_model,
#             temperature=request.temperature,
#         )


#         prompt = ChatPromptTemplate(
#             messages=[
#                 # SystemMessagePromptTemplate.from_template(""),
#                 MessagesPlaceholder(variable_name="chat_history"),
#                 HumanMessagePromptTemplate.from_template("{user_input}"),
#             ]
#         )
#         memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
#         conversation = LLMChain(llm=chat, memory=memory, prompt=prompt, verbose=False)

#         # Seed the chat history with the user's input from the request
#         for chat_history in request.chat_history:
#             memory.chat_memory.add_user_message(chat_history.user_message)
#             memory.chat_memory.add_ai_message(chat_history.ai_message)

#         # Run the conversation.invoke method in a separate thread
#         response = conversation.invoke(input=request.user_input)

#         return ChatResponse(response=response["text"])
#     except ValidationError as ve:
#         # Handle validation errors specifically for better user feedback
#         logging.error("Validation error: %s", ve)
#         raise HTTPException(status_code=400, detail="Invalid request data") from ve
#     except Exception as e:
#         # Log and handle generic exceptions gracefully
#         logging.error("Error processing chat request: %s", e)
#         raise HTTPException(status_code=500, detail="Internal server error") from e

@app.post("/v1/chat_event_streaming", tags=["AI Endpoints"])
async def chat_event_streaming(request: ChatRequest, token_info: dict = Depends(verify_token)):
    """Chat Event Streaming endpoint for the OpenAI chatbot."""
    try:
        # Get the chat model from the request and create the corresponding chat instance
        chat_model = request.chat_model
        chat_config = model_company_mapping.get(chat_model)

        if not chat_config:
            raise ValueError(f"Invalid chat model: {chat_model}")

        if chat_config['premium']:
            if not verify_active_subscription(token_info):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden",
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

        # Run the conversation.invoke method in a separate thread
        def event_streaming():
            nonlocal generated_ai_message
            try:
                for token in conversation.stream({"chat_history": memory.buffer, "user_input": request.user_input}):
                    generated_ai_message += token
                    response = ChatEventStreaming(event="stream", data=token, is_final=False)
                    yield f"data: {json.dumps(jsonable_encoder(response))}\n\n"
                

                # Database update after streaming is completed
                chat_id = add_message_to_db(request, token_info['sub'], request.user_input, generated_ai_message)

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
    except Exception as e:
        # Log and handle generic exceptions gracefully
        logging.error("Error processing chat request: %s", e)
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
        chat_model = request.chat_model
        chat_config = model_company_mapping.get(chat_model)

        if not chat_config:
            raise ValueError(f"Invalid chat model: {chat_model}")

        if chat_config['premium']:
            if not verify_active_subscription(token_info):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden",
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
        conversation = LLMChain(llm=chat, memory=memory, prompt=prompt, verbose=False)

        # Seed the chat history with the user's input from the request
        for chat_history in request.chat_history:
            memory.chat_memory.add_user_message(chat_history.user_message)
            memory.chat_memory.add_ai_message(chat_history.ai_message)

        # Run the conversation.invoke method in a separate thread
        response = conversation.invoke(input="Generate 5 words sentence title for the above chat. \n Note : do not show creativity")

        # clean the response of extra "" or /
        response["text"] = response["text"].replace('"', '').replace("/", "")

        # Database update after streaming is completed
        update_chat_title(request.chat_id, response["text"])

        return ChatResponse(response=response["text"])
    except ValidationError as ve:
        # Handle validation errors specifically for better user feedback
        logging.error("Validation error: %s", ve)
        raise HTTPException(status_code=400, detail="Invalid request data") from ve
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

@app.post("/v1/subscriptions", tags=["Subscription Endpoints"])
async def get_subscriptions(request: SubscriptionRequest, token_info: dict = Depends(verify_token)):
    """Get the subscriptions for the user."""
    # create a subscription object using customer id as token_info['sub'] and plan id as PLAN_ID
    try:
        
        # check if customer id exists in the database
        customer_ref = db.collection('users').document(token_info['sub'])
        customer_data = customer_ref.get()

        # check if the customer has a subscription
        subscription_ref = db.collection('subscriptions').where('customer_id', '==', token_info['sub']).stream()

        # check if the customer has an active subscription
        for doc in subscription_ref:
            subscription_data = doc.to_dict()
            print(subscription_data['subscription_id'])
            subscription_status = subscription.fetch(subscription_data['subscription_id'])['status']
            if subscription_status == 'active':
                # return the 400 status code with message
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Subscription already exists",
                )

        subscription_data = {
            "plan_id": PLAN_ID,
            "total_count":6,
            "quantity": 1,
            "notify_info" : {
                "notify_email" : customer_data.to_dict()['email']
            },
            "notes": {
                "redirect_url": request.redirect_url
            },
            # make expire_by 10 mins from now
            "expire_by" : int(datetime.datetime.now().timestamp()) + 600
           
        }
        
        subscription_response = subscription.create(subscription_data)

        # save the subscription id in the database
        db.collection('subscriptions').add({
            'subscription_id': subscription_response['id'],
            'customer_id': token_info['sub'],
            'created_at': google_firestore.SERVER_TIMESTAMP,
            'updated_at': google_firestore.SERVER_TIMESTAMP,
        })

        return subscription_response


    except HTTPException as e:
        raise e
    
    except Exception as e:
        logging.error("Error getting subscriptions: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.get("/v1/fetch_subscription", tags=["Subscription Endpoints"])
async def fetch_subscription(token_info: dict = Depends(verify_token)):
    """Fetch the subscription for the user."""
    try:
        subscription_ref = db.collection('subscriptions').where('customer_id', '==', token_info['sub']).stream()
        subscription_list = [doc.to_dict() for doc in subscription_ref]

        if subscription_list:
            # Sort the subscription data by updated_at
            sorted_subscription_list = sorted(subscription_list, key=lambda x: x['updated_at'], reverse=True)
            sorted_subscription_info = [
                {
                    "subscription_id": sub["subscription_id"],
                    "created_at": sub["created_at"],
                    "updated_at": sub["updated_at"]
                }
                for sub in sorted_subscription_list
            ]
            return sorted_subscription_info
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )
    except Exception as e:
        logging.error("Error fetching subscription: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.get("/v1/subscriptions/{subscription_id}/status", tags=["Subscription Endpoints"])
async def get_subscription_status(subscription_id: str, token_info: dict = Depends(verify_token)):
    """Get the subscription status for the user."""
    try:
        subscription_data = subscription.fetch(subscription_id)
        # return the current status of the subscription
        status = subscription_data['status']
        return {"status": status}

    except Exception as e:
        logging.error("Error getting subscription status: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.get("/v1/plans", tags=["Subscription Endpoints"])
async def get_plans(token_info: dict = Depends(verify_token)):
    """Get the plans for the user."""
    try:
        # fetch the plan details using PLAN_ID
        plan = Plan(client).fetch(PLAN_ID)
        # convert plan amount to float by dividing by 100
        amount = plan['item']['amount'] / 100

        plan_response = {
            "plan_id": plan['id'],
            "name": plan['item']['name'],
            "amount": amount,
            "currency": plan['item']['currency'],
        }
        return plan_response
    except Exception as e:
        logging.error("Error getting plans: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.get("/v1/is_user_subscribed", tags=["Subscription Endpoints"])
async def is_user_subscribed(token_info: dict = Depends(verify_token)):
    """Check if the user is subscribed."""
    try:
        # check if the customer has a subscription
        subscription_ref = db.collection('subscriptions').where('customer_id', '==', token_info['sub']).stream()

        # check if the customer has an active subscription
        for doc in subscription_ref:
            subscription_data = doc.to_dict()
            subscription_status = subscription.fetch(subscription_data['subscription_id'])['status']
            if subscription_status == 'active':
                return {"subscribed": True}
        
        return {"subscribed": False}
    except Exception as e:
        logging.error("Error checking if user is subscribed: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e

if __name__ == "__main__":

    # Use multiprocessing for parallel request handling
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
