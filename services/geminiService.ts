import { GoogleGenAI } from "@google/genai";
import { SlideData, VideoStyle, VideoQuality, AspectRatio, HollywoodGenre, FrameRate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper function to poll for video generation status, as this is an async operation
const pollVideoOperation = async (operation: any): Promise<any> => {
    let currentOperation = operation;
    while (!currentOperation.done) {
        // Wait for 10 seconds before polling again
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
    selectedImageIndex?: number
): Promise<{ videoUri: string; thumbnailUri?: string }> => {
    let prompt = `Create a short, engaging video clip based on this narration: "${slide.text}". The video should visually represent the text's content, be in a ${aspectRatio} aspect ratio, and rendered at ${frameRate}.`;

    if (style === 'Hollywood') {
        let hollywoodPrompt = `Generate a cinematic, Hollywood-style video in a ${aspectRatio} aspect ratio and at ${frameRate}. The video should be epic, with dramatic visuals, and feel like a movie trailer.`;
        if (genre !== 'None') {
            hollywoodPrompt += ` The genre is ${genre}.`;
        }
        if (keywords.trim() !== '') {
            hollywoodPrompt += ` Incorporate the following elements or styles: ${keywords}.`;
        }
        hollywoodPrompt += ` Base the entire video on this core narration: "${slide.text}".`;
        prompt = hollywoodPrompt;
    } else if (style !== 'Default') {
        prompt = `Create a short, engaging video clip in a ${style.toLowerCase()} style, based on this narration: "${slide.text}". The video should visually represent the text's content, be in a ${aspectRatio} aspect ratio, and rendered at ${frameRate}.`;
    }
    
    // The Gemini VEO API does not currently support a direct parameter for video quality.
    // We log this information for the developer as requested by the user.
    console.log(`Video quality setting "${quality}" was selected, but the API does not support this parameter. Generating video with default quality.`);
    
    // The Gemini VEO API does not currently support a direct parameter for frame rate.
    console.log(`Frame rate setting "${frameRate}" was selected, but the API does not support this parameter. Requesting via prompt.`);


    // The Gemini VEO API does not currently return separate video thumbnails.
    // This code is structured to handle a thumbnail URI if the API provides one in the future.
    console.log("Thumbnail generation is not currently supported by the VEO API. The video's first frame will be used as a preview.");

    const request: any = {
        model: 'veo-2.0-generate-001',
        prompt,
        config: {
            numberOfVideos: 1,
        }
    };

    if (slide.imageBases64 && slide.imageBases64.length > 0) {
        // Use the selected image if an index is provided and valid, otherwise default to the first image.
        const imageIndex = (selectedImageIndex !== undefined && selectedImageIndex < slide.imageBases64.length) 
            ? selectedImageIndex 
            : 0;

        const mimeType = 'image/png'; // A safe default, pptx usually stores png/jpeg
        request.image = {
            imageBytes: slide.imageBases64[imageIndex],
            mimeType: mimeType
        };
    }

    try {
        let operation = await ai.models.generateVideos(request);
        const finalOperation = await pollVideoOperation(operation);

        const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
        // The API currently does not provide a separate thumbnail URI.
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