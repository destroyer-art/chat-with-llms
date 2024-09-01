import React from 'react';
import { Button } from "@nextui-org/react";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleAuth } from '../utils/useGoogleAuth';
import { verifyGoogleAuth } from '../utils/verifyGoogleAuth';
import { useNavigate } from 'react-router-dom';
import aiMind from '../images/ai-mind.svg';

export const LandingPageNavBar = () => {
    const { handleGoogleSuccess, handleGoogleFailure } = useGoogleAuth();
    const navigate = useNavigate();

    const login = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onFailure: handleGoogleFailure,
    });

    return (
        <nav aria-label="Main Navigation" className='flex justify-between min-h-[8dvh] border-b dark:bg-slate-900 dark:text-teal-400'>
            <div className="px-4 lg:px-6 justify-start flex items-center">
                <img src={aiMind} alt="AI Mind Logo" className="h-10 w-10 pr-2" />
                <span className="text-xs sm:text-xl font-bold" aria-label="Website Name">Chat With LLMs</span>
            </div>
            <div className='px-4 lg:px-6 justify-end flex items-center'>
                <Button 
                    color="primary" 
                    variant="bordered" 
                    className='dark:border-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 dark:text-gray-100' 
                    startContent={<FcGoogle />} 
                    aria-label="Google Sign In"
                    onClick={async () => {
                        const isVerified = await verifyGoogleAuth();
                        if (isVerified)
                            navigate('/chat');
                        else
                            login();
                    }}
                >
                    Sign in
                </Button>
            </div>
        </nav>
    );
}
