
import { GoogleGenAI } from "@google/genai";
import { SlideData, VideoStyle, VideoQuality, AspectRatio, HollywoodGenre, FrameRate, TransitionStyle, SlideImage } from "../types";

declare const process: any;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const pollVideoOperation = async (operation: any): Promise<any> => {
    let currentOperation = operation;
    while (!currentOperation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
            currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
        } catch (e) {
            console.error("Polling failed, will retry...", e);
        }
    }
    return currentOperation;
};

export const generateVideoFromSlide = async (
    slide: SlideData, 
    style: VideoStyle, 
    quality: VideoQuality, 
    aspectRatio: AspectRatio,
    frameRate: FrameRate,
    genre: HollywoodGenre, 
    keywords: string,
    selectedImage?: SlideImage
): Promise<{ videoUri: string; thumbnailUri?: string }> => {
    let prompt = `Video about: "${slide.text}". Style: ${style}. Aspect ratio: ${aspectRatio}. Frame rate: ${frameRate}.`;
    
    if (style === 'Hollywood') {
        prompt = `Cinematic video about: "${slide.text}". Style: Hollywood. Aspect ratio: ${aspectRatio}. Frame rate: ${frameRate}.`;
        if (genre !== 'None') {
            prompt += ` Genre: ${genre}.`;
        }
        if (keywords.trim() !== '') {
            prompt += ` Keywords: ${keywords}.`;
        }
    }
    
    console.log(`Video quality setting "${quality}" was selected, but the API does not support this parameter. Generating video with default quality.`);

    const request: any = {
        model: 'veo-2.0-generate-001',
        prompt,
        config: {
            numberOfVideos: 1,
        }
    };

    if (selectedImage) {
        request.image = {
            imageBytes: selectedImage.base64,
            mimeType: selectedImage.mimeType
        };
    }

    try {
        let operation = await ai.models.generateVideos(request);
        const finalOperation = await pollVideoOperation(operation);

        const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
        const thumbnailLink = undefined;

        if (!downloadLink) {
            throw new Error(`Video generation failed for slide ${slide.slideNumber}. No download link was provided.`);
        }

        return { videoUri: downloadLink, thumbnailUri: thumbnailLink };
    } catch (error) {
        console.error(`Error generating video for slide ${slide.slideNumber}:`, error);
        throw new Error(`Failed to generate video for slide ${slide.slideNumber}.`);
    }
};


export const generateSingleVideoFromSlides = async (
    slides: SlideData[],
    selectedImages: Record<number, number>,
    style: VideoStyle,
    quality: VideoQuality,
    aspectRatio: AspectRatio,
    frameRate: FrameRate,
    genre: HollywoodGenre,
    keywords: string,
    transition: TransitionStyle
): Promise<{ videoUri: string; thumbnailUri?: string }> => {
    
    let seedImage: { imageBytes: string; mimeType: string; } | undefined = undefined;
    for (const slide of slides) {
        const selectedImageIndex = selectedImages[slide.slideNumber];
        if (slide.images.length > 0 && selectedImageIndex !== undefined) {
            const image = slide.images[selectedImageIndex];
            seedImage = {
                imageBytes: image.base64,
                mimeType: image.mimeType
            };
            break; 
        }
    }

    let prompt: string;
    if (style === 'Hollywood') {
        prompt = `A single continuous video. Style: Hollywood. Aspect ratio: ${aspectRatio}. Frame rate: ${frameRate}. Transition between scenes: ${transition.toLowerCase()}.`;
        if (genre !== 'None') prompt += ` Genre: ${genre}.`;
        if (keywords.trim() !== '') prompt += ` Keywords: ${keywords}.`;
    } else {
        prompt = `A single continuous video. Style: ${style}. Aspect ratio: ${aspectRatio}. Frame rate: ${frameRate}. Transition between scenes: ${transition.toLowerCase()}.`;
    }

    prompt += '\nScenes:\n';

    slides.forEach((slide, index) => {
        prompt += `- Scene ${index + 1}: "${slide.text}"\n`;
    });

    console.log(`Video quality setting "${quality}" was selected, but the API does not support this parameter. Generating video with default quality.`);

    const request: any = {
        model: 'veo-2.0-generate-001',
        prompt,
        config: {
            numberOfVideos: 1,
        }
    };

    if (seedImage) {
        request.image = seedImage;
        console.log("Using an image from the presentation as a visual seed for the entire video.");
    }
    
    try {
        let operation = await ai.models.generateVideos(request);
        const finalOperation = await pollVideoOperation(operation);

        const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
        const thumbnailLink = undefined;

        if (!downloadLink) {
            throw new Error(`Combined video generation failed. No download link was provided.`);
        }

        return { videoUri: downloadLink, thumbnailUri: thumbnailLink };
    } catch (error) {
        console.error(`Error generating combined video:`, error);
        throw new Error(`Failed to generate the combined video.`);
    }
};
