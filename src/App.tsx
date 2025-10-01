
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ResultsDisplay } from './components/ResultsDisplay';
import { extractSlidesFromPptx } from './services/pptxParser';
import { generateVideoFromSlide, generateSingleVideoFromSlides } from './services/geminiService';
import { type SlideData, type VideoResult, type VideoStyle, type VideoQuality, type HollywoodGenre, type AspectRatio, type FrameRate, type TransitionStyle, type SlideImage } from './types';
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
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>('None');
  const [addVoiceover, setAddVoiceover] = useState<boolean>(true);
  const [addHollywoodIntro, setAddHollywoodIntro] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(15);


  const handleFileUpload = useCallback(async (file: File) => {
    setAppState(AppState.PROCESSING);
    setProcessingMessage('Parsing your presentation...');
    setErrorMessage('');
    setVideoResults([]);
    setParsedSlides([]);
    setImageSelections({});

    try {
      const slides = await extractSlidesFromPptx(file, (message) => setProcessingMessage(message));
      if (slides.length === 0) {
        throw new Error('No content could be extracted from the presentation.');
      }
      setParsedSlides(slides);

      const initialSelections: Record<number, number> = {};
       slides.forEach(slide => {
          if (slide.images.length > 0) {
              initialSelections[slide.slideNumber] = 0;
          }
      });
      setImageSelections(initialSelections);

      setAppState(AppState.REVIEWING_SLIDES);
    } catch (error) {
      console.error("Presentation parsing failed:", error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred during parsing.';
      setErrorMessage(`Failed to parse the presentation. ${message}`);
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
      if (transitionStyle === 'None') {
        // Generate individual video clips
        const results: VideoResult[] = [];
        for (const slide of parsedSlides) {
          setProcessingMessage(`Generating video for slide ${slide.slideNumber} of ${parsedSlides.length}...`);
          const selectedImageIndex = imageSelections[slide.slideNumber];

          const selectedImageObject = slide.images.length > 0 && selectedImageIndex !== undefined
            ? slide.images[selectedImageIndex]
            : undefined;

          const { videoUri, thumbnailUri } = await generateVideoFromSlide(
              slide, 
              videoStyle, 
              videoQuality, 
              aspectRatio,
              frameRate,
              hollywoodGenre, 
              customKeywords,
              selectedImageObject,
              addVoiceover,
              addHollywoodIntro,
              videoDuration
          );
          
          const newResult: VideoResult = {
            slideNumber: slide.slideNumber,
            videoUri,
            thumbnailUri,
            text: slide.text,
            image: selectedImageObject,
          };
          results.push(newResult);
          setVideoResults([...results]); 
        }
      } else {
        // Generate a single combined video
        setProcessingMessage(`Generating single video with '${transitionStyle}' transitions...`);
        let firstImage: SlideImage | undefined;
        for (const slide of parsedSlides) {
          const selectedImageIndex = imageSelections[slide.slideNumber];
          if (slide.images.length > 0 && selectedImageIndex !== undefined) {
            firstImage = slide.images[selectedImageIndex];
            break; 
          }
        }
        
        const { videoUri, thumbnailUri } = await generateSingleVideoFromSlides(
          parsedSlides,
          imageSelections,
          videoStyle,
          videoQuality,
          aspectRatio,
          frameRate,
          hollywoodGenre,
          customKeywords,
          transitionStyle,
          addVoiceover,
          addHollywoodIntro,
          videoDuration
        );

        const combinedResult: VideoResult = {
          slideNumber: 1,
          videoUri,
          thumbnailUri,
          text: `Combined video of ${parsedSlides.length} slides with '${transitionStyle}' transitions.`,
          image: firstImage,
        };
        setVideoResults([combinedResult]);
      }
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error("Video generation failed:", error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setErrorMessage(`Video generation failed. ${message}`);
      setAppState(AppState.ERROR);
    } finally {
      setProcessingMessage('');
    }
  }, [parsedSlides, imageSelections, videoStyle, videoQuality, aspectRatio, frameRate, hollywoodGenre, customKeywords, transitionStyle, addVoiceover, addHollywoodIntro, videoDuration]);

  const handleSelectionChange = (slideNumber: number, imageIndex: number) => {
    setImageSelections(prev => ({ ...prev, [slideNumber]: imageIndex }));
  };
  
  const handleAddNewImageToSlide = (slideNumber: number, newImage: SlideImage) => {
    let newImageIndex = -1;
    setParsedSlides(prevSlides => 
        prevSlides.map(slide => {
            if (slide.slideNumber === slideNumber) {
                const updatedImages = [...slide.images, newImage];
                newImageIndex = updatedImages.length - 1;
                return { ...slide, images: updatedImages };
            }
            return slide;
        })
    );

    if (newImageIndex !== -1) {
        setImageSelections(prevSelections => ({
            ...prevSelections,
            [slideNumber]: newImageIndex,
        }));
    }
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
          onUpdateSlide={handleAddNewImageToSlide}
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
            transitionStyle={transitionStyle}
            onTransitionChange={setTransitionStyle}
            addVoiceover={addVoiceover}
            onVoiceoverChange={setAddVoiceover}
            addHollywoodIntro={addHollywoodIntro}
            onHollywoodIntroChange={setAddHollywoodIntro}
            videoDuration={videoDuration}
            onDurationChange={setVideoDuration}
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
