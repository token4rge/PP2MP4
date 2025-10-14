import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full max-w-7xl mx-auto mt-16 pb-8 text-center text-gray-500 text-sm">
      <div className="border-t border-gray-700 pt-8">
        <p>
          This tool is for demonstration purposes and leverages the Google Gemini API.
        </p>
        <nav className="flex justify-center gap-4 mt-4">
          <a href="#" className="hover:text-gray-300 transition-colors">About</a>
          <span className="text-gray-600">|</span>
          <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
          <span className="text-gray-600">|</span>
          <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
        </nav>
        <p className="mt-4">
          © {new Date().getFullYear()} PowerPoint to MP4 Converter. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};
