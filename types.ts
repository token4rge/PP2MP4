
export interface SlideData {
  slideNumber: number;
  text: string;
  imageBases64: string[];
}

export interface VideoResult {
  slideNumber: number;
  videoUri: string;
  thumbnailUri?: string;
  text: string;
}

export type VideoStyle = 'Default' | 'Cinematic' | 'Animated' | 'Documentary' | 'Vibrant' | 'Hollywood';

export type VideoQuality = '480p' | '720p' | '1080p';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export type FrameRate = '24fps' | '30fps' | '60fps';

export type HollywoodGenre = 'None' | 'Action' | 'Sci-Fi' | 'Drama' | 'Thriller' | 'Epic Fantasy';