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

export const extractTextFromImage = async (image: SlideImage): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: 'Extract all text from this image. If no text is present, return an empty string.' },
                    { inlineData: { mimeType: image.mimeType, data: image.base64 } }
                ]
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error during OCR text extraction:", error);
        // Do not throw; just return empty so the main process is not blocked.
        return "";
    }
};

export const generateKeywordsForStyle = async (genre: HollywoodGenre): Promise<string> => {
    if (genre === 'None') return "";
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 5-7 creative and descriptive keywords for a video with a "${genre}" genre. Return only a comma-separated list. For example: "keyword one, keyword two, keyword three"`,
        });
        return response.text.trim();
    } catch(e) {
        const message = e instanceof Error ? e.message : "An unknown error occurred";
        console.error("Error generating keywords:", message);
        throw new Error(`AI keyword generation failed. ${message}`);
    }
};


const handleApiError = (error: unknown, context: string): Error => {
    console.error(`Error ${context}:`, error);
    if (error instanceof Error) {
        // Attempt to parse a more specific message if the error comes from the API
        // This is a simplistic check; a real implementation might check for specific error codes
        if (error.message.includes('SAFETY')) {
            return new Error("The prompt was blocked due to the safety policy. Please modify the slide text or keywords.");
        }
        if (error.message.includes('400')) {
             return new Error("The request was invalid. This could be due to a malformed image or unsupported parameters.");
        }
        if (error.message.includes('500')) {
             return new Error("An internal server error occurred with the API. Please try again later.");
        }
        return new Error(`A network or API error occurred: ${error.message}`);
    }
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
            durationSecs: duration,
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
        if (!downloadLink) {
            // Check for specific failure reasons if available
            const failureReason = finalOperation.error?.message || 'No download link was provided by the API.';
            throw new Error(`Video generation failed for slide ${slide.slideNumber}. Reason: ${failureReason}`);
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
            durationSecs: duration
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
        if (!downloadLink) {
            const failureReason = finalOperation.error?.message || 'No download link was provided by the API.';
            throw new Error(`Combined video generation failed. Reason: ${failureReason}`);
        }

        return { videoUri: downloadLink, thumbnailUri: undefined };
    } catch (error) {
       throw handleApiError(error, 'while generating the combined video');
    }
};