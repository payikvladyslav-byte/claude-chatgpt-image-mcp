import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

export interface ImageMetadata {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
    density?: number;
}

export class ImageProcessor {
    private maxSizeMB: number;
    private supportedFormats: string[];

  constructor(maxSizeMB: number = 50, supportedFormats: string[] = ['jpg', 'jpeg', 'png', 'gif', 'webp']) {
        this.maxSizeMB = maxSizeMB;
        this.supportedFormats = supportedFormats;
  }

  async validateImage(imagePath: string): Promise<boolean> {
        try {
                const ext = path.extname(imagePath).toLowerCase().replace('.', '');
                if (!this.supportedFormats.includes(ext)) {
                          throw new Error(`Unsupported format: ${ext}`);
                }
                const stats = fs.statSync(imagePath);
                if (stats.size > this.maxSizeMB * 1024 * 1024) {
                          throw new Error(`File size exceeds ${this.maxSizeMB}MB limit`);
                }
                return true;
        } catch (error) {
                console.error('Image validation failed:', error);
                return false;
        }
  }

  async getImageMetadata(imagePath: string): Promise<ImageMetadata> {
        try {
                const stats = fs.statSync(imagePath);
                const metadata = await sharp(imagePath).metadata();
                return {
                          width: metadata.width,
                          height: metadata.height,
                          format: metadata.format,
                          size: stats.size,
                          density: metadata.density,
                };
        } catch (error) {
                throw new Error(`Failed to get image metadata: ${error}`);
        }
  }

  async resizeImage(imagePath: string, width: number = 1024, height: number = 1024): Promise<Buffer> {
        try {
                return await sharp(imagePath)
                  .resize(width, height, {
                              fit: 'inside',
                              withoutEnlargement: true,
                  })
                  .toBuffer();
        } catch (error) {
                throw new Error(`Image resize failed: ${error}`);
        }
  }

  async convertToFormat(imagePath: string, format: 'jpeg' | 'png' | 'webp' = 'jpeg', quality: number = 80): Promise<Buffer> {
        try {
                let sharpImage = sharp(imagePath);
                switch (format) {
                  case 'jpeg':
                              sharpImage = sharpImage.jpeg({ quality });
                              break;
                  case 'png':
                              sharpImage = sharpImage.png();
                              break;
                  case 'webp':
                              sharpImage = sharpImage.webp({ quality });
                              break;
                }
                return await sharpImage.toBuffer();
        } catch (error) {
                throw new Error(`Format conversion failed: ${error}`);
        }
  }

  async extractTextOCR(imagePath: string, language: string = 'eng'): Promise<string> {
        try {
                const { data: { text } } = await Tesseract.recognize(imagePath, language);
                return text.trim();
        } catch (error) {
                throw new Error(`OCR extraction failed: ${error}`);
        }
  }

  async processImageBatch(imagePaths: string[]): Promise<Map<string, Buffer>> {
        const results = new Map<string, Buffer>();
        for (const imagePath of imagePaths) {
                const isValid = await this.validateImage(imagePath);
                if (isValid) {
                          const resized = await this.resizeImage(imagePath);
                          results.set(imagePath, resized);
                }
        }
        return results;
  }
}
