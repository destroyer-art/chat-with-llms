import requests
import json

# API endpoint URL
url = "http://localhost:5000/v1/chat_event_streaming"

# JSON payload
payload = {
    "user_input": "Write a short paragraph",
    "chat_history": [],
    "chat_model": "gpt-3.5-turbo",
    "temperature": 0.8
}

# Headers
headers = {
    'Content-Type': 'application/json'
}

# Send the POST request
response = requests.post(url, headers=headers, data=json.dumps(payload), stream=True)

# Check if the request was successful
if response.status_code == 200:
    # Iterate over the streaming response
    for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
        if chunk:
            # Split the chunk into separate events
            events = chunk.split('\n\n')
            for event in events:
                # Parse the event JSON data
                print(event)
else:
    print(f"Error: {response.status_code} - {response.text}")