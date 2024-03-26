import React, { useState } from 'react';
import { Card, CardBody, CardFooter } from "@nextui-org/react";
import { AiOutlineCopy, AiOutlineCheck } from 'react-icons/ai';

export const AiCard = ({ message }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset the state after 2 seconds
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card className="max-w-max bg-gray-100 text-gray-800">
        <CardBody>
            {message}
        </CardBody>
        <CardFooter className="flex justify-end items-center p-2">
            <button
              className={`flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 rounded transition duration-300 ease-in-out ${
                copied ? 'bg-green-100 hover:bg-green-100' : ''
              }`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <AiOutlineCheck className="text-green-600" />
                  <span className="text-green-600">Copied</span>
                </>
              ) : (
                <>
                  <AiOutlineCopy />
                  <span>Copy</span>
                </>
              )}
            </button>
        </CardFooter>
    </Card>
  )
};