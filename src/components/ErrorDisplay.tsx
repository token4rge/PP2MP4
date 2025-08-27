
import React from 'react';
import { RetryIcon } from './IconComponents';

interface ErrorDisplayProps {
  message: string;
  onReset: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onReset }) => {
  return (
    <div
      className="bg-red-900 border-l-4 border-red-500 text-red-100 p-6 rounded-lg shadow-lg"
      role="alert"
    >
      <div className="flex">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 text-red-400 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm-1-5a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0v-2zm0-6a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"/>
          </svg>
        </div>
        <div>
          <p className="font-bold mb-2">An Error Occurred</p>
          <p className="text-sm">{message}</p>
          <button
            onClick={onReset}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-100 bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-red-900"
          >
            <RetryIcon />
            <span className="ml-2">Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
