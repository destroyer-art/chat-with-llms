import React, { useEffect, useState } from "react";
import { Chat } from "./Chat";
import { Link } from "react-router-dom";
import aiMind from "../images/ai-mind.svg";
import { Spinner } from "@nextui-org/react";
import { HiMenuAlt3 } from "react-icons/hi";

export const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [chatHistory, setChatHistory] = useState([]);
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const [accessToken, setAccessToken] = useState(
        localStorage.getItem("accessToken")
    );
    const [isLoading, setIsLoading] = useState(false);

    const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:5000";

    const limitSentence = (sentence) => {
        // limit chat title to 30 characters
        if (sentence.length > 30) {
            return sentence.substring(0, 30) + "...";
        }
    };

    const fetchUserChatHistory = async (page = 1) => {
        try {
            setIsLoading(true);
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
                    setIsLoading(false);
                } else {
                    setHasMoreChats(false);
                    setIsLoading(false);
                }
            } else {
                console.error("Error fetching chat history:", response.statusText);
                setHasMoreChats(false);
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error fetching chat history:", error);
            setHasMoreChats(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (chatHistory.length === 0 && accessToken) {
            fetchUserChatHistory(1);
        }
    }, []);

    return (
        <>
            <section className="flex gap-6">
                <div className={`bg-[#0e0e0e] ${isSidebarOpen ? "w-72" : "w-16"} duration-500 text-gray-100 px-4 fixed h-screen overflow-y-auto`}>
                    {/* Top Heading */}
                    <div className="flex items-center justify-between mb-4 py-3">
                        {isSidebarOpen && (
                            <div className="flex items-center">
                                <img src={aiMind} alt="ai-mind" className="h-10 w-10 pr-2" />
                                <h1 className="text-xl font-bold">Chat With LLMs</h1>
                            </div>
                        )}

                        <HiMenuAlt3
                            size={26}
                            className="cursor-pointer"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        />
                    </div>

                    {/* Chat List */}
                    <div className="mt-4 flex flex-col gap-4 relative">
                        {chatHistory.map((chat, index) => (
                            <Link
                                key={chat.chat_id}
                                to={{
                                    pathname: `/chat/${chat.chat_id}`,
                                    state: { chatId: chat.chat_id }
                                }}
                                className="group flex items-center text-sm gap-3.5 font-medium p-2 hover:bg-gray-800 rounded-md"
                            >
                                <h2
                                    style={{ transitionDelay: `${index + 3}00ms` }}
                                    className={`whitespace-pre duration-500 ${!isSidebarOpen && "opacity-0 translate-x-28 overflow-hidden"}`}
                                >
                                    {chat?.chat_title?.length > 0 ? limitSentence(chat?.chat_title) : null}
                                </h2>
                            </Link>
                        ))}

                        {hasMoreChats && isSidebarOpen && (
                            <button
                                onClick={() => fetchUserChatHistory((chatHistory.length / 10) + 1)}
                                className="mt-2 mb-4 bg-gray-800 text-white py-2 px-4 hover:bg-gray-700 rounded-xl">
                                {isLoading ? <Spinner /> : "Load More"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`flex-1 transition-margin duration-500`}>
                    <Chat fetchUserChatHistory={fetchUserChatHistory} isSidebarOpen={isSidebarOpen} />
                </div>
            </section>

        </>
    );
};
