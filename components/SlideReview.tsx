import React from 'react';
import { SlideData } from '../types';

interface SlideReviewProps {
    slides: SlideData[];
    selections: Record<number, number>;
    onSelectionChange: (slideNumber: number, imageIndex: number) => void;
    onGenerate: () => void;
    onCancel: () => void;
}

export const SlideReview: React.FC<SlideReviewProps> = ({ slides, selections, onSelectionChange, onGenerate, onCancel }) => {
    return (
        <div className="w-full max-w-7xl mx-auto opacity-0 animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-gray-200 mb-2">Review Your Slides</h2>
            <p className="text-center text-gray-400 mb-8">For slides with multiple images, select the one you want to use as a reference for video generation.</p>

            <div className="space-y-8">
                {slides.map(slide => (
                    <div key={slide.slideNumber} className="bg-gray-800 rounded-lg p-6 shadow-lg">
                        <h3 className="font-bold text-xl text-blue-300 mb-3">Slide {slide.slideNumber}</h3>
                        <p className="text-gray-400 mb-4 h-24 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">{slide.text}</p>
                        {slide.imageBases64.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">Select Reference Image:</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {slide.imageBases64.map((imageBase64, index) => {
                                        const isSelected = selections[slide.slideNumber] === index;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => onSelectionChange(slide.slideNumber, index)}
                                                className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 aspect-video transform ${isSelected ? 'ring-4 ring-blue-500 scale-105 shadow-lg' : 'ring-2 ring-transparent hover:ring-blue-400 hover:scale-105'}`}
                                            >
                                                <img
                                                    src={`data:image/png;base64,${imageBase64}`}
                                                    alt={`Slide ${slide.slideNumber} Image ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300">
                                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {slide.imageBases64.length === 0 && (
                             <p className="text-sm text-gray-500 italic">No images found on this slide. Video will be generated from text only.</p>
                        )}
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
                    Generate {slides.length} Video{slides.length !== 1 ? 's' : ''}
                </button>
            </div>
        </div>
    );
};