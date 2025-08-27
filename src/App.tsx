import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ResultsDisplay } from './components/ResultsDisplay';
import { extractSlidesFromPptx } from './services/pptxParser';
import { generateVideoFromSlide } from './services/geminiService';
import { type SlideData, type VideoResult, type VideoStyle, type VideoQuality, type HollywoodGenre, type AspectRatio, type FrameRate } from './types';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';
import { SlideReview } from './components/SlideReview';

enum AppState {
  IDLE,
  REVIEWING_SLIDES,
  PROCESSING,
  SUCCESS,
  ERROR,
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [parsedSlides, setParsedSlides] = useState<SlideData[]>([]);
  const [imageSelections, setImageSelections] = useState<Record<number, number>>({});
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('Default');
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('720p');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [frameRate, setFrameRate] = useState<FrameRate>('30fps');
  const [hollywoodGenre, setHollywoodGenre] = useState<HollywoodGenre>('None');
  const [customKeywords, setCustomKeywords] = useState<string>('');


  const handleFileUpload = useCallback(async (file: File) => {
    setAppState(AppState.PROCESSING);
    setProcessingMessage('Parsing your presentation...');
    setErrorMessage('');
    setVideoResults([]);
    setParsedSlides([]);
    setImageSelections({});

    try {
      const slides = await extractSlidesFromPptx(file);
      if (slides.length === 0) {
        throw new Error('No content could be extracted from the presentation.');
      }
      setParsedSlides(slides);

      const initialSelections: Record<number, number> = {};
       slides.forEach(slide => {
          if (slide.imageBases64.length > 0) {
              initialSelections[slide.slideNumber] = 0;
          }
      });
      setImageSelections(initialSelections);

      setAppState(AppState.REVIEWING_SLIDES);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error("Parsing failed:", message);
      setErrorMessage(message);
      setAppState(AppState.ERROR);
    } finally {
      setProcessingMessage('');
    }
  }, []);

  const handleStartGeneration = useCallback(async () => {
    setAppState(AppState.PROCESSING);
    setErrorMessage('');
    setVideoResults([]);

    try {
      const results: VideoResult[] = [];
      for (const slide of parsedSlides) {
        setProcessingMessage(`Generating video for slide ${slide.slideNumber} of ${parsedSlides.length}...`);
        const selectedImageIndex = imageSelections[slide.slideNumber];

        const { videoUri, thumbnailUri } = await generateVideoFromSlide(
            slide, 
            videoStyle, 
            videoQuality, 
            aspectRatio,
            frameRate,
            hollywoodGenre, 
            customKeywords,
            selectedImageIndex
        );
        
        const newResult: VideoResult = {
          slideNumber: slide.slideNumber,
          videoUri,
          thumbnailUri,
          text: slide.text,
        };
        results.push(newResult);
        setVideoResults([...results]); 
      }
      setAppState(AppState.SUCCESS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error("Processing failed:", message);
      setErrorMessage(message);
      setAppState(AppState.ERROR);
    } finally {
      setProcessingMessage('');
    }
  }, [parsedSlides, imageSelections, videoStyle, videoQuality, aspectRatio, frameRate, hollywoodGenre, customKeywords]);

  const handleSelectionChange = (slideNumber: number, imageIndex: number) => {
    setImageSelections(prev => ({ ...prev, [slideNumber]: imageIndex }));
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setVideoResults([]);
    setErrorMessage('');
    setParsedSlides([]);
    setImageSelections({});
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.PROCESSING:
        return <LoadingIndicator message={processingMessage} />;
      case AppState.REVIEWING_SLIDES:
        return <SlideReview
          slides={parsedSlides}
          selections={imageSelections}
          onSelectionChange={handleSelectionChange}
          onGenerate={handleStartGeneration}
          onCancel={handleReset}
        />;
      case AppState.SUCCESS:
        return <ResultsDisplay results={videoResults} onReset={handleReset} />;
      case AppState.ERROR:
        return <ErrorDisplay message={errorMessage} onReset={handleReset} />;
      case AppState.IDLE:
      default:
        return (
          <FileUpload
            onFileProcess={handleFileUpload}
            videoStyle={videoStyle}
            onStyleChange={setVideoStyle}
            videoQuality={videoQuality}
            onQualityChange={setVideoQuality}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            frameRate={frameRate}
            onFrameRateChange={setFrameRate}
            hollywoodGenre={hollywoodGenre}
            onGenreChange={setHollywoodGenre}
            customKeywords={customKeywords}
            onKeywordsChange={setCustomKeywords}
          />
        );
    }
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto">
        <Header />
        <main className="mt-12 flex justify-center">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;