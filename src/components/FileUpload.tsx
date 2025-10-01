import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './IconComponents';
import { VideoStyle, VideoQuality, HollywoodGenre, AspectRatio, FrameRate, TransitionStyle } from '../types';
import { generateKeywordsForStyle } from '../services/geminiService';


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
  transitionStyle: TransitionStyle;
  onTransitionChange: (style: TransitionStyle) => void;
  addVoiceover: boolean;
  onVoiceoverChange: (add: boolean) => void;
  addHollywoodIntro: boolean;
  onHollywoodIntroChange: (add: boolean) => void;
  videoDuration: number;
  onDurationChange: (duration: number) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
    onFileProcess, videoStyle, onStyleChange, videoQuality, onQualityChange, 
    aspectRatio, onAspectRatioChange, frameRate, onFrameRateChange,
    hollywoodGenre, onGenreChange, 
    customKeywords, onKeywordsChange,
    transitionStyle, onTransitionChange,
    addVoiceover, onVoiceoverChange,
    addHollywoodIntro, onHollywoodIntroChange,
    videoDuration, onDurationChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null | undefined) => {
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx'))) {
      onFileProcess(file);
    } else {
      alert('Please upload a valid .pptx file.');
    }
  }, [onFileProcess]);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    handleFile(file);
    e.target.value = '';
  };
  
  const handleGenerateKeywords = async () => {
    if (hollywoodGenre === 'None') {
      alert("Please select a genre first to generate relevant keywords.");
      return;
    }
    setIsGeneratingKeywords(true);
    try {
      const keywords = await generateKeywordsForStyle(hollywoodGenre);
      onKeywordsChange(keywords);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        alert(`Failed to generate keywords: ${message}`);
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  const dropZoneClasses = `flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${isDragging ? 'border-blue-400 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}`;
  const videoStyles: VideoStyle[] = ['Default', 'Cinematic', 'Animation', 'Documentary', 'Vibrant', 'Hollywood', 'Stop-motion', 'Abstract'];
  const videoQualities: VideoQuality[] = ['480p', '720p', '1080p'];
  const aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '3:4'];
  const frameRates: FrameRate[] = ['24fps', '30fps', '60fps'];
  const hollywoodGenres: HollywoodGenre[] = ['None', 'Action', 'Sci-Fi', 'Drama', 'Thriller', 'Epic Fantasy'];
  const transitionStyles: TransitionStyle[] = ['None', 'Fade', 'Slide', 'Zoom', 'Wipe', 'Crossfade', 'Dissolve', 'Iris', 'Push'];
  const transitionStyleLabels: Record<TransitionStyle, string> = {
    'None': 'None (Individual Clips)',
    'Fade': 'Fade',
    'Slide': 'Slide',
    'Zoom': 'Zoom',
    'Wipe': 'Wipe',
    'Crossfade': 'Crossfade',
    'Dissolve': 'Dissolve',
    'Iris': 'Iris',
    'Push': 'Push'
  }

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
        <div className="relative col-span-2">
            <label htmlFor="transition-style" className="block text-sm font-medium text-gray-300 mb-2 text-center">
                Transition Style
                {transitionStyle !== 'None' && (
                    <span className="group relative ml-1">
                        <svg className="inline-block w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                        <span className="absolute bottom-full left-1/2 z-10 w-48 p-2 -translate-x-1/2 mb-2 text-xs leading-tight text-white transform bg-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           With transitions, only the first slide's image can be used as a reference for the whole video.
                        </span>
                    </span>
                )}
            </label>
            <select
                id="transition-style"
                name="transition-style"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={transitionStyle}
                onChange={(e) => onTransitionChange(e.target.value as TransitionStyle)}
            >
                {transitionStyles.map(style => (
                <option key={style} value={style}>{transitionStyleLabels[style]}</option>
                ))}
            </select>
        </div>
        <div className="flex flex-col items-center justify-center">
            <label htmlFor="voiceover-toggle" className="block text-sm font-medium text-gray-300 mb-2 text-center">
                Add Voiceover
            </label>
            <button
                type="button"
                className={`${addVoiceover ? 'bg-blue-600' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800`}
                role="switch"
                aria-checked={addVoiceover}
                onClick={() => onVoiceoverChange(!addVoiceover)}
                id="voiceover-toggle"
            >
                <span className={`${addVoiceover ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
            </button>
        </div>
      </div>
      
       <div className="w-full max-w-4xl col-span-full">
            <label htmlFor="video-duration" className="block text-sm font-medium text-gray-300 mb-2 text-center">
                Video Duration: <span className="font-bold text-blue-400">{videoDuration}s</span>
            </label>
            <input
                id="video-duration"
                type="range"
                min="5"
                max="60"
                step="1"
                value={videoDuration}
                onChange={(e) => onDurationChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
        </div>


      {videoStyle === 'Hollywood' && (
        <div className="w-full max-w-4xl bg-gray-800 p-4 rounded-lg animate-slide-down flex flex-col sm:flex-row gap-4 items-center">
           <div className="flex flex-col">
              <label htmlFor="hollywood-genre" className="block text-sm font-medium text-gray-300 mb-2 text-center">
                Hollywood Genre
              </label>
              <select
                id="hollywood-genre"
                name="hollywood-genre"
                className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
               <div className="relative">
                <input
                  type="text"
                  id="custom-keywords"
                  name="custom-keywords"
                  className="block w-full pl-3 pr-28 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  placeholder="e.g., lens flare, 80s synthwave"
                  value={customKeywords}
                  onChange={(e) => onKeywordsChange(e.target.value)}
                />
                 <button
                    onClick={handleGenerateKeywords}
                    disabled={isGeneratingKeywords || hollywoodGenre === 'None'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-white bg-blue-600 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 disabled:bg-blue-800 disabled:cursor-not-allowed"
                  >
                    {isGeneratingKeywords ? '...' : 'AI Styles'}
                  </button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center pt-2 sm:pt-0">
                <label htmlFor="hollywood-intro-toggle" className="block text-sm font-medium text-gray-300 mb-2 text-center">
                    Hollywood Intro
                </label>
                <button
                    type="button"
                    className={`${addHollywoodIntro ? 'bg-blue-600' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800`}
                    role="switch"
                    aria-checked={addHollywoodIntro}
                    onClick={() => onHollywoodIntroChange(!addHollywoodIntro)}
                    id="hollywood-intro-toggle"
                >
                    <span className={`${addHollywoodIntro ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
                </button>
            </div>
        </div>
      )}

      <label 
          htmlFor="file-upload"
          className={dropZoneClasses}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
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
              id="file-upload"
              name="file-upload"
          />
      </label>
    </div>
  );
};