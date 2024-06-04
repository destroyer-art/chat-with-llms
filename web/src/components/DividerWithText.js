import React from 'react';

const DividerWithText = ({text, color}) => {
  return (
    <div className="flex items-center justify-center">
      <div className="border-t border-gray-300 flex-grow mr-3"></div>
      <span className={`${color}`}>{text}</span>
      <div className="border-t border-gray-300 flex-grow ml-3"></div>
    </div>
  );
}

export default DividerWithText;
