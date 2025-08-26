
import { SlideData } from '../types';

// Fix: Add ambient declaration for JSZip to resolve 'Cannot find name' error.
// This declaration allows TypeScript to recognize the JSZip object loaded from the CDN.
declare const JSZip: any;

// Helper to safely get XML content from the zipped file
const getXmlContent = async (zip: any, path: string): Promise<XMLDocument | null> => {
    const file = zip.file(path);
    if (file) {
        const text = await file.async('text');
        return new DOMParser().parseFromString(text, 'text/xml');
    }
    return null;
};

// Helper to find image relationships for a specific slide
const getSlideImageRels = async (zip: any, slideNumber: number): Promise<Record<string, string>> => {
    const rels: Record<string, string> = {};
    const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
    const relsXml = await getXmlContent(zip, relsPath);

    if (relsXml) {
        const relationships = relsXml.getElementsByTagName('Relationship');
        for (let i = 0; i < relationships.length; i++) {
            const rel = relationships[i];
            if (rel.getAttribute('Type')?.endsWith('/image')) {
                const id = rel.getAttribute('Id');
                const target = rel.getAttribute('Target');
                if (id && target) {
                    const mediaPath = `ppt/media/${target.split('/').pop()}`;
                    rels[id] = mediaPath;
                }
            }
        }
    }
    return rels;
};

// Main function to extract structured data from all slides
export const extractSlidesFromPptx = async (file: File): Promise<SlideData[]> => {
    const zip = await JSZip.loadAsync(file);
    const slides: SlideData[] = [];
    let slideNumber = 1;

    while (true) {
        const slidePath = `ppt/slides/slide${slideNumber}.xml`;
        const slideXml = await getXmlContent(zip, slidePath);

        if (!slideXml) {
            break; // No more slides found
        }

        const textNodes = slideXml.getElementsByTagName('a:t');
        let slideText = '';
        for (let i = 0; i < textNodes.length; i++) {
            slideText += textNodes[i].textContent + ' ';
        }

        const imageBases64: string[] = [];
        const imageRels = await getSlideImageRels(zip, slideNumber);
        const imageElements = slideXml.getElementsByTagName('a:blip');

        // Extract all images found on the slide
        if (imageElements.length > 0) {
            for (let i = 0; i < imageElements.length; i++) {
                const embedId = imageElements[i].getAttribute('r:embed');
                if (embedId && imageRels[embedId]) {
                    const imagePath = imageRels[embedId];
                    const imageFile = zip.file(imagePath);
                    if (imageFile) {
                        const base64 = await imageFile.async('base64');
                        imageBases64.push(base64);
                    }
                }
            }
        }

        // Only add slides that contain some text
        if (slideText.trim().length > 0) {
            slides.push({
                slideNumber,
                text: slideText.trim(),
                imageBases64,
            });
        }

        slideNumber++;
    }

    if (slides.length === 0) {
        throw new Error("Could not find any slides with text content in the presentation.");
    }

    return slides;
};
