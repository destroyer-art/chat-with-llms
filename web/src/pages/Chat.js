import React from 'react';
import Container from '../components/Container';
import Row from '../components/Row';
import { UserCard } from '../components/UserCard';
import { AiCard } from '../components/AiCard';
import InputBar from '../components/InputBar';

export const Chat = () => {
    return (
        <Container>
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
                    <AiCard message="I recommend the Toyota Highlander. It is a great family car." />
                </div>
                <div className="w-full flex justify-end">
                    <UserCard message="I am looking for a family car." />
                </div>
                <div className="w-full flex justify-start">
                    <AiCard message="I recommend the Toyota Highlander. It is a great family car." />
                </div>
            </div>
            <div className="fixed inset-x-0 bottom-0 flex justify-center">
                <InputBar className="max-w-2xl" />
            </div>
        </Container>
    )
}
