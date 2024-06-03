import React, { useEffect, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { LuPlus } from "react-icons/lu";
import { Tooltip, Spinner, Avatar, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Select, SelectItem } from "@nextui-org/react";
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


export const DashboardV2 = () => {

    const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:5000";

    const [chatHistory, setChatHistory] = useState([]);
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const accessToken = localStorage.getItem("accessToken");
    const [modal, setModal] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedModel, setSelectedModel] = useState(modelOptions[0]);

    const { isOpen, onOpen, onClose } = useDisclosure();

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
            {/* Sidebar */}
            <div className={`bg-black text-white ${isSidebarOpen ? 'col-span-2' : 'hidden'} p-4 flex flex-col h-full`}>
                <div className="flex justify-between">
                    <button
                        className="w-10 h-10 rounded-full hover:bg-[#212121] text-white flex justify-center items-center"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
                        {chatHistory.map((chat, index) => (
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
                {/* this div will be at the bottom of the sidenav bar */}
                <div className="pt-2 mt-auto flex justify-between">
                    <Dropdown placement="top">
                        <DropdownTrigger>
                            <Button className="bg-inherit text-white p-2 hover:rounded-lg hover:bg-[#212121]" startContent={<Avatar
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
                </div>
            </div>

            <div className={`${isSidebarOpen ? 'col-span-10' : 'col-span-12'} bg-white p-4 flex`}>
                <div className="grid grid-rows-12 w-full">
                    {/* Navbar */}
                    <div className="flex items-center sticky top-0">
                        <div className="w-16">
                            {!isSidebarOpen && <button
                                className={`w-10 h-10 rounded-full  ${isSidebarOpen ? 'text-white hover:bg-[#212121]' : 'text-black hover:bg-[#efebeb]'} flex justify-center items-center`}
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            >
                                <GiHamburgerMenu size={20} />
                            </button>}
                        </div>
                        <div className="w-12 justify-start">
                            <Tooltip showArrow={true} content="New Chat" closeDelay={500} placement='right'>
                                <button
                                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex justify-center items-center"
                                >
                                    <LuPlus size="20" />
                                </button>
                            </Tooltip>
                        </div>
                        <div className="w-2/12  flex justify-start">
                            <Select
                                className="w-52 md:w-full ml-4"
                                selectedKeys={[selectedModel?.value]}
                                onChange={(event) => setSelectedModel(
                                    modelOptions.find((model) => model.value === event.target.value)
                                )}
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
                        <div className="w-9/12 flex justify-end items-center">
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
                        </div>
                    </div>

                    <div className="row-span-9 flex justify-center px-4 overflow-y-auto scroll-container" style={{
                        height: "calc(80vh - 61px)"
                    }}>
                        <div className="w-full max-w-4xl py-2 flex flex-col gap-3 px-4">
                            <div className="w-full flex justify-end">
                                <UserCard message={"How to make profit?"} profilePicture={localStorage.getItem("profilePicture")} />
                            </div>
                            <div className="w-full flex justify-start">
                                <AiCard message={"There are many ways to make a profit, but here are some common strategies:Start a business: One of the most common ways to make a profit is to start your own business. This could be anything from selling products or services to starting a consulting firm or freelance business.Invest in stocks or real estate: Another way to make a profit is to invest in stocks or real estate. By buying low and selling high, you can make a profit on your investments. Offer a service: If you have a skill or talent, you can offer your services to others for a fee. This could be anything from tutoring or coaching to graphic design or writing. Sell products online: With the rise of e-commerce, it's easier than ever to sell products online. You can start your own online store or sell products through platforms like Etsy or Amazon. Rent out property: If you own property, you can make a profit by renting it out to tenants. This could be a residential property, commercial property, or even a vacation rental. Monetize your hobbies: If you have a hobby or passion, you can often find ways to monetize it. This could be through selling handmade crafts, teaching classes, or creating content online. Ultimately, the key to making a profit is to find a way to provide value to others and monetize that value. It may take time and effort to build a profitable business or investment portfolio, but with persistence and hard work, it is possible to make a profit in various ways."} profilePicture={localStorage.getItem("profilePicture")} />
                            </div>
                            <div className="w-full flex justify-end">
                                <UserCard message={"How to make profit?"} profilePicture={localStorage.getItem("profilePicture")} />
                            </div>
                            <div className="w-full flex justify-start">
                                <AiCard message={"There are many ways to make a profit, but here are some common strategies:Start a business: One of the most common ways to make a profit is to start your own business. This could be anything from selling products or services to starting a consulting firm or freelance business.Invest in stocks or real estate: Another way to make a profit is to invest in stocks or real estate. By buying low and selling high, you can make a profit on your investments. Offer a service: If you have a skill or talent, you can offer your services to others for a fee. This could be anything from tutoring or coaching to graphic design or writing. Sell products online: With the rise of e-commerce, it's easier than ever to sell products online. You can start your own online store or sell products through platforms like Etsy or Amazon. Rent out property: If you own property, you can make a profit by renting it out to tenants. This could be a residential property, commercial property, or even a vacation rental. Monetize your hobbies: If you have a hobby or passion, you can often find ways to monetize it. This could be through selling handmade crafts, teaching classes, or creating content online. Ultimately, the key to making a profit is to find a way to provide value to others and monetize that value. It may take time and effort to build a profitable business or investment portfolio, but with persistence and hard work, it is possible to make a profit in various ways."} profilePicture={localStorage.getItem("profilePicture")} />
                            </div>
                        </div>
                    </div>

                    <div className="row-span-2 justify-center items-center flex px-4 sticky bottom-0">
                        <InputBar
                            className="lg:max-w-3xl xl:max-w-4xl px-4 py-2"
                            // userInput={userInput}
                            // setUserInput={setUserInput}
                            endContent={
                                <Button
                                    isIconOnly
                                    variant="faded"
                                    aria-label="Send"
                                    onClick={() => {
                                        // onSend(userInput);
                                    }}
                                // isDisabled={isStreaming}
                                >
                                    <BsSendArrowUp />
                                </Button>
                            }
                        // onKeyDown={handleKeyPress}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};
