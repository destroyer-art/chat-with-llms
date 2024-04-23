import React from 'react';
import { Button } from '@nextui-org/react';


export const LandingPageDescription = () => {
  return (
    <React.Fragment>
        <div className="w-full pb-12 md:pb-24 lg:pb-32 border-b border-gray-200 my-8 md:col-span-2"></div>
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="inline-block rounded-lg text-md bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
          Try Different LLMs
        </div>
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Explore the Latest Language Models</h2>
        <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
          Chat-with-LLMs allows you to try out and compare the most popular large language models, including
          GPT, Gemini, Perplexity, Mistral, and Anthropic, all in one place.
        </p>
      </div>
      <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3 mt-16">
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">GPT</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The original large language model, developed by OpenAI.
          </p>
          <Button className="justify-start" variant="link">
            Try GPT
          </Button>
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">Gemini</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">A powerful language model from Anthropic.</p>
          <Button className="justify-start" variant="link">
            Try Gemini
          </Button>
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">Perplexity</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">A versatile language model from Anthropic.</p>
          <Button className="justify-start" variant="link">
            Try Perplexity
          </Button>
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">Mistral</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            A cutting-edge language model from Anthropic.
          </p>
          <Button className="justify-start" variant="link">
            Try Mistral
          </Button>
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">Anthropic</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Explore Anthropic's suite of language models.
          </p>
          <Button className="justify-start" variant="link">
            Try Anthropic
          </Button>
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">And More</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Check back often for updates on new language models.
          </p>
          <Button className="justify-start" variant="link">
            Explore More
          </Button>
        </div>
      </div>
    </React.Fragment>
  )
}
