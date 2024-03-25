// In your Container.js (or wherever the Container component is defined)
import React from 'react';

const Container = ({ children }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen">
      {children}
    </div>
  );
};

export default Container;