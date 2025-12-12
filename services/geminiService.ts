import { GoogleGenAI, Type } from "@google/genai";
import { WishResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateHolidayWish = async (recipient: string, theme: string): Promise<WishResponse> => {
  if (!process.env.API_KEY) {
    // Fallback if no API key is present for demo purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: "A Golden Winter Dream",
          poem: "Amidst the emerald boughs and golden light,\nWe wish you wonders on this silent night.\nMay luxury and peace your heart enfold,\nIn stories of the season, warmly told.",
          signature: "With elegance, The Arix Team"
        });
      }, 1500);
    });
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Write a very short, elegant, high-end, and slightly poetic Christmas greeting card content for "${recipient}". 
    The theme is "${theme}" (e.g., Luxury, Gold, Warmth). 
    Return a title, a short 4-line poem, and a sign-off.
    The tone should be sophisticated, magical, and grand.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            poem: { type: Type.STRING },
            signature: { type: Type.STRING }
          },
          required: ["title", "poem", "signature"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    return JSON.parse(text) as WishResponse;
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
};