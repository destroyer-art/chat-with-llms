import React, { useEffect, useState, useRef } from 'react';
import { UserCard } from '../components/UserCard';
import { AiCard } from '../components/AiCard';
import InputBar from '../components/InputBar';
import LoadingSpinner from '../components/LoadingSpinner'; // Import the LoadingSpinner component
import { Navbar, Select, SelectItem, Button } from '@nextui-org/react';
import { modelOptions } from '../options/modelOptions';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { BsSendArrowUp } from "react-icons/bs";
import { IoStopCircleOutline } from "react-icons/io5";

export const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const chatWindowRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const [isStreaming, setIsStreaming] = useState(false);

  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreaming) {
      e.preventDefault(); // Prevent the default action to avoid a new line being added
      onSend(userInput); // Call the onSend function with the userInput as an argument
    }
  };

  const onSend = (message) => {
    // return if the message is empty or only contains spaces
    if (!message.trim()) return;
    const newMessages = [...messages];
    newMessages.push({
      ai_message: "",
      user_message: message
    });
    setMessages(newMessages);
    getAIResponse();
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // const getAIResponse = async () => {
  //   try {
  //     setIsLoading(true); // Set loading state to true
  //     const requestData = {
  //       "user_input": userInput,
  //       "chat_history": messages,
  //       "chat_model": selectedModel.value,
  //       "temperature": 0.8
  //     }

  //     setUserInput("");

  //     const response = await fetch("http://localhost:5000/v1/chat", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify(requestData)
  //     });

  //     const data = await response.json();

  //     setMessages((prevMessages) => {
  //       const updatedMessages = [...prevMessages];
  //       const lastIndex = updatedMessages.length - 1;
  //       updatedMessages[lastIndex] = {
  //         ...updatedMessages[lastIndex],
  //         ai_message: data?.response || "",
  //       };
  //       return updatedMessages;
  //     });
  //   } catch (error) {
  //     console.error("Error:", error);
  //   } finally {
  //     setIsLoading(false); // Set loading state to false
  //   }
  // }

  const getAIResponse = async () => {
    try {
      setIsLoading(true);
      const requestData = {
        "user_input": userInput,
        "chat_history": messages,
        "chat_model": selectedModel.value,
        "temperature": 0.8
      };
      setUserInput("");

      await fetchEventSource("http://localhost:5000/v1/chat_event_streaming", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(requestData),
        onopen(res) {
          if (res.ok && res.status === 200) {
            console.log("Event source connection established");
          } else {
            console.error("Failed to establish event source connection");
          }
        },
        onmessage(event) {
          const data = JSON.parse(event.data);
          setIsLoading(false);
          setIsStreaming(true);

          // if isStreaming is false then stop the event source connection
          if (!isStreaming) {
            this.close();
          }
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastIndex = updatedMessages.length - 1;
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              ai_message: updatedMessages[lastIndex].ai_message + data?.data || "",
            };
            return updatedMessages;
          });
          scrollToBottom();
        },
        onclose() {
          console.log("Event source connection closed");
          setIsStreaming(false);
        },
        onerror() {
          console.error("Event source connection error");
          setIsStreaming(false);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
    }
  };


  return (
    <>
      <Navbar>
        <Select
          className="max-w-xs float-right"
          defaultSelectedKeys={[modelOptions[0].value]}
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
      </Navbar>
      <div className="h-full flex-1 flex flex-col max-w-3xl mx-auto md:px-2 relative">
        <div className="flex-1 flex flex-col gap-3 px-4 pt-16 mb-4 chat-window overflow-y-auto">
          {messages.map((message, index) => (
            <React.Fragment key={index}>
              {message.user_message !== "" && (
                <div className="w-full flex justify-end">
                  <UserCard message={message.user_message} />
                </div>
              )}
              {message.ai_message !== "" && (
                <div className="w-full flex justify-start">
                  <AiCard message={message.ai_message} />
                </div>
              )}
              {isLoading && message.ai_message === "" && ( // Render loading spinner for the last message if AI is generating response
                <div className="w-full flex justify-start">
                  <LoadingSpinner /> {/* Render the LoadingSpinner component */}
                </div>
              )}
            </React.Fragment>
          ))}
          <div ref={chatWindowRef} />
        </div>
        <div className="sticky inset-x-0 bottom-0 justify-center">
          <InputBar
            userInput={userInput}
            setUserInput={setUserInput}
            endContent={
              isStreaming ? (
                <Button
                  isIconOnly
                  variant="faded"
                  aria-label="Stop"
                  onClick={() => {
                    setIsStreaming(false);
                  }}
                >
                  <IoStopCircleOutline />
                </Button>
              ) : (
                <Button
                  isIconOnly
                  variant="faded"
                  aria-label="Send"
                  onClick={() => {
                    onSend(userInput);
                  }}
                >
                  <BsSendArrowUp />
                </Button>
              )
            }
            onKeyDown={handleKeyPress}
          />
        </div>
      </div >
    </>
  )
}