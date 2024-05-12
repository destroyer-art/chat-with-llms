import React, { useEffect, useState } from 'react';
import { Chat } from './Chat';
import { Card, CardBody } from "@nextui-org/react";
import { Link } from 'react-router-dom';
import chevronsLeft from '../images/chevrons-left.svg';
import chevronsRight from '../images/chevrons-right.svg';
import aiMind from '../images/ai-mind.svg';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Spinner } from '@nextui-org/react';

export const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

    const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:5000';


    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const limitSentence = (sentence) => {
        const words = sentence?.split(' ');
        return words?.length > 5 ? words?.slice(0, 5).join(' ') + '...' : sentence;
    }

    const fetchUserChatHistory = async (page = 1) => {
        try {
            const response = await fetch(`${API_HOST}/v1/chat_history?page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    setChatHistory(prevChats => {
                        const uniqueChats = data.filter(chat => !prevChats.some(prevChat => prevChat.chat_id === chat.chat_id));
                        // sort by last updated_at
                        return [...prevChats, ...uniqueChats];
                    });
                    setHasMoreChats(data.length === 10); // Assuming the API returns 10 items per page
                } else {
                    setHasMoreChats(false);
                }
            } else {
                console.error('Error fetching chat history:', response.statusText);
                setHasMoreChats(false);
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
            setHasMoreChats(false);
        }
    };

    useEffect(() => {
        if (chatHistory.length === 0 && accessToken) {
            fetchUserChatHistory(1);
        }
    }, []);


    return (
        <div className="flex min-h-screen">
            <button className="p-2 fixed z-30" onClick={toggleSidebar} style={{ transition: 'all 0.3s', top: '50%', left: isSidebarOpen ? '256px' : '0', transform: 'translateY(-50%)' }}>
                {isSidebarOpen ? <img src={chevronsLeft} alt='chevrons-left' className='text-gray-500 hover:text-black' /> : <img src={chevronsRight} alt='chevrons-right' className='text-gray-500 hover:text-black' />}
            </button>

            <div id="scrollableDiv" className={`bg-slate-700 h-full fixed z-20 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ transition: 'transform 0.3s', width: '256px', overflowY: 'auto' }}>
                <div className="flex items-center justify-start h-16 text-white font-bold ml-2">
                    <img src={aiMind} alt="ai-mind" className="h-10 w-10 pr-2" />
                    Chat With LLMs
                </div>

                <InfiniteScroll
                    dataLength={chatHistory.length}
                    next={() => fetchUserChatHistory((chatHistory.length / 10) + 1)}
                    hasMore={hasMoreChats}
                    loader={<div className="flex justify-center items-center"><Spinner color="secondary" /></div>}
                    endMessage={<p className="text-center">
                        <b>You have seen all chats</b>
                    </p>}
                    scrollableTarget="scrollableDiv"
                >
                    <div  className="grid grid-cols-1 pt-5 pl-5 pr-5 items-center justify-start">
                        {chatHistory.map((chat, index) => (
                            <Card shadow="none" className='bg-slate-700 hover:bg-slate-600 text-sm text-white' key={index}>
                                <CardBody>
                                    <Link to={{
                                        pathname: `/chat/${chat.chat_id}`,
                                        state: { chatId: chat.chat_id }
                                    }} className='hover:text-white'>
                                        {chat?.chat_title?.length > 0 ? limitSentence(chat?.chat_title) : null}
                                    </Link>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </InfiniteScroll>
            </div>

            <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-4'}`}>
                <Chat fetchUserChatHistory={fetchUserChatHistory} />
            </div>
        </div>
    );
}
