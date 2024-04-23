import React from 'react';
import { Button } from '@nextui-org/react';
import { Link } from 'react-router-dom';
import { FcGoogle } from "react-icons/fc";

export const LandingPagePromotion = () => {
  return (
    <div className="w-full mt-16 py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
        <div className="grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Get Started with Chat-with-LLMs</h2>
            <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Sign in with your Google account to start exploring the world of large language models.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-2">
            <Button
              className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium shadow transition-colors"
              variant="primary"
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              Sign in with Google
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our{" "}
              <Link className="underline underline-offset-2" href="#">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
  )
}
