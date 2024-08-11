import React, { useEffect, useState, useCallback, useRef } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { TbPremiumRights } from "react-icons/tb";
import { LuPlus } from "react-icons/lu";
import { Link, useParams } from "react-router-dom";
import { Tooltip, Spinner, Avatar, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Select, SelectItem } from "@nextui-org/react";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { MdExpandMore } from "react-icons/md";
import { useDisclosure } from "@nextui-org/react";
import { SettingsModal } from '../components/SettingsModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { IoSettingsOutline } from "react-icons/io5";
import { AiOutlineLogout } from "react-icons/ai";
import { modelOptions } from '../options/modelOptions';
import { BsSendArrowUp } from "react-icons/bs";
import InputBar from "../components/InputBar";
import { UserCard } from '../components/UserCard';
import { AiCard } from '../components/AiCard';
import DividerWithText from '../components/DividerWithText';
import loading from '../images/loading.webp';
import { AiOutlineReload } from 'react-icons/ai';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlansModal } from "../components/PlansModal";

export const DashboardV2 = () => {
    const { chatIdParams } = useParams();
    const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:5000";

    const [chatId, setChatId] = useState(null);

    const [chatHistory, setChatHistory] = useState([]);
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
    const [isLoadingGeneratingChat, setIsLoadingGeneratingChat] = useState(false);
    const accessToken = localStorage.getItem("accessToken");
    const [modal, setModal] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
    const [messages, setMessages] = useState([]);
    let previousModel = null;
    let profilePicture = localStorage.getItem("profilePicture");
    const [messageByIdLoading, setMessageByIdLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [showRetry, setShowRetry] = useState(false); // New state for retry
    const [isRequestFailed, setIsRequestFailed] = useState(false); // New state for request failed
    const chatWindowRef = useRef(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [freshChat, setFreshChat] = useState(true);
    const [generationsLeft, setGenerationsLeft] = useState(0);

    const limitSentence = (sentence) => {
        // limit chat title to 30 characters
        if (sentence.length > 25) {
            return sentence.substring(0, 25) + "...";
        }
    };

    const fetchUserChatHistory = async (page = 1) => {
        try {
            setIsLoadingChatHistory(true);
            const response = await fetch(`${API_HOST}/v1/chat_history?page=${page}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    setChatHistory((prevChats) => {
                        const uniqueChats = data.filter(
                            (chat) =>
                                !prevChats.some((prevChat) => prevChat.chat_id === chat.chat_id)
                        );
                        // sort by last updated_at
                        return [...prevChats, ...uniqueChats];
                    });
                    setHasMoreChats(data.length === 10); // Assuming the API returns 10 items per page
                    setIsLoadingChatHistory(false);
                }
            } else {
                console.error("Error fetching chat history:", response.statusText);
                setHasMoreChats(false);
                setIsLoadingChatHistory(false);
            }
        } catch (error) {
            console.error("Error fetching chat history:", error);
            setHasMoreChats(false);
            setIsLoadingChatHistory(false);
        }
    };


    useEffect(() => {
        console.log("Modal: ", modal);
    }, [modal]);

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
                await fetchUserChatHistory();
            } else {
                console.error('Error fetching chat title:', response.statusText);
                return null;
            }
        } catch (error) {
            console.error('Error fetching chat title:', error);
            return null;
        }
    };

    const getAIResponse = async (userMessage = userInput, history = messages, regenerateMessage = false) => {
        try {
            setIsLoadingGeneratingChat(true);
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
                openWhenHidden: true, // Opt out of visibility handling
                onopen(response) {
                    if (response.ok) {
                        console.info("Event source connection established");
                        setIsStreaming(true);
                    } else {
                       
                        if (response.status === 403){
                            setGenerationsLeft(0);
                            console.log("Generations left exhausted");
                            // open the plans modal
                            setModal('plans');
                        }
                        setShowRetry(true);
                        console.error("Failed to establish event source connection, status: ", response.status);
                        throw new Error("Failed to establish event source connection");
                    }
                },
                onmessage(event) {
                    const data = JSON.parse(event.data);
                    setIsLoadingGeneratingChat(false);

                    if (chatId === null && data.is_final) {
                        setChatId(data.chat_id);
                        idChat = data.chat_id;
                    }

                    // Update messages and UI
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
                    console.info("Event source connection closed");
                    setIsStreaming(false);
                    setShowRetry(true);
                    setIsLoadingGeneratingChat(false);
                    if (freshChat) {
                        setFreshChat(false);
                        getTitle(userHistory, idChat);
                    }
                    setGenerationsLeft((prevGenerationsLeft) => prevGenerationsLeft - 1);
                },
                onerror(error) {
                    console.error("Event source connection error: ", error);
                    setIsStreaming(false);
                    setIsLoadingGeneratingChat(false);
                    setShowRetry(true);
                    setIsRequestFailed(true);
                    throw error;
                }
            });
        } catch (error) {
            console.error("Error in setting up event source:", error);
            setIsRequestFailed(true);
            setIsLoadingGeneratingChat(false);
        }
    };

    const scrollToBottom = useCallback(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollIntoView({ behavior: 'auto' });
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
        if (chatHistory.length === 0 && accessToken) {
            fetchUserChatHistory(1);
        }
    }, []);

    useEffect(() => {
        if (chatId !== null) {
            // Append the chatId to the URL in path parameter without re-rendering the component
            const url = new URL(window.location);
            url.pathname = `/chat/${chatId}`;
            window.history.replaceState({}, '', url);
        }
    }, [chatId]);


    useEffect(() => {
        const fetchChatMessageDetails = async (chatIdParams) => {
            try {
                setMessageByIdLoading(true);
                const response = await fetch(`${API_HOST}/v1/chat_by_id?chat_id=${chatIdParams}`, {
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
                    setMessageByIdLoading(false);
                } else {
                    console.error('Error fetching chat message details:', response.statusText);
                    setMessageByIdLoading(false);
                }
            } catch (error) {
                console.error('Error fetching chat message details:', error);
                setMessageByIdLoading(false);
            }
        }
        if (chatIdParams) {
            setShowRetry(true);
            setChatId(chatIdParams);
            fetchChatMessageDetails(chatIdParams);
        }
    }, [chatIdParams]);

    useEffect(() => {
        // get the number of generations left
        const getGenerationsLeft = async () => {
            try {
                const response = await fetch(`${API_HOST}/v1/generations`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setGenerationsLeft(data.generations_left);
                }
            } catch (error) {
                console.error('Error fetching generations left:', error);
            }
        }
        getGenerationsLeft();
    }, [accessToken]);

    return (
        <div className="grid grid-cols-12 h-screen dark:bg-zinc-900">
            {/* Sidebar */}
            <div className={`dark:bg-stone-900 dark:text-gray-200 bg-gray-100 text-gray-800 fixed inset-y-0 left-0 z-50 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${isSidebarOpen ? 'col-span-2' : 'hidden'} duration-500 p-4 flex flex-col h-full lg:h-screen`}
            >
                <div className="flex justify-between">
                    <button
                        className="w-10 h-10 rounded-full dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-200 text-gray-800 flex justify-center items-center"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <GiHamburgerMenu size={20} />
                    </button>
                    <Tooltip showArrow={true} content="New Chat" closeDelay={500} placement='right'>
                        <Link
                            to="/chat"
                            onClick={() => {
                                setMessages([]);
                                setChatId(null);
                            }}
                        >
                            <button
                                className="w-10 h-10 rounded-full dark:hover:bg-gray-600 dark:text hover:bg-gray-200  flex justify-center items-center"
                            >
                                <LuPlus size="20" />
                            </button>
                        </Link>
                    </Tooltip>
                </div>
                <div className="pt-10">
                    {isLoadingChatHistory && <div className="flex justify-center items-center">
                        <Spinner size="large" />
                    </div>}
                    <div className="h-96 overflow-y-auto scroll-container">
                        {chatHistory.map((chat, index) => (
                            <Link
                                to={`/chat/${chat.chat_id}`}
                                key={chat.chat_id}
                            >
                                <div key={index} className="p-2 dark:hover:bg-gray-600 hover:bg-gray-200 hover:rounded-lg cursor-pointer font-light">
                                    {chat?.chat_title?.length > 0 ? limitSentence(chat?.chat_title) : "Untitled Chat"}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="pt-2">
                    <div className="p-2 dark:hover:bg-gray-600 hover:bg-gray-200 hover:rounded-lg cursor-pointer text-center flex">
                        {!isLoadingChatHistory && hasMoreChats && <div className="w-10 h-10 rounded-full flex justify-center items-center">
                            <MdExpandMore size={20} />
                        </div>}

                        <button className="pl-4"
                            onClick={() => fetchUserChatHistory((chatHistory.length / 10) + 1)}
                            disabled={isLoadingChatHistory || !hasMoreChats}
                        >
                            {isLoadingChatHistory ? null : hasMoreChats ? "Show More" : "Reached the bottom"}
                        </button>
                    </div>
                </div>
                {/* this div will be at the bottom of the sidenav bar */}
                <div className="pt-2 mt-auto flex justify-between">
                    <Dropdown placement="top">
                        <DropdownTrigger>
                            <Button className="bg-inherit dark:text-gray-200 dark:hover:bg-gray-600 text-gray-800 p-2 hover:rounded-lg hover:bg-gray-200" startContent={<Avatar
                                src={localStorage.getItem("profilePicture")}
                                alt="profile-pic"
                                size="large"
                            />}>
                                {localStorage.getItem("username")}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Profile Actions" variant="flat">
                            <DropdownItem key="settings" startContent={<IoSettingsOutline />} showDivider onPress={() => {
                                setModal('settings');
                                onOpen();
                            }}>
                                My Settings
                            </DropdownItem>
                            <DropdownItem key="logout" color="danger" startContent={<AiOutlineLogout />} onPress={() => {
                                setModal('logout');
                                onOpen();
                            }}>
                                Log Out
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                    {modal === 'settings' && <SettingsModal isOpen={isOpen} onClose={onClose} />}
                    {modal === 'logout' && <ConfirmationModal isOpen={isOpen} onClose={onClose} text="Are you sure you want to log out?" />}
                    {modal === 'plans' && <PlansModal isOpen={isOpen} onClose={onClose} />}
                </div>
            </div>


            <div className={`${isSidebarOpen ? 'col-span-12 lg:col-span-10' : 'col-span-12'} flex flex-col h-screen overflow-y-auto md:ml-0`}>
                <div className="flex flex-col h-screen w-full">
                    {/* Navbar */}
                    <div className="flex justify-between items-center sticky top-0 h-16 px-2 z-10">
                        <div className="w-16">
                            {!isSidebarOpen && (
                                <button
                                    className={`w-10 h-10 rounded-full ${isSidebarOpen ? 'dark:text-gray-200 dark:hover:bg-gray-600 text-white hover:bg-[#212121]' : 'dark:text-gray-200 dark:hover:bg-gray-600 text-black hover:bg-[#efebeb]'
                                        } flex justify-center items-center`}
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                >
                                    <GiHamburgerMenu size={20} />
                                </button>
                            )}
                        </div>
                        {!isSidebarOpen && (
                            <div className="w-12 justify-start hidden md:block">
                                <Tooltip showArrow={true} content="New Chat" closeDelay={500} placement="right">
                                    <Link
                                        to="/chat"
                                        onClick={() => {
                                            setMessages([]);
                                            setChatId(null);
                                        }}
                                    >
                                        <button className="w-10 h-10 rounded-full dark:hover:bg-gray-600 hover:bg-gray-100 flex justify-center items-center">
                                            <LuPlus size="20" />
                                        </button>
                                    </Link>
                                </Tooltip>
                            </div>
                        )}
                        <div className="w-8/12 flex items-center justify-right md:w-2/12 md:justify-start">
                            <Select
                                className="w-52 md:w-full ml-4"
                                selectedKeys={[selectedModel?.value]}
                                onChange={(event) => {
                                        // check for plus subscription
                                        let selectedModel = modelOptions.find((model) => model.value === event.target.value);
                                        setSelectedModel(selectedModel);
                                    }
                                }
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
                        <div className="w-9/12 flex justify-end items-center pr-3">
                            <Dropdown placement="bottom-end">
                                <DropdownTrigger>
                                    <Avatar
                                        isBordered
                                        as="button"
                                        className="transition-transform"
                                        src={localStorage.getItem("profilePicture")}
                                    />
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Profile Actions" variant="flat">
                                    <DropdownItem key="profile" className="h-14 gap-2">
                                        <p className="font-semibold">{localStorage.getItem("username")}</p>
                                        <p className="font-semibold">{generationsLeft} generations remaining</p>
                                    </DropdownItem>
                                    <DropdownItem key="plans" startContent={<TbPremiumRights />} showDivider onPress={() => {
                                        setModal('plans');
                                        onOpen();
                                    }}>
                                        My Plans
                                    </DropdownItem>
                                    <DropdownItem
                                        key="settings"
                                        startContent={<IoSettingsOutline />}
                                        showDivider
                                        onPress={() => {
                                            setModal('settings');
                                            onOpen();
                                        }}
                                    >
                                        My Settings
                                    </DropdownItem>
                                    <DropdownItem
                                        key="logout"
                                        color="danger"
                                        startContent={<AiOutlineLogout />}
                                        onPress={() => {
                                            setModal('logout');
                                            onOpen();
                                        }}
                                    >
                                        Log Out
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>

                    </div>

                    <div className={`flex flex-col flex-grow items-center ${messageByIdLoading ? "justify-center" : ""} overflow-y-auto scroll-container pr-1 pl-1`}>
                        {messageByIdLoading ? <div className="flex justify-center items-center">
                            <img src={loading} alt="loading" width={100} height={100} />
                        </div> : <div className="w-full max-w-4xl py-2 flex flex-col gap-3 px-4">
                            {messages.map((message, index) => (
                                <React.Fragment key={index}>
                                    {previousModel !== message.model && (
                                        <>
                                            <DividerWithText text={previousModel = message.model} color={modelOptions.find(
                                                (model) => model.value === message.model
                                            ).color}
                                            />
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
                                                        className={`flex items-center gap-2 dark:text-gray-400 dark:hover:text-white p-2 rounded transition duration-300 ease-in-out`}
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

                            {isLoadingGeneratingChat && messages.length > 0 && messages[messages.length - 1].ai_message === "" && (
                                <div className="w-full flex justify-start">
                                    <LoadingSpinner /> {/* Render the LoadingSpinner component */}
                                </div>
                            )}

                            <div ref={chatWindowRef} />

                        </div>}

                    </div>

                    <div className="flex justify-center items-center flex-none px-4 sticky bottom-0">
                        {isRequestFailed ? (
                            <div style={{ width: '30%' }}> {/* Container to control the width */}
                                <Button
                                    color="danger"
                                    variant="shadow"
                                    onClick={() => handleRetry(false)}
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
                            />)}
                    </div>
                </div>

            </div>
        </div>
    );
};
