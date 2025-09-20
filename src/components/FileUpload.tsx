import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './IconComponents';
import { VideoStyle, VideoQuality, HollywoodGenre, AspectRatio, FrameRate } from '../types';

interface FileUploadProps {
  onFileProcess: (file: File) => void;
  videoStyle: VideoStyle;
  onStyleChange: (style: VideoStyle) => void;
  videoQuality: VideoQuality;
  onQualityChange: (quality: VideoQuality) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  frameRate: FrameRate;
  onFrameRateChange: (rate: FrameRate) => void;
  hollywoodGenre: HollywoodGenre;
  onGenreChange: (genre: HollywoodGenre) => void;
  customKeywords: string;
  onKeywordsChange: (keywords: string) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
    onFileProcess, videoStyle, onStyleChange, videoQuality, onQualityChange, 
    aspectRatio, onAspectRatioChange, frameRate, onFrameRateChange,
    hollywoodGenre, onGenreChange, 
    customKeywords, onKeywordsChange,
    apiKey, onApiKeyChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null | undefined) => {
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx'))) {
      onFileProcess(file);
    } else {
      alert('Please upload a valid .pptx file.');
    }
  }, [onFileProcess]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    handleFile(file);
  };
  
  const openFileDialog = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const dropZoneClasses = `flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${isDragging ? 'border-blue-400 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}`;
  const videoStyles: VideoStyle[] = ['Default', 'Cinematic', 'Animated', 'Documentary', 'Vibrant', 'Hollywood'];
  const videoQualities: VideoQuality[] = ['480p', '720p', '1080p'];
  const aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '3:4'];
  const frameRates: FrameRate[] = ['24fps', '30fps', '60fps'];
  const hollywoodGenres: HollywoodGenre[] = ['None', 'Action', 'Sci-Fi', 'Drama', 'Thriller', 'Epic Fantasy'];

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="video-style" className="block text-sm font-medium text-gray-300 mb-2 text-center">
            Video Style
          </label>
          <select
            id="video-style"
            name="video-style"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={videoStyle}
            onChange={(e) => onStyleChange(e.target.value as VideoStyle)}
          >
            {videoStyles.map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="video-quality" className="block text-sm font-medium text-gray-300 mb-2 text-center">
            Video Quality
          </label>
          <select
            id="video-quality"
            name="video-quality"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={videoQuality}
            onChange={(e) => onQualityChange(e.target.value as VideoQuality)}
          >
            {videoQualities.map(quality => (
              <option key={quality} value={quality}>{quality}</option>
            ))}
          </select>
        </div>
         <div>
          <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2 text-center">
            Aspect Ratio
          </label>
          <select
            id="aspect-ratio"
            name="aspect-ratio"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={aspectRatio}
            onChange={(e) => onAspectRatioChange(e.target.value as AspectRatio)}
          >
            {aspectRatios.map(ratio => (
              <option key={ratio} value={ratio}>{ratio}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="frame-rate" className="block text-sm font-medium text-gray-300 mb-2 text-center">
            Frame Rate
          </label>
          <select
            id="frame-rate"
            name="frame-rate"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={frameRate}
            onChange={(e) => onFrameRateChange(e.target.value as FrameRate)}
          >
            {frameRates.map(rate => (
              <option key={rate} value={rate}>{rate}</option>
            ))}
          </select>
        </div>
      </div>

      {videoStyle === 'Hollywood' && (
        <div className="w-full max-w-4xl bg-gray-800 p-4 rounded-lg animate-slide-down flex flex-col sm:flex-row gap-4">
           <div>
              <label htmlFor="hollywood-genre" className="block text-sm font-medium text-gray-300 mb-2 text-center">
                Hollywood Genre
              </label>
              <select
                id="hollywood-genre"
                name="hollywood-genre"
                className="block w-full sm:w-64 pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={hollywoodGenre}
                onChange={(e) => onGenreChange(e.target.value as HollywoodGenre)}
              >
                {hollywoodGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            <div className="flex-grow">
              <label htmlFor="custom-keywords" className="block text-sm font-medium text-gray-300 mb-2 text-center">
                Custom Keywords (optional)
              </label>
              <input
                type="text"
                id="custom-keywords"
                name="custom-keywords"
                className="block w-full pl-3 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                placeholder="e.g., lens flare, 80s synthwave"
                value={customKeywords}
                onChange={(e) => onKeywordsChange(e.target.value)}
              />
            </div>
        </div>
      )}

      <div className="w-full max-w-4xl">
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">
          Gemini API Key
        </label>
        <input
          type="password"
          id="api-key"
          name="api-key"
          className="block w-full pl-3 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
        />
      </div>

      <div 
          className={dropZoneClasses}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFileDialog}
          role="button"
          aria-label="File upload zone"
      >
          <UploadIcon />
          <p className="mt-4 text-lg text-gray-400">
              <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-sm text-gray-500">
              PowerPoint (.pptx) files only
          </p>
          <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect}
              className="hidden"
              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          />
      </div>
    </div>
  );
};