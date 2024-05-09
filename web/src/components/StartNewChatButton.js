import React from 'react';
import { Tooltip } from "@nextui-org/react";
import { useNavigate } from 'react-router-dom';

const StartNewChatButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Reset the page and clear state values
    window.location.replace('/chat');
  };

  return (
    <Tooltip content="Start new chat">
      <button
        className="flex items-center px-4 py-2 rounded-full text-black text-xl font-semibold hover:bg-gray-100"
        onClick={handleClick}
      >
        +
      </button>
    </Tooltip>
  );
};

export default StartNewChatButton;