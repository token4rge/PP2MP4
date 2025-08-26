
import React from 'react';

interface LoadingIndicatorProps {
    message: string;
}

const loadingMessages = [
    "Summoning the digital artist...",
    "Teaching pixels to dance...",
    "Video generation can take a few minutes...",
    "Rendering your masterpiece...",
    "Composing the final cut...",
    "The AI is hard at work, creativity takes time!",
];


export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
    const [dynamicMessage, setDynamicMessage] = React.useState(loadingMessages[0]);

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setDynamicMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 4000);

        return () => clearInterval(intervalId);
    }, []);


    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 rounded-lg shadow-xl">
            <svg className="animate-spin h-12 w-12 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl font-semibold text-gray-200 mb-2">{message}</p>
            <p className="text-gray-400">{dynamicMessage}</p>
        </div>
    );
};
