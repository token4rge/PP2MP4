import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoResult } from '../types';
import { DownloadIcon, RetryIcon, ZipIcon, PlayIcon, PauseIcon, VolumeHighIcon, VolumeOffIcon, FullscreenEnterIcon, FullscreenExitIcon } from './IconComponents';
import JSZip from 'jszip';

interface VideoResultsDisplayProps {
    results: VideoResult[];
    onReset: () => void;
}

const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const VideoCard: React.FC<{ result: VideoResult, index: number }> = ({ result, index }) => {
    const videoUrl = `${result.videoUri}&key=${process.env.API_KEY}`;
    const thumbnailUrl = result.thumbnailUri ? `${result.thumbnailUri}&key=${process.env.API_KEY}` : undefined;
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(false);

    const togglePlayPause = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, []);

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const newTime = Number(e.target.value);
            videoRef.current.currentTime = newTime;
            setProgress(newTime);
        }
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(videoRef.current){
            const newVolume = Number(e.target.value);
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            if(newVolume > 0 && isMuted){
                setIsMuted(false);
                videoRef.current.muted = false;
            } else if (newVolume === 0 && !isMuted) {
                setIsMuted(true);
                videoRef.current.muted = true;
            }
        }
    };

    const toggleMute = () => {
        if(videoRef.current){
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
            if(!isMuted && volume === 0) setVolume(1);
        }
    };

    const toggleFullscreen = () => {
        if(!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        const handleTimeUpdate = () => setProgress(video?.currentTime || 0);
        const handleDurationChange = () => setDuration(video?.duration || 0);
        const handleVideoEnd = () => setIsPlaying(false);
        
        video?.addEventListener('timeupdate', handleTimeUpdate);
        video?.addEventListener('durationchange', handleDurationChange);
        video?.addEventListener('ended', handleVideoEnd);
        
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            video?.removeEventListener('timeupdate', handleTimeUpdate);
            video?.removeEventListener('durationchange', handleDurationChange);
            video?.removeEventListener('ended', handleVideoEnd);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);


    return (
        <div 
            className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl flex flex-col opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 120}ms` }}
        >
            <div 
                ref={containerRef}
                className="relative aspect-video bg-black flex-shrink-0 group"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >
                 <video 
                    ref={videoRef}
                    src={videoUrl} 
                    poster={thumbnailUrl}
                    preload="metadata" 
                    className="w-full h-full object-cover"
                    onClick={togglePlayPause}
                 >
                    Your browser does not support the video tag.
                </video>
                 <div className={`custom-video-controls absolute inset-0 flex flex-col justify-between p-2 transition-opacity duration-300 bg-black bg-opacity-40 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}>
                    <div></div> {/* Top spacer */}
                    <div className="flex justify-center items-center">
                        <button onClick={togglePlayPause} className="text-white hover:text-blue-400 transition-colors">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                    </div>
                    <div className="text-white text-xs">
                        <input
                            type="range"
                            min="0"
                            max={duration}
                            value={progress}
                            onChange={handleProgressChange}
                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between items-center mt-1 px-1">
                            <span>{formatTime(progress)} / {formatTime(duration)}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={toggleMute}>
                                    {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeHighIcon/>}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1"
                                />
                                <button onClick={toggleFullscreen}>
                                    {isFullscreen ? <FullscreenExitIcon/> : <FullscreenEnterIcon/>}
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-blue-300 mb-2">Slide {result.slideNumber}</h3>
                <p className="text-gray-400 text-sm h-20 overflow-y-auto pr-2 flex-grow scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    <span className="font-semibold text-gray-300">Narration:</span> {result.text}
                </p>
                <a
                    href={videoUrl}
                    download={`slide_${result.slideNumber}.mp4`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800"
                >
                    <DownloadIcon />
                    <span className="ml-2">Download Video</span>
                </a>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {results.map((result, index) => (
                    <VideoCard key={result.slideNumber} result={result} index={index} />
                ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                 <button
                    onClick={handleDownloadAll}
                    disabled={isZipping}
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