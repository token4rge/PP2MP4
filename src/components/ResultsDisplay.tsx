
import React, { useState, useRef, useEffect } from 'react';
import { VideoResult } from '../types';
import { DownloadIcon, RetryIcon, ZipIcon } from './IconComponents';
import JSZip from 'jszip';

declare const process: any;

interface VideoResultsDisplayProps {
    results: VideoResult[];
    onReset: () => void;
}

const PlayIcon = () => (
    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const PauseIcon = () => (
     <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 100-2H9V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 100-2h-1V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


const VideoCard: React.FC<{ result: VideoResult, index: number }> = ({ result, index }) => {
    const videoUrl = `${result.videoUri}&key=${process.env.API_KEY}`;
    const thumbnailUrl = result.thumbnailUri ? `${result.thumbnailUri}&key=${process.env.API_KEY}` : undefined;
    const posterUrl = thumbnailUrl || (result.image ? `data:${result.image.mimeType};base64,${result.image.base64}` : undefined);
    
    const [isDownloading, setIsDownloading] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showControls, setShowControls] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            if (video.duration > 0) {
                setProgress((video.currentTime / video.duration) * 100);
            }
        };

        video.addEventListener('timeupdate', updateProgress);
        return () => video.removeEventListener('timeupdate', updateProgress);
    }, []);


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
    
    const togglePlayPause = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };
    
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const progressContainer = progressRef.current;
        const video = videoRef.current;
        if (progressContainer && video) {
            const rect = progressContainer.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = offsetX / width;
            video.currentTime = video.duration * percentage;
        }
    };

    return (
        <div 
            className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl flex flex-col opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 120}ms` }}
        >
            <div 
                className="relative aspect-video bg-black flex-shrink-0 group"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >
                {isVideoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                 <video 
                    ref={videoRef}
                    src={videoUrl} 
                    poster={posterUrl}
                    preload="auto" 
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoLoading ? 'opacity-0' : 'opacity-100'}`}
                    playsInline
                    autoPlay
                    muted
                    loop
                    onCanPlay={() => {
                        setIsVideoLoading(false);
                        setIsPlaying(true);
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onClick={togglePlayPause}
                 >
                    Your browser does not support the video tag.
                </video>
                 <div className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 z-10 ${showControls && !isPlaying ? 'opacity-100' : 'opacity-0'}`} onClick={togglePlayPause}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                    <div 
                        ref={progressRef}
                        className="absolute bottom-2 left-2 right-2 h-1.5 bg-white/20 cursor-pointer rounded-full"
                        onClick={handleSeek}
                    >
                        <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
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
