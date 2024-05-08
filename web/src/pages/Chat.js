import React, { useEffect, useState, useRef, useCallback } from 'react';
import { UserCard } from '../components/UserCard';
import { AiCard } from '../components/AiCard';
import InputBar from '../components/InputBar';
import LoadingSpinner from '../components/LoadingSpinner'; // Import the LoadingSpinner component
import { Select, SelectItem, Button } from '@nextui-org/react';
import { modelOptions } from '../options/modelOptions';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { BsSendArrowUp } from "react-icons/bs";
import { AiOutlineReload } from 'react-icons/ai';
import { useNavigate, useLocation } from 'react-router-dom';
import DividerWithText from '../components/DividerWithText';

export const Chat = (props) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const chatWindowRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showRetry, setShowRetry] = useState(false); // New state for retry
  const [isRequestFailed, setIsRequestFailed] = useState(false); // New state for request failed
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [profilePicture, setProfilePicture] = useState(localStorage.getItem('profilePicture'));
  const [chatId, setChatId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  let previousModel = null;

  const scrollToBottom = useCallback(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreaming) {
      e.preventDefault(); // Prevent the default action to avoid a new line being added
      onSend(userInput); // Call the onSend function with the userInput as an argument
    }
  };

  const onSend = async (message) => {
    // return if the message is empty or only contains spaces
    if (!message.trim()) return;
    const newMessages = [...messages];
    newMessages.push({
      ai_message: "",
      user_message: message,
      model: selectedModel.value
    });
    setMessages(newMessages);
    await getAIResponse();
  }

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom, messages]);

  const handleRetry = async (regenerateMessage = false) => {
    setIsRequestFailed(false); // set the request failed state to false
    // set user input to the last user message
    setUserInput(messages[messages.length - 1].user_message);
    // set the last AI message to an empty string
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const lastIndex = updatedMessages.length - 1;
      updatedMessages[lastIndex] = {
        ...updatedMessages[lastIndex],
        ai_message: "",
      };
      return updatedMessages;
    });

    // call the getAIResponse function to retry the last message
    await getAIResponse(messages[messages.length - 1].user_message, messages.slice(0, messages.length - 1), regenerateMessage);
  }

  useEffect(() => {
    if (chatId !== null) {
      // Append the chatId to the URL in path parameter without re-rendering the component
      navigate(`/chat/${chatId}`, { replace: true });
    }
  }, [chatId]);

  useEffect(() => {
    const fetchChatMessageDetails = async (chatId) => {
      try {
        const response = await fetch(`http://localhost:5000/v1/chat_by_id?chat_id=${chatId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // sort as per the updated_at field asc of time 
          data.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
          setMessages(() => {
            const newMessage = [];
            for (let i = 0; i < data.length; i++) {
              if (i !== 0 && data[i].regenerate_message === true)
                newMessage.pop();

              newMessage.push({
                ai_message: data[i].ai_message,
                user_message: data[i].user_message,
                model: data[i].model
              });
            }

            return newMessage;
          });
          // get model from the chat message
          setSelectedModel(modelOptions.find((model) => model.value === data[data.length-1].model));

        } else {
          console.error('Error fetching chat message details:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching chat message details:', error);
      }
    }
    
    // check if path parameter is there in the url 
    const path = window.location.pathname;
    // get the last part of the path
    const chatId = path.split('/').pop();
    if (chatId !== 'chat') {
      setChatId(chatId);
      fetchChatMessageDetails(chatId);
      setShowRetry(true);
    }

  }, [location.state, navigate]);


  const getTitle = async (userHistory, chatId) => {
    try {
      const requestData = {
        "user_input": userInput,
        "chat_history": userHistory,
        "chat_model": selectedModel.value,
        "temperature": 0.8,
        "chat_id": chatId,
      };

      const response = await fetch('http://localhost:5000/v1/chat_title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        await props.fetchUserChatHistory();
      } else {
        console.error('Error fetching chat title:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching chat title:', error);
      return null;
    }
  }


  const getAIResponse = async (userMessage = userInput, history = messages, regenerateMessage = false) => {
    try {
      setIsLoading(true);
      setShowRetry(false);
      setIsRequestFailed(false);
      const requestData = {
        "user_input": userMessage,
        "chat_history": history,
        "chat_model": selectedModel.value,
        "temperature": 0.8,
        "chat_id": chatId,
        "regenerate_message": regenerateMessage
      };
      setUserInput("");

      let userHistory = [
        {
          ai_message: "",
          user_message: userMessage
        }
      ];

      let idChat = chatId;

      await fetchEventSource("http://localhost:5000/v1/chat_event_streaming", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestData),
        onopen(res) {
          if (res.ok && res.status === 200) {
            console.log("Event source connection established");
            setIsStreaming(true);
          } else if (res.status === 403) {
            navigate('/'); // Redirect to the login page
          } else {
            console.error("Failed to establish event source connection");
          }
        },
        onmessage(event) {
          const data = JSON.parse(event.data);
          setIsLoading(true);

          if (chatId === null) {
            if (data.is_final)
              setChatId(data.chat_id);
            idChat = data.chat_id;
          }

          // update userHistory
          userHistory = ((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastIndex = updatedMessages.length - 1;
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              ai_message: updatedMessages[lastIndex].ai_message + data?.data || "",
            };
            return updatedMessages;
          })(userHistory);

          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastIndex = updatedMessages.length - 1;
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              ai_message: updatedMessages[lastIndex].ai_message + data?.data || "",
              model: selectedModel.value
            };
            return updatedMessages;
          });
          scrollToBottom();
        },
        onclose() {
          console.log("Event source connection closed");
          setIsStreaming(false);
          setShowRetry(true);
          setIsLoading(false);
          if (messages.length === 0) {
            getTitle(userHistory, idChat);
          }
        },
        onerror(error) {
          console.error("Event source connection error");
          setIsStreaming(false);
          setIsLoading(false);
          setShowRetry(true);
          setIsRequestFailed(true);
          throw error;
        }
      });
    } catch (error) {
      console.error("Error:", error);
      setIsRequestFailed(true);
      setIsLoading(false);
    }
  };


  return (
    <>
      <div className='flex justify-between min-h-[8dvh]'>
        <div className='px-4 lg:px-6 justify-start flex items-center w-96 fixed'>
          <Select
            className="w-52 md:w-full"
            selectedKeys={[selectedModel?.value]}
            onChange={(event) => setSelectedModel(
              modelOptions.find((model) => model.value === event.target.value)
            )} // Update selected model on change
            label="Select model"
            startContent={selectedModel?.companyLogo}
          >
            {modelOptions.map((model) => (
              <SelectItem
                key={model.value}
                className="max-w-xs"
                startContent={model.companyLogo}
              >
                {model.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div className="h-full flex-1 flex flex-col max-w-3xl mx-auto md:px-2 relative">
        <div className="flex-1 flex flex-col gap-3 px-4 pt-16 pb-16 mb-4 chat-window overflow-y-auto relative">
          {messages.map((message, index) => (
            <React.Fragment key={index}>
              {previousModel !== message.model && (
                <>
                  <DividerWithText text={previousModel = message.model} />
                </>
              )}

              {message.user_message !== "" && (
                <div className="w-full flex justify-end">
                  <UserCard message={message.user_message} profilePicture={profilePicture} />
                </div>
              )}
              {message.ai_message !== "" && (
                <div className="w-full flex justify-start">
                  <AiCard
                    message={message.ai_message}
                    retryComponent={messages.length - 1 === index && showRetry ? (
                      <button
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 rounded transition duration-300 ease-in-out"
                        onClick={() => {
                          handleRetry(true);
                        }}
                      >
                        <AiOutlineReload />
                      </button>
                    ) : null}
                  />
                </div>
              )}
            </React.Fragment>
          ))}

          {isLoading && messages.length > 0 && messages[messages.length - 1].ai_message === "" && (
            <div className="w-full flex justify-start">
              <LoadingSpinner /> {/* Render the LoadingSpinner component */}
            </div>
          )}

          <div ref={chatWindowRef} />

        </div>
        <div className="fixed inset-x-0 bottom-0 p-4">
          <div className="flex justify-center">
            {isRequestFailed ? (
              <div style={{ width: '30%' }}> {/* Container to control the width */}
                <Button
                  color="danger"
                  variant="shadow"
                  onClick={handleRetry}
                  className="w-full" // Make the button fill the container
                  startContent={<AiOutlineReload />}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <InputBar
                className="lg:max-w-3xl xl:max-w-4xl px-4 py-2"
                userInput={userInput}
                setUserInput={setUserInput}
                endContent={
                  <Button
                    isIconOnly
                    variant="faded"
                    aria-label="Send"
                    onClick={() => {
                      onSend(userInput);
                    }}
                    isDisabled={isStreaming}
                  >
                    <BsSendArrowUp />
                  </Button>
                }
                onKeyDown={handleKeyPress}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}