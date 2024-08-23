import React, { useState, useEffect } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { LuPlus } from "react-icons/lu";
import { Link } from "react-router-dom";
import { Tooltip, Spinner, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Avatar } from "@nextui-org/react";
import { MdExpandMore } from "react-icons/md";
import { useDisclosure } from "@nextui-org/react";
import { IoSettingsOutline } from "react-icons/io5";
import { AiOutlineLogout } from "react-icons/ai";
import { SettingsModal } from '../components/SettingsModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PlansModal } from "../components/PlansModal";
import { Payments } from "../components/Payments";

export const Sidebar = ({
    isSidebarOpen,
    setIsSidebarOpen,
    fetchUserChatHistory,
    chatHistory,
    setMessages,
    setChatId,
    hasMoreChats,
    isLoadingChatHistory,
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [modal, setModal] = useState(null);

    const limitSentence = (sentence) => {
        // limit chat title to 30 characters
        if (sentence.length > 25) {
            return sentence.substring(0, 25) + "...";
        }
    };

    return (
        <div className={`dark:bg-stone-900 dark:text-gray-200 bg-gray-100 text-gray-800 fixed inset-y-0 left-0 z-50 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${isSidebarOpen ? 'col-span-2' : 'hidden'} duration-500 p-4 flex flex-col h-full lg:h-screen`}>
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
                {modal === 'payments' && <Payments isOpen={isOpen} onClose={onClose} />}
            </div>
        </div>
    );
};

