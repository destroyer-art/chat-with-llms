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
from langchain_core.output_parsers import StrOutputParser
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

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

# Initialize a Firestore client with a specific service account key file
cred = credentials.Certificate("serviceAccount.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

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


class ChatResponse(BaseModel):
    """Chat response model for the chat endpoint."""

    response: str

class ChatEventStreaming(BaseModel):
    """Chat event streaming model for the chat endpoint."""
    event: str
    data: str
    is_final: bool

model_company_mapping = {
    "gpt-3.5-turbo": ChatOpenAI,
    "gpt-4-turbo-preview": ChatOpenAI,
    "gpt-4": ChatOpenAI,
    "claude-3-opus-20240229" : ChatAnthropic,
    "claude-3-sonnet-20240229" : ChatAnthropic,
    "claude-3-haiku-20240307" : ChatAnthropic,
    "mistral-tiny-2312": ChatMistralAI,
    "mistral-small-2312": ChatMistralAI,
    "mistral-small-2402": ChatMistralAI,
    "mistral-medium-2312": ChatMistralAI,
    "mistral-large-2402": ChatMistralAI,
    "gemini-pro": ChatGoogleGenerativeAI,
    "sonar-small-chat": ChatPerplexity,
    "sonar-small-online": ChatPerplexity,
    "sonar-medium-chat" : ChatPerplexity,
    "sonar-medium-online" : ChatPerplexity,
}

# Get the secret key from the environment variable
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
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


async def add_message_to_db(request, google_user_id, user_message, ai_message):
    """
    Background task to add the chat message to the database.
    """
    chat_id = None
    # check if chat_id key exists in the request
    if 'chat_id' in request:
        chat_id = request['chat_id']

    # check if the chat_id exists in the database
    chat_ref = db.collection('chats').document(chat_id)
    if chat_ref.get().exists:
        # check if the google_user_id matches the google_user_id in the chat
        chat_data = chat_ref.get().to_dict()
        if chat_data['google_user_id'] == google_user_id:

            chat_ref.update({
                'updated_at': google_firestore.SERVER_TIMESTAMP,
            })

            db.collection('chat_history').add({
                'ai_message': ai_message,
                'user_message': user_message,
                'chat_id': chat_id,
                'created_at': google_firestore.SERVER_TIMESTAMP,
                'updated_at': google_firestore.SERVER_TIMESTAMP,
            })
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden",
            )
    else:
        # create a new chat id and add the chat to the database
        chat_id = str(uuid.uuid4())
        chat_ref.set({
            'chat_id': chat_id,
            'google_user_id': google_user_id,
            'created_at': google_firestore.SERVER_TIMESTAMP,
            'updated_at': google_firestore.SERVER_TIMESTAMP,
        })

        db.collection('chat_history').add({
            'ai_message': ai_message,
            'user_message': user_message,
            'chat_id': chat_id,
            'created_at': google_firestore.SERVER_TIMESTAMP,
            'updated_at': google_firestore.SERVER_TIMESTAMP,
        })



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


@app.post("/v1/chat", response_model=ChatResponse, tags=["AI Endpoints"])
async def chat_conversation(request: ChatRequest, token_info: dict = Depends(verify_token)):
    """Chat endpoint for the OpenAI chatbot."""
    try:
        # Get the chat model from the request and create the corresponding chat instance
        chat_model = request.chat_model
        chat = model_company_mapping.get(chat_model)
        if chat is None:
            raise ValueError(f"Invalid chat model: {chat_model}")
        
        print("Chat model: ", chat_model)

        
        # Create the chat prompt and memory for the conversation
        chat = chat(
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
        conversation = LLMChain(llm=chat, memory=memory, prompt=prompt, verbose=True)

        # Seed the chat history with the user's input from the request
        for chat_history in request.chat_history:
            memory.chat_memory.add_user_message(chat_history.user_message)
            memory.chat_memory.add_ai_message(chat_history.ai_message)

        # Run the conversation.invoke method in a separate thread
        response = conversation.invoke(input=request.user_input)

        return ChatResponse(response=response["text"])
    except ValidationError as ve:
        # Handle validation errors specifically for better user feedback
        logging.error("Validation error: %s", ve)
        raise HTTPException(status_code=400, detail="Invalid request data") from ve
    except Exception as e:
        # Log and handle generic exceptions gracefully
        logging.error("Error processing chat request: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.post("/v1/chat_event_streaming", tags=["AI Endpoints"])
async def chat_event_streaming(request: ChatRequest, token_info: dict = Depends(verify_token)):
    """Chat Event Streaming endpoint for the OpenAI chatbot."""
    try:
        # Get the chat model from the request and create the corresponding chat instance
        chat_model = request.chat_model
        chat = model_company_mapping.get(chat_model)
        if chat is None:
            raise ValueError(f"Invalid chat model: {chat_model}")
    
        
        # Create the chat prompt and memory for the conversation
        chat = chat(
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
        async def event_streaming():
            nonlocal generated_ai_message
            for token in conversation.stream({"chat_history": memory.buffer, "user_input": request.user_input}):
                generated_ai_message += token
                response = ChatEventStreaming(event="stream", data=token, is_final=False)
                yield f"data: {json.dumps(jsonable_encoder(response))}\n\n"
            
            response = ChatEventStreaming(event="stream", data="", is_final=True)
            yield f"data: {json.dumps(jsonable_encoder(response))}\n\n"

            # Database update after streaming is completed
            await add_message_to_db(request, token_info['sub'], request.user_input, generated_ai_message)

        return StreamingResponse(event_streaming(), media_type="text/event-stream")
    except ValidationError as ve:
        # Handle validation errors specifically for better user feedback
        logging.error("Validation error: %s", ve)
        raise HTTPException(status_code=400, detail="Invalid request data") from ve
    except Exception as e:
        # Log and handle generic exceptions gracefully
        logging.error("Error processing chat request: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e

if __name__ == "__main__":
    import uvicorn

    # Use multiprocessing for parallel request handling
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
