import React from 'react';
import { Button } from "@nextui-org/react";
import { FcGoogle } from "react-icons/fc";
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleAuth } from '../utils/useGoogleAuth';

export const LandingPageNavBar = () => {
    const { handleGoogleSuccess, handleGoogleFailure } = useGoogleAuth();

    return (
        <div className='flex justify-between min-h-[8dvh] border-b'>
            <div className="px-4 lg:px-6 justify-start flex items-center">
                <img src="ai-mind.svg" alt="ai-mind" className="h-10 w-10 pr-2" />
                <span className="text-xs sm:text-xl font-bold">chat-with-llms</span>
            </div>
            <div className='px-4 lg:px-6 justify-end flex items-center'>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleFailure}
                    render={renderProps => (
                        <Button color="primary" variant="bordered" className='border-zinc-300' startContent={<FcGoogle />} onClick={renderProps.onClick} disabled={renderProps.disabled}>
                            Sign in
                        </Button>
                    )}
                />
            </div>
        </div>
    );
}
