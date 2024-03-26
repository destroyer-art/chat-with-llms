import React, { useEffect, useState } from 'react';
import { UserCard } from '../components/UserCard';
import { AiCard } from '../components/AiCard';
import InputBar from '../components/InputBar';

export const Chat = () => {

    const [messages, setMessages] = useState([]);

    const [userInput, setUserInput] = useState(null);



    return (
        <div className="h-full flex-1 flex flex-col max-w-3xl mx-auto md:px-2 relative">
            <div className="flex-1  flex  flex-col  gap-3  px-4  pt-16">
                <div className="w-full flex justify-start">
                    <AiCard message="Hello, how can I help you today?" />
                </div>
                <div className="w-full flex justify-end">
                    <UserCard message="I am looking to buy a new car." />
                </div>
                <div className="w-full flex justify-start">
                    <AiCard message="Great! What type of car are you looking for?" />
                </div>
                <div className="w-full flex justify-end">
                    <UserCard message="I am looking for a family car." />
                </div>
                <div className="w-full flex justify-start">
                    <AiCard message="I recommend the Toyota Highlander. It is a great family car." />
                </div>
                <div className="w-full flex justify-end">
                    <UserCard message="I am looking for a family car." />
                </div>
                <div className="w-full flex justify-start">
                    <AiCard message="I recommend the Toyota Highlander. It is a great family car." />
                </div>
                <div className="w-full flex justify-end">
                    <UserCard message="I am looking for a family car." />
                </div>
                <div className="w-full flex justify-start">
                    <AiCard message="I recommend the Toyota Highlander. It is a great family car." />
                </div>
                <div className="w-full flex justify-end">
                    <UserCard message="I am looking for a family car." />
                </div>
                <div className="w-full flex justify-start">
                    <AiCard message="To apply the maximum margin along the X-axis (left and right) using Tailwind CSS, you can use the mx-auto utility class to center your elements, and for ensuring that the InputBar adheres to the same maximum width while staying centered, you can use a combination of Tailwind's layout and spacing utilities. However, if your goal is to apply maximum horizontal margin while still using fixed margins instead of auto margins, you'd typically use the largest fixed margin available in your Tailwind configuration or create custom utilities if needed." />
                </div>
                <div className="w-full flex justify-end">
                    <UserCard message="I am looking for a family car." />
                </div>
                <div className="w-full flex justify-start">
                    <AiCard message="I recommend the Toyota Highlander. It is a great family car." />
                </div>

                <div className="sticky inset-x-0 bottom-0 justify-center">
                    <InputBar 
                        userInput={userInput}
                        setUserInput={setUserInput}
                    />
                </div>
            </div>

        </div>
    )
}
