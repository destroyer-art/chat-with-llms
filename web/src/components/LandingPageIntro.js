import React from 'react';
import { Button } from '@nextui-org/react';
import aiMind from '../images/ai-mind.svg';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleAuth } from '../utils/useGoogleAuth';
import { verifyGoogleAuth } from '../utils/verifyGoogleAuth';
import { useNavigate } from 'react-router-dom';

export const LandingPageIntro = ({ descriptionRef }) => {
  const navigate = useNavigate();
  const { handleGoogleSuccess, handleGoogleFailure } = useGoogleAuth();

  const login = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onFailure: handleGoogleFailure,
  });

  const handleLearnMoreClick = () => {
    if (descriptionRef.current) {
      descriptionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:gap-16 md:grid-cols-2 pt-32">
      <div className='justify-center'>
        <div className='justify-center'>
          <h1 className='lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem] dark:text-teal-400'>
            Explore the Power of Large Language Models
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-300 mt-4">
            Chat-with-LLMs is your one-stop destination to try out and compare the latest large language models
            from leading AI providers.
          </p>
        </div>

        <div className="space-x-4 mt-8">
          <Button
            className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors dark:bg-violet-600 dark:text-gray-100 dark:hover:bg-violet-700"
            variant="primary"
            onClick={async () => {
              const isVerified = await verifyGoogleAuth();
              if (isVerified) navigate('/chat');

              else login();
            }}
          >
            Get Started
          </Button>
          <Button
            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:focus-visible:ring-gray-600"
            onClick={handleLearnMoreClick}
          >
            Learn More
          </Button>
        </div>
      </div>
      <div className='justify-center'>
        <img src={aiMind} alt="ai-mind" className="mx-auto overflow-hidden rounded-xl object-cover sm:size-80 size-60" />
      </div>
    </div>
  );
};
