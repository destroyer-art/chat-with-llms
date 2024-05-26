import React, { useEffect, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { LuPlus } from "react-icons/lu";
import { Tooltip, Spinner } from "@nextui-org/react";
import { MdExpandMore } from "react-icons/md";


export const DashboardV2 = () => {

    const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:5000";

    const [chatHistory, setChatHistory] = useState([]);
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const accessToken = localStorage.getItem("accessToken");

    const limitSentence = (sentence) => {
        // limit chat title to 30 characters
        if (sentence.length > 25) {
            return sentence.substring(0, 25) + "...";
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
        <div className="grid grid-cols-12 h-screen">
            <div className="bg-black text-white col-span-2 p-4">
                <div className="flex justify-between">
                    <button
                        className="w-10 h-10 rounded-full hover:bg-[#212121] text-white flex justify-center items-center"
                    >
                        <GiHamburgerMenu size={20} />
                    </button>
                    <Tooltip showArrow={true} content="New Chat" closeDelay={500} placement='right'>
                        <button
                            className="w-10 h-10 rounded-full hover:bg-[#212121] text-white flex justify-center items-center"
                        >
                            <LuPlus size="20" />
                        </button>
                    </Tooltip>
                </div>
                <div className="pt-10">
                    {isLoading && <div className="flex justify-center items-center">
                        <Spinner size="large" />
                        </div>}
                    <div className="h-96 overflow-y-auto scroll-container">
                        {chatHistory.map((chat, index) =>(
                            <div key={index} className="p-2 hover:bg-[#212121] hover:rounded-lg cursor-pointer font-light">
                                {chat?.chat_title?.length > 0 ? limitSentence(chat?.chat_title) : "Untitled Chat"}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="pt-2">
                    <div className="p-2 hover:bg-[#212121] hover:rounded-lg cursor-pointer text-center flex">
                        {!isLoading && hasMoreChats && <div className="w-10 h-10 rounded-full flex justify-center items-center">
                            <MdExpandMore size={20} />
                        </div>}
                        
                        <button className="pl-4" 
                            onClick={() => fetchUserChatHistory((chatHistory.length / 10) + 1)}
                            disabled={isLoading || !hasMoreChats}
                        >
                            {isLoading ? null : hasMoreChats ? "Show More" : "Reached the bottom"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="col-span-10 bg-cyan-200 p-4">
                World
            </div>
        </div>
    );
};
