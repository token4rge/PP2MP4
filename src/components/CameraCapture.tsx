
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SlideImage } from '../types';

interface CameraCaptureProps {
    onCapture: (image: SlideImage) => void;
    onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access the camera. Please ensure you have given permission in your browser settings.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const handleAccept = () => {
        if (capturedImage) {
            const base64 = capturedImage.split(',')[1];
            onCapture({ base64, mimeType: 'image/jpeg' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-4xl relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h2 className="text-2xl font-bold text-center mb-4">Capture Image</h2>
                
                {error && (
                    <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-md">
                        <p>{error}</p>
                        <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700">Close</button>
                    </div>
                )}
                
                {!error && (
                    <div className="aspect-video bg-black rounded-md overflow-hidden relative">
                        <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain ${capturedImage ? 'hidden' : 'block'}`} />
                        <canvas ref={canvasRef} className="hidden" />
                        {capturedImage && <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />}
                    </div>
                )}

                <div className="mt-6 flex justify-center gap-4">
                    {!error && !capturedImage && (
                        <button onClick={handleCapture} className="px-6 py-3 bg-blue-600 rounded-md text-lg font-semibold hover:bg-blue-700 transition-colors">
                            Capture Photo
                        </button>
                    )}
                    {capturedImage && (
                        <>
                            <button onClick={handleRetake} className="px-6 py-3 bg-gray-600 rounded-md text-lg font-semibold hover:bg-gray-700 transition-colors">
                                Retake
                            </button>
                            <button onClick={handleAccept} className="px-6 py-3 bg-green-600 rounded-md text-lg font-semibold hover:bg-green-700 transition-colors">
                                Use this Image
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
