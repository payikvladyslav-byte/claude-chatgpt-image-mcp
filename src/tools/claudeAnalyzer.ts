import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

export interface ClaudeAnalysisResult {
  description: string;
  objects: string[];
  confidence: number;
  detectedText?: string;
}

export class ClaudeAnalyzer {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
                                      apiKey: apiKey || process.env.CLAUDE_API_KEY,
                                    });
  }

  async analyzeImage(imagePath: string): Promise<ClaudeAnalysisResult> {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mediaType = this.getMediaType(imagePath);

      const response = await this.client.messages.create({
                                                                 model: 'claude-3-5-sonnet-20241022',
                                                                 max_tokens: 1024,
                                                                 messages: [
                                                                   {
                                                                     role: 'user',
                                                                     content: [
                                                                       {
                                                                         type: 'image',
                                                                         source: {
                                                                           type: 'base64',
                                                                           media_type: mediaType as any,
                                                                           data: base64Image,
                                                                         },
                                                                       },
                                                                       {
                                                                         type: 'text',
                                                                         text: `Analyze this image and provide a detailed analysis in JSON format with the following fields:
                                                         - description: A detailed description of what you see
                                                         - objects: An array of detected objects or entities
                                                         - confidence: Your confidence level (0-1)
                                                         - detectedText: Any text visible in the image`,
                                                                       },
                                                                     ],
          },
        ],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseResponse(responseText);
    } catch (error) {
      throw new Error(`Claude analysis failed: ${error}`);
    }
  }

  private parseResponse(responseText: string): ClaudeAnalysisResult {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {
        description: responseText,
        objects: [],
        confidence: 0.8,
      };
    } catch {
      return {
        description: responseText,
        objects: [],
        confidence: 0.5,
      };
    }
  }

  private getMediaType(imagePath: string): string {
    const ext = path.extname(imagePath).toLowerCase();
    const mediaTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mediaTypes[ext] || 'image/jpeg';
  }
}
