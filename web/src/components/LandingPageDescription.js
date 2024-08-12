import React from 'react';
import { Button } from '@nextui-org/react';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleAuth } from '../utils/useGoogleAuth';
import { verifyGoogleAuth } from '../utils/verifyGoogleAuth';
import { useNavigate } from 'react-router-dom';


export const LandingPageDescription = React.forwardRef((props, ref) => {
  const navigate = useNavigate();
  const { handleGoogleSuccess, handleGoogleFailure } = useGoogleAuth();
  let model = "gpt-4o-mini";

  const login =
     useGoogleLogin({
      onSuccess: (response) => handleGoogleSuccess(response, model),
      onFailure: (error) => handleGoogleFailure(error),
    });

  return (
    <React.Fragment>
      <div ref={ref} className="w-full pb-12 md:pb-24 lg:pb-32 border-b border-gray-200 my-8 md:col-span-2"></div>
      <div className="flex flex-col items-center justify-center space-y-4 text-center px-4 sm:px-0">
        <div className="inline-block rounded-lg text-md bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
          Try Different LLMs
        </div>
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Explore the Latest Language Models</h2>
        <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
        Unleash the power of AI conversation with Chat-with-LLMs! Our innovative platform lets you chat with a variety of Large Language Models (LLMs) from leading providers like OpenAI, Anthrophic, and Google. Go beyond a single model - switch seamlessly between them mid-conversation to explore diverse capabilities.  It's like having multiple AI experts at your fingertips, all in one place. Discover the power of choice in AI conversation with Chat-with-LLMs.
        </p>
      </div>
      <div className="mx-auto justify-center grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3 mt-16 px-4 sm:px-0">
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">GPT</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The original large language model, developed by OpenAI.
          </p>
          <Button className="justify-start" variant="link" onClick={async () => {
            const isVerified = await verifyGoogleAuth();
            if (isVerified) navigate('/chat', { state: { userModel: "gpt-4o" } });

            else {
              model = "gpt-4o";
              login();
            }
          }}>
            Try GPT
          </Button>
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">Gemini</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">A powerful language model from Google.</p>
          <Button className="justify-start" variant="link" onClick={async () => {
            const isVerified = await verifyGoogleAuth();
            if (isVerified) navigate('/chat', { state: { userModel: "gemini-1.5-flash-latest" } });

            else {
              model = "gemini-1.5-flash-latest";
              login();
            }
          }}>
            Try Gemini
          </Button>
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">Perplexity</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">A versatile language model from Perplexity.</p>
          <Button className="justify-start" variant="link" onClick={async () => {
            const isVerified = await verifyGoogleAuth();
            if (isVerified) navigate('/chat', { state: { userModel: "llama-3.1-sonar-large-128k-online" } });

            else {
              model = "llama-3.1-sonar-large-128k-online";
              login();
            }
          }}>
            Try Perplexity
          </Button>
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">Mistral</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            A cutting-edge language model from Mistral.
          </p>
          <Button className="justify-start" variant="link" onClick={async () => {
            const isVerified = await verifyGoogleAuth();
            if (isVerified) navigate('/chat', { state: { userModel: "mistral-large-2402" } });

            else {
              model = "mistral-large-2402";
              login();
            }
          }}>
            Try Mistral
          </Button>
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">Anthropic</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Explore Anthropic's suite of language models.
          </p>
          <Button className="justify-start" variant="link" onClick={async () => {
            const isVerified = await verifyGoogleAuth();
            if (isVerified) navigate('/chat', { state: { userModel: "claude-3-5-sonnet-20240620" } });

            else {
              model = "claude-3-5-sonnet-20240620";
              login();
            }
          }}>
            Try Anthropic
          </Button>
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-bold">And More</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Check back often for updates on new language models.
          </p>
          <Button className="justify-start" variant="link" onClick={async () => {
            const isVerified = await verifyGoogleAuth();
            if (isVerified) navigate('/chat', { state: { userModel: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" } });

            else {
              model = "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo";
              login();
            }
          }}>
            Explore More
          </Button>
        </div>
      </div>
    </React.Fragment>
  )
});
