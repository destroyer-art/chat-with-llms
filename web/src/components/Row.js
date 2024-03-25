import React from 'react';

const Row = ({ children, className }) => {
  return (
    <div className={`flex flex-row ${className}`}>
      {children}
    </div>
  );
};

export default Row;
