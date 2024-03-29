"""This is the main file for the chatbot application."""
import logging
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
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
}

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    """Generic exception handler to catch unexpected errors."""
    logging.error("Unexpected error occurred: %s", exc)
    return {"message": "Internal server error", "detail": str(exc)}, 500


@app.post("/v1/chat", response_model=ChatResponse, tags=["OpenAI"])
async def chat_conversation(request: ChatRequest):
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


if __name__ == "__main__":
    import uvicorn

    # Use multiprocessing for parallel request handling
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info", workers=4)
