import React, { useState } from 'react';
import { VideoResult } from '../types';
import { DownloadIcon, RetryIcon, ZipIcon } from './IconComponents';
import JSZip from 'jszip';

declare const process: any;

interface VideoResultsDisplayProps {
    results: VideoResult[];
    onReset: () => void;
}

const VideoCard: React.FC<{ result: VideoResult, index: number }> = ({ result, index }) => {
    const videoUrl = `${result.videoUri}&key=${process.env.API_KEY}`;
    const thumbnailUrl = result.thumbnailUri ? `${result.thumbnailUri}&key=${process.env.API_KEY}` : undefined;
    const posterUrl = thumbnailUrl || (result.image ? `data:${result.image.mimeType};base64,${result.image.base64}` : undefined);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch(videoUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch video: ${response.statusText}`);
            }
            const videoBlob = await response.blob();
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(videoBlob);
            link.download = `slide_${result.slideNumber}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error downloading video:', error);
            alert(`An error occurred while downloading the video: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div 
            className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl flex flex-col opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 120}ms` }}
        >
            <div className="relative aspect-video bg-black flex-shrink-0">
                {isVideoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                 <video 
                    src={videoUrl} 
                    poster={posterUrl}
                    preload="auto" 
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoLoading ? 'opacity-0' : 'opacity-100'}`}
                    controls
                    playsInline
                    autoPlay
                    muted
                    loop
                    onCanPlay={() => setIsVideoLoading(false)}
                 >
                    Your browser does not support the video tag.
                </video>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-blue-300 mb-2">Slide {result.slideNumber}</h3>
                <p className="text-gray-400 text-sm h-20 overflow-y-auto pr-2 flex-grow scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    <span className="font-semibold text-gray-300">Narration:</span> {result.text}
                </p>
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 disabled:bg-blue-800 disabled:cursor-not-allowed"
                >
                    <DownloadIcon />
                    <span className="ml-2">{isDownloading ? 'Downloading...' : 'Download Video'}</span>
                </button>
            </div>
        </div>
    );
}


export const ResultsDisplay: React.FC<VideoResultsDisplayProps> = ({ results, onReset }) => {
    const [isZipping, setIsZipping] = useState(false);
    const [zipMessage, setZipMessage] = useState('');

    const handleDownloadAll = async () => {
        setIsZipping(true);
        setZipMessage('Initializing...');
        try {
            const zip = new JSZip();
            
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                setZipMessage(`Fetching video ${i + 1} of ${results.length}...`);
                const videoUrl = `${result.videoUri}&key=${process.env.API_KEY}`;
                const response = await fetch(videoUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch video for slide ${result.slideNumber}`);
                }
                const videoBlob = await response.blob();
                zip.file(`slide_${result.slideNumber}.mp4`, videoBlob);
            }

            setZipMessage('Compressing files...');
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'presentation_videos.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error('Error creating ZIP file:', error);
            alert(`An error occurred while creating the ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsZipping(false);
            setZipMessage('');
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
                {results.map((result, index) => (
                    <VideoCard key={result.slideNumber} result={result} index={index} />
                ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                 <button
                    onClick={handleDownloadAll}
                    disabled={isZipping || results.length === 0}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:bg-blue-800 disabled:cursor-not-allowed"
                >
                    <ZipIcon />
                    <span className="ml-2">{isZipping ? zipMessage : 'Download All as ZIP'}</span>
                </button>
                <button
                    onClick={onReset}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900"
                >
                    <RetryIcon />
                    <span className="ml-2">Convert Another Presentation</span>
                </button>
            </div>
        </div>
    );
};