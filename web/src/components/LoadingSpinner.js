import React from 'react';
import { ThreeDots } from 'react-loader-spinner';

const LoadingSpinner = () => (
  <div className="flex items-center">
    <ThreeDots color="#3B82F6" height={16} width={16} />
    <span className="ml-2 text-gray-600">Generating response...</span>
  </div>
);

export default LoadingSpinner;