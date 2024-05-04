import React, { useState } from 'react';
import { Chat } from './Chat';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';  // Importing icons

export const Dashboard = () => {
    // State to manage the visibility of the sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);  // Start with the sidebar closed

    // Function to toggle sidebar visibility
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex min-h-screen">
            {/* Toggle button */}
            <button 
                className="p-2 text-white bg-blue-500 hover:bg-blue-700 fixed z-30 top-5 left-5"
                onClick={toggleSidebar}
                style={{ transition: 'all 0.3s' }}
            >
                {isSidebarOpen ? <FaArrowLeft /> : <FaArrowRight />}
            </button>

            {/* Sidebar with transition for sliding effect */}
            <div className={`bg-slate-700 h-full fixed z-20 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ transition: 'transform 0.3s', width: '256px' }}>
                SideNav
            </div>

            {/* Main content area, padding added for the sidebar */}
            <div className="flex-1 ml-[256px]">
                <Chat />
            </div>
        </div>
    );
}
