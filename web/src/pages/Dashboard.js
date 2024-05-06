import React, { useEffect, useState } from 'react';
import { Chat } from './Chat';
import { Card, CardBody } from "@nextui-org/react";
import { Link } from 'react-router-dom';
import chevronsLeft from '../images/chevrons-left.svg';
import chevronsRight from '../images/chevrons-right.svg';
import aiMind from '../images/ai-mind.svg';


export const Dashboard = () => {
    // State to manage the visibility of the sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);  // Start with the sidebar closed
    const [chatHistory, setChatHistory] = useState([]);  // Start with an empty chat history
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));  // Start with an empty access token

    // Function to toggle sidebar visibility
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const fetchUserChatHistory = async () => {
        try {
            const response = await fetch('http://localhost:5000/v1/chat_history', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                const data = await response.json();
                // sort the chat history by the latest chat (updated_at) first
                data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
                setChatHistory(data);
            } else {
                console.error('Error fetching chat history:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };


    useEffect(() => {
        console.log('Dashboard rendered')
        if (chatHistory.length === 0 && accessToken)
            fetchUserChatHistory();
    }, [accessToken]);

    return (
        <div className="flex min-h-screen">
            {/* Toggle button */}
            <button
                className="p-2 fixed z-30"
                onClick={toggleSidebar}
                style={{
                    transition: 'all 0.3s',
                    top: '50%',  // Align vertically to the middle
                    left: isSidebarOpen ? '256px' : '0',  // Move right when the sidebar is open
                    transform: 'translateY(-50%)'  // Center the button vertically
                }}
            >
                {isSidebarOpen ? <img src={chevronsLeft} alt='chevrons-left' className='text-gray-500 hover:text-black' /> : <img src={chevronsRight} alt='chevrons-right' className='text-gray-500 hover:text-black' />}
            </button>

            {/* Sidebar with transition for sliding effect */}
            <div className={`bg-slate-700 h-full fixed z-20 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ transition: 'transform 0.3s', width: '256px', overflowY: 'auto' }}>
                <div className="flex items-center justify-start h-16 text-white font-bold ml-2">
                    <img src={aiMind} alt="ai-mind" className="h-10 w-10 pr-2" />
                    Chat With LLMs
                </div>

                <div className="grid grid-cols-1 pt-5 pl-5 pr-5 items-center justify-start">
                    {chatHistory.map((chat, index) => (
                        <Card shadow="none" className='bg-slate-700 hover:bg-slate-600 text-sm text-white' key={index}>
                            <CardBody>
                                <Link to={{
                                    pathname: `/chat/${chat.chat_id}`,
                                    state: { chatId: chat.chat_id}
                                }} className='hover:text-white'
                                    
                                >
                                    {chat?.chat_title}
                                </Link>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Main content area, adjust margin based on sidebar state */}
            <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-4'}`}>
                <Chat fetchUserChatHistory={fetchUserChatHistory} />
            </div>
        </div>
    );
}
