
# Chat With LLMs

Chat With LLMs is a web-app which enables users to chat with various large language models(LLMs) from leading AI providers.
It allows users to switch models mid-conversation without losing any chat context.

## Overview 

This project integrates API-driven text generation using various Large Language Models (LLMs). The framework used to orchestrate these interactions is LangChain, allowing seamless integration and dynamic model selection across different providers.

Currently, the platform supports six distinct LLM providers, each offering a range of chat models:

Those are 
- OpenAI
- Anthropic
- Google
- Mistral
- Perplexity
- TogetherAI


## Tech Stack

- Backend : Python FastAPI Framework
- LLM Framework : Python LangChain
- Frontend : ReactJs
- Database : Google Firestore Database
- Hosting : Google Cloud Run
- CI/CD : Github Actions

## System Architecture

**Authentication** : The web application utilizes Google OAuth 2.0 for secure user authentication and login.

**Backend Server** : User messages are processed, and responses from the LLMs are generated using Python's FastAPI framework. The backend also integrates the LangChain framework, which is responsible for prompt generation and managing API calls to different LLM providers.

**Event Streaming** : Server-Sent Events (SSE) is a standard for real-time, one-way communication from a server to a client over HTTP. With SSE, the server can push the generated data token by token to the client without the client having to request them repeatedly.

**Firestore Database** : User information, chat details, and chat history are stored in Google's Firestore database. Firestore is chosen for its free tier, high performance, and auto-scaling capabilities, making it ideal for dynamic, growing applications.


**ReactJS Frontend** : The frontend is built with ReactJS, providing an interactive and responsive user interface for seamless interaction with the chat application. 

## Installation

Make a copy of the `.env.example` file and rename it to `.env` :

```bash
cp .env.example .env  # For Unix/Linux
copy .env.example .env  # For Windows
```

Open the `.env` file in a text editor and enter the necessary variables with their corresponding values. These variables typically API keys and other environment-specific configurations.

#### Recommended : Use Docker compose to start chat-with-llms.

```bash
docker-compose up
```

All the servies will be up and running on the following ports : 

```bash
Backend FastAPI : localhost:8080
ReactJS Frontend : localhost:3000
```

#### Without Docker 

1. Install pipenv using pip:
```bash
pip install pipenv
```

2. Install the required packages using pipenv and the provided Pipfile:

```bash
pipenv install
```

3. Start the backend server 
```bash
nodemon 
or 
uvicorn app:app --port 5000
```

4. Go to web folder and install node_modules
```
cd web
npm install
```

5. Start frontend server 
```
npm start
```

## Endpoints 

Access swagger docs using the link below

```bash
http://localhost:8080/docs
```
