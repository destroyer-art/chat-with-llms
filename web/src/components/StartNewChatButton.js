import React from 'react';
const StartNewChatButton = () => {

  const handleClick = () => {
    // Reset the page and clear state values
    window.location.replace('/chat');
  };

  return (
    // <Tooltip content="Start new chat">
      <button
        className="flex items-center px-4 py-2 rounded-full text-black text-xl font-semibold hover:bg-gray-100"
        onClick={handleClick}
      >
        +
      </button>
    // </Tooltip>
  );
};

export default StartNewChatButton;