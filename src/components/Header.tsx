

import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
        PowerPoint to MP4 Converter
      </h1>
      <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
        Instantly transform your static PowerPoint slides into dynamic MP4 video clips. Our tool leverages the power of Gemini's video generation to analyze your content, add voiceovers, and create visually stunning videos based on your creative direction. Go from presentation to production in just a few clicks.
      </p>
    </header>
  );
};