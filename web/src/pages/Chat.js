import React, { useEffect, useState, useRef, useCallback } from 'react';
import { UserCard } from '../components/UserCard';
import { AiCard } from '../components/AiCard';
import InputBar from '../components/InputBar';
import LoadingSpinner from '../components/LoadingSpinner'; // Import the LoadingSpinner component
import { Select, SelectItem, Button, Dropdown, DropdownTrigger, Avatar, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { modelOptions } from '../options/modelOptions';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { BsSendArrowUp } from "react-icons/bs";
import { AiOutlineReload } from 'react-icons/ai';
import { useNavigate, useLocation } from 'react-router-dom';
import DividerWithText from '../components/DividerWithText';
import StartNewChatButton from '../components/StartNewChatButton';
import { SettingsModal } from '../components/SettingsModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useDisclosure } from "@nextui-org/react";


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
  const [modal, setModal] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:5000';



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
        const response = await fetch(`${API_HOST}/v1/chat_by_id?chat_id=${chatId}`, {
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
          setSelectedModel(modelOptions.find((model) => model.value === data[data.length - 1].model));

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

      const response = await fetch(`${API_HOST}/v1/chat_title`, {
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

  const updateMessages = (userHistory, data, selectedModel) => {
    userHistory = userHistory.map((item, index) => {
      if (index === userHistory.length - 1) {
        return {...item, ai_message: item.ai_message + (data?.data || "")};
      }
      return item;
    });
  
    setMessages(prevMessages => prevMessages.map((item, index) => {
      if (index === prevMessages.length - 1) {
        return {...item, ai_message: item.ai_message + (data?.data || ""), model: selectedModel.value};
      }
      return item;
    }));
  }
  


  const getAIResponse = async (userMessage = userInput, history = messages, regenerateMessage = false) => {
    try {
      setIsLoading(true);
      setShowRetry(false);
      setIsRequestFailed(false);

      // Take the last 'historyLimit' history messages
      const historyLimit = Math.min(Math.max(parseInt(localStorage.getItem("history") || 10), 10), 30);
      localStorage.setItem("history", historyLimit); // Update the local storage with sanitized value

      if (history.length > historyLimit) {
        history = history.slice(history.length - historyLimit);
      }

      const requestData = {
        user_input: userMessage,
        chat_history: history,
        chat_model: selectedModel.value,
        temperature: parseFloat(localStorage.getItem("temperature") || 0.7),
        chat_id: chatId,
        regenerate_message: regenerateMessage
      };

      setUserInput(""); // Reset user input

      let userHistory = [{ ai_message: "", user_message: userMessage }];
      let idChat = chatId;

      await fetchEventSource(`${API_HOST}/v1/chat_event_streaming`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestData),
        onopen(response) {
          if (response.ok) {
            console.info("Event source connection established");
            setIsStreaming(true);
          } else {
            console.error("Failed to establish event source connection, status: ", response.status);
            setShowRetry(true);
          }
        },
        onmessage(event) {
          const data = JSON.parse(event.data);
          setIsLoading(false);

          if (chatId === null && data.is_final) {
            setChatId(data.chat_id);
            idChat = data.chat_id;
          }

          // Update messages and UI
          updateMessages(userHistory, data, selectedModel);
          scrollToBottom();
        },
        onclose() {
          console.info("Event source connection closed");
          setIsStreaming(false);
          setShowRetry(true);
          setIsLoading(false);
          if (messages.length === 0) {
            getTitle(userHistory, idChat);
          }
        },
        onerror(error) {
          console.error("Event source connection error: ", error);
          setIsStreaming(false);
          setIsLoading(false);
          setShowRetry(true);
          setIsRequestFailed(true);
        }
      });
    } catch (error) {
      console.error("Error in setting up event source:", error);
      setIsRequestFailed(true);
      setIsLoading(false);
    }
};




  return (
    <>
      <div className='flex justify-between items-center min-h-[8vh] fixed top-0 left-0 right-0 z-10 bg-white'>
        <div className='px-4 lg:px-6 flex items-center w-96'>
          <StartNewChatButton />
          <Select
            className="w-52 md:w-full ml-4"
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
        <div className='px-4 lg:px-6 flex items-center'>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                src={profilePicture}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="settings" onPress={() => {
                setModal('settings');
                onOpen();
              }}>My Settings</DropdownItem>
              <DropdownItem key="logout" color="danger" onPress={() => {
                setModal('logout');
                onOpen();
              }}>
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {modal === 'settings' && <SettingsModal isOpen={isOpen} onClose={onClose} />}
      {modal === 'logout' && <ConfirmationModal isOpen={isOpen} onClose={onClose} text="Are you sure you want to log out?" />}
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