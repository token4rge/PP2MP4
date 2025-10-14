
import { GoogleGenAI } from "@google/genai";
import { SlideData, VideoStyle, VideoQuality, AspectRatio, HollywoodGenre, FrameRate, TransitionStyle, SlideImage } from "../types";

declare const process: any;

// A singleton instance to avoid re-creating the client on every call
let ai: GoogleGenAI | null = null;

const getGenAIClient = (): GoogleGenAI => {
    // Vite replaces process.env.API_KEY with the value at build time.
    // If it's undefined or an empty string, we should throw an error.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY is not configured. Please ensure it's set in your deployment environment.");
    }
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: apiKey });
    }
    return ai;
};


const pollVideoOperation = async (operation: any, ai_client: GoogleGenAI): Promise<any> => {
    let currentOperation = operation;
    let retries = 0;
    const MAX_RETRIES = 5;

    while (!currentOperation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
            currentOperation = await ai_client.operations.getVideosOperation({ operation: currentOperation });
            retries = 0; // Reset on success
        } catch (e) {
            console.error("Polling for video operation failed. Retrying...", e);
            retries++;
            if (retries >= MAX_RETRIES) {
                if (e instanceof Error) {
                    throw new Error(`Polling for video status failed after ${MAX_RETRIES} retries: ${e.message}`);
                }
                throw new Error(`Polling for video status failed after ${MAX_RETRIES} retries.`);
            }
        }
    }
    return currentOperation;
};

export const extractTextFromImage = async (image: SlideImage): Promise<string> => {
    try {
        const ai_client = getGenAIClient();
        const response = await ai_client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: 'Extract all text from this image. If no text is present, return an empty string.' },
                    { inlineData: { mimeType: image.mimeType, data: image.base64 } }
                ]
            },
        });
        return (response.text || "").trim();
    } catch (error) {
        console.error("Error during OCR text extraction:", error);
        // Do not throw; just return empty so the main process is not blocked.
        return "";
    }
};

export const generateKeywordsForStyle = async (genre: HollywoodGenre): Promise<string> => {
    if (genre === 'None') return "";
    try {
        const ai_client = getGenAIClient();
         const response = await ai_client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 5-7 creative and descriptive keywords for a video with a "${genre}" genre. Return only a comma-separated list. For example: "keyword one, keyword two, keyword three"`,
        });
        return (response.text || "").trim();
    } catch(e) {
        const message = e instanceof Error ? e.message : "An unknown error occurred";
        console.error("Error generating keywords:", message);
        throw new Error(`AI keyword generation failed. ${message}`);
    }
};

const handleApiError = (error: any, context: string): Error => {
    console.error(`Error ${context}:`, error);

    // Prefer using a structured error message if available.
    if (error?.message) {
        const message = String(error.message);
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('safety')) {
            return new Error("The prompt was blocked due to a safety policy. Please modify the slide text or keywords.");
        }
        if (lowerMessage.includes('invalid argument')) {
            return new Error(`The request was invalid. The API reported: ${message}`);
        }
        if (lowerMessage.includes('internal')) {
            return new Error("An internal server error occurred with the API. Please try again later.");
        }
        // If no specific keyword is found, return the original API error message.
        return new Error(message);
    }
    
    // Fallback for non-standard errors
    return new Error(`An unknown error occurred ${context}.`);
};

export const generateVideoFromSlide = async (
    slide: SlideData, 
    style: VideoStyle, 
    quality: VideoQuality, 
    aspectRatio: AspectRatio,
    frameRate: FrameRate,
    genre: HollywoodGenre, 
    keywords: string,
    selectedImage: SlideImage | undefined,
    addVoiceover: boolean,
    addHollywoodIntro: boolean,
    duration: number,
): Promise<{ videoUri: string; thumbnailUri?: string }> => {
    try {
        const ai_client = getGenAIClient();
        let introPrompt = '';
        if (addHollywoodIntro && style === 'Hollywood') {
            introPrompt = `Start with a dramatic 5-10 second movie trailer intro. It should be a fast-paced montage with epic music, teasing the main themes. After the intro, the main video begins. `;
        }

        let prompt = `Video about: "${slide.text}". Style: ${style}. Aspect ratio: ${aspectRatio}. Frame rate: ${frameRate}. The video should be approximately ${duration} seconds long.`;
        
        if (style === 'Hollywood') {
            prompt = `${introPrompt}Cinematic video about: "${slide.text}". Style: Hollywood. Aspect ratio: ${aspectRatio}. Frame rate: ${frameRate}. The video should be approximately ${duration} seconds long.`;
            if (genre !== 'None') prompt += ` Genre: ${genre}.`;
            if (keywords.trim() !== '') prompt += ` Keywords: ${keywords}.`;
        }

        if (addVoiceover && slide.text) {
            prompt += ` Include a clear voiceover narrating the text.`;
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

        let operation = await ai_client.models.generateVideos(request);
        const finalOperation = await pollVideoOperation(operation, ai_client);

        const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            const failureError = finalOperation.error || new Error('API operation completed without providing a video link.');
            throw failureError;
        }

        return { videoUri: downloadLink, thumbnailUri: undefined };
    } catch (error) {
        throw handleApiError(error, `while generating video for slide ${slide.slideNumber}`);
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
    transition: TransitionStyle,
    addVoiceover: boolean,
    addHollywoodIntro: boolean,
    duration: number,
): Promise<{ videoUri: string; thumbnailUri?: string }> => {
    
    try {
        const ai_client = getGenAIClient();
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

        let introPrompt = '';
        if (addHollywoodIntro && style === 'Hollywood') {
            introPrompt = `Start with a dramatic 5-10 second movie trailer intro. It should be a fast-paced montage with epic music, teasing the main themes. After the intro, the main video begins. `;
        }

        let prompt: string;
        if (style === 'Hollywood') {
            prompt = `${introPrompt}A single continuous video. Style: Hollywood. Aspect ratio: ${aspectRatio}. Frame rate: ${frameRate}. Total duration should be approximately ${duration} seconds. Transition between scenes: ${transition.toLowerCase()}.`;
            if (genre !== 'None') prompt += ` Genre: ${genre}.`;
            if (keywords.trim() !== '') prompt += ` Keywords: ${keywords}.`;
        } else {
            prompt = `A single continuous video. Style: ${style}. Aspect ratio: ${aspectRatio}. Frame rate: ${frameRate}. Total duration should be approximately ${duration} seconds. Transition between scenes: ${transition.toLowerCase()}.`;
        }
        
        prompt += '\nThe video should tell a cohesive story across all scenes.\n';
        
        if (addVoiceover) {
            prompt += 'Include a single, continuous voiceover narrating the story. Here is the script for each scene:\n';
        } else {
            prompt += 'Here are the scenes:\n';
        }

        slides.forEach((slide, index) => {
            if(slide.text) {
              prompt += `- Scene ${index + 1}: "${slide.text}"\n`;
            }
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
        
        let operation = await ai_client.models.generateVideos(request);
        const finalOperation = await pollVideoOperation(operation, ai_client);

        const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            const failureError = finalOperation.error || new Error('API operation completed without providing a video link.');
            throw failureError;
        }

        return { videoUri: downloadLink, thumbnailUri: undefined };
    } catch (error) {
       throw handleApiError(error, 'while generating the combined video');
    }
};
