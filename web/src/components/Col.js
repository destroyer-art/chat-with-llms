import React from 'react';

const Column = ({ children, className }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {children}
    </div>
  );
};

export default Column;
