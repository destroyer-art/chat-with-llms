import React from 'react'
import { Button } from '@nextui-org/react';
import { Link } from 'react-router-dom';


export const LandingPageIntro = () => {
  return (
    <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:gap-16 md:grid-cols-2 pt-32">
          <div className='justify-center'>
            <h1 className='lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]'>Explore the Power of Large Language Models</h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400 mt-4">
                  Chat-with-LLMs is your one-stop destination to try out and compare the latest large language models
                  from leading AI providers.
                </p>
                <div className="space-x-4 mt-8">
                  <Button
                    className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
                    variant="primary"
                  >
                    Get Started
                  </Button>
                  <Link
                    className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                    href="#"
                  >
                    Learn More
                  </Link>
                </div>
          </div>
          <div className='justify-center'>
            <img src="ai-mind.svg" alt="ai-mind"   className="mx-auto overflow-hidden rounded-xl object-cover sm:size-80 size-60" />
          </div>
      </div>
  )
};
