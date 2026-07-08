import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

export interface ChatGPTAnalysisResult {
    description: string;
    objects: string[];
    confidence: number;
    detectedText?: string;
}

export class ChatGPTAnalyzer {
    private client: OpenAI;

  constructor(apiKey?: string) {
        this.client = new OpenAI({
                apiKey: apiKey || process.env.CHATGPT_API_KEY,
        });
  }

  async analyzeImage(imagePath: string): Promise<ChatGPTAnalysisResult> {
        try {
                const imageBuffer = fs.readFileSync(imagePath);
                const base64Image = imageBuffer.toString('base64');
                const mediaType = this.getMediaType(imagePath);

          const response = await this.client.chat.completions.create({
                    model: process.env.CHATGPT_MODEL || 'gpt-4-vision',
                    max_tokens: 1024,
                    messages: [
                      {
                                    role: 'user',
                                    content: [
                                      {
                                                        type: 'image_url',
                                                        image_url: {
                                                                            url: `data:${mediaType};base64,${base64Image}`,
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

          const responseText = response.choices[0].message.content || '';
                return this.parseResponse(responseText);
        } catch (error) {
                throw new Error(`ChatGPT analysis failed: ${error}`);
        }
  }

  private parseResponse(responseText: string): ChatGPTAnalysisResult {
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
