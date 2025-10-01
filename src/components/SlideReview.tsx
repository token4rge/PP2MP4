
import React, { useState } from 'react';
import { SlideData, SlideImage } from '../types';
import { CameraCapture } from './CameraCapture';

interface SlideReviewProps {
    slides: SlideData[];
    selections: Record<number, number>;
    onSelectionChange: (slideNumber: number, imageIndex: number) => void;
    onGenerate: () => void;
    onCancel: () => void;
    onUpdateSlide: (slideNumber: number, newImage: SlideImage) => void;
}

const CameraIcon = () => (
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
)

export const SlideReview: React.FC<SlideReviewProps> = ({ slides, selections, onSelectionChange, onGenerate, onCancel, onUpdateSlide }) => {
    const [cameraForSlide, setCameraForSlide] = useState<number | null>(null);

    const handleImageCapture = (slideNumber: number, image: SlideImage) => {
        onUpdateSlide(slideNumber, image);
        setCameraForSlide(null);
    };

    return (
        <div className="w-full max-w-7xl mx-auto opacity-0 animate-fade-in">
            {cameraForSlide !== null && (
                <CameraCapture 
                    onCapture={(image) => handleImageCapture(cameraForSlide, image)}
                    onClose={() => setCameraForSlide(null)}
                />
            )}
            <h2 className="text-3xl font-bold text-center text-gray-200 mb-2">Review Your Slides</h2>
            <p className="text-center text-gray-400 mb-8">Confirm the content for each slide. For slides with multiple images, select one to use as a reference.</p>

            <div className="space-y-8">
                {slides.map(slide => (
                    <div key={slide.slideNumber} className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg flex flex-col md:flex-row gap-6">
                        {slide.thumbnailBase64 && (
                            <div className="md:w-1/3 flex-shrink-0">
                                <h3 className="font-bold text-xl text-blue-300 mb-3 text-center">Slide {slide.slideNumber} Preview</h3>
                                <div className="aspect-video bg-gray-900 rounded-md overflow-hidden ring-2 ring-gray-700">
                                    <img 
                                        src={`data:image/jpeg;base64,${slide.thumbnailBase64}`} 
                                        alt={`Slide ${slide.slideNumber} thumbnail`}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-grow">
                            {!slide.thumbnailBase64 && <h3 className="font-bold text-xl text-blue-300 mb-3">Slide {slide.slideNumber}</h3>}
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Extracted Text (with OCR):</h4>
                            <p className="text-gray-400 bg-gray-900/50 rounded-md p-3 mb-4 h-28 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">{slide.text || "No text found."}</p>
                            
                            
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-semibold text-gray-300">Reference Image:</h4>
                                <button 
                                    onClick={() => setCameraForSlide(slide.slideNumber)}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800"
                                >
                                    <CameraIcon />
                                    Use Camera
                                </button>
                            </div>
                            
                            {slide.images.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {slide.images.map((image, index) => {
                                        const isSelected = selections[slide.slideNumber] === index;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => onSelectionChange(slide.slideNumber, index)}
                                                className={`relative rounded-md overflow-hidden cursor-pointer transition-all duration-300 aspect-video transform ${isSelected ? 'ring-4 ring-blue-500 scale-105 shadow-lg' : 'ring-2 ring-transparent hover:ring-blue-400 hover:scale-105'}`}
                                            >
                                                <img
                                                    src={`data:${image.mimeType};base64,${image.base64}`}
                                                    alt={`Slide ${slide.slideNumber} Image ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                {isSelected && (
                                                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-blue-600 rounded-full p-1 animate-scale-in-check">
                                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                 <p className="text-sm text-gray-500 italic text-center py-4 border-2 border-dashed border-gray-700 rounded-md">
                                     No images found on this slide. Use the camera to add one.
                                 </p>
                            )}

                             {slide.images.length === 0 && !slide.text && (
                                 <p className="text-sm text-gray-500 italic mt-4">No content (text or images) found on this slide. It will be skipped.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                <button
                    onClick={onCancel}
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900"
                >
                    Cancel
                </button>
                <button
                    onClick={onGenerate}
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
                >
                    Generate Videos
                </button>
            </div>
        </div>
    );
};
