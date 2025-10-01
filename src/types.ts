
export interface SlideImage {
    base64: string;
    mimeType: string;
}

export interface SlideData {
  slideNumber: number;
  text: string;
  images: SlideImage[];
}

export interface VideoResult {
  slideNumber: number;
  videoUri: string;
  thumbnailUri?: string;
  text: string;
  image?: SlideImage;
}

export type VideoStyle = 'Default' | 'Cinematic' | 'Animation' | 'Documentary' | 'Vibrant' | 'Hollywood' | 'Stop-motion' | 'Abstract';

export type VideoQuality = '480p' | '720p' | '1080p';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export type FrameRate = '24fps' | '30fps' | '60fps';

export type HollywoodGenre = 'None' | 'Action' | 'Sci-Fi' | 'Drama' | 'Thriller' | 'Epic Fantasy';

export type TransitionStyle = 'None' | 'Fade' | 'Slide' | 'Zoom';
