import { GoogleGenAI } from "@google/genai";
import { CategoryType } from "../types";

const getSystemInstruction = () => `
You are an expert anime critic and analyst. 
Your task is to analyze specific episodes of an anime and provide short, punchy bullet points.
Output must be a JSON array of strings. 
Do not return Markdown formatting. 
Do not return objects, just an array of strings.
Example output: ["Main character realizes their mistake", "The lighting shifts to red to symbolize danger"]
`;

export const generateAnalysisPoints = async (
  animeTitle: string,
  episodeNumber: number,
  category: CategoryType
): Promise<string[]> => {
  // Fix: Use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let promptContext = "";
  if (category === 'emotion') {
    promptContext = "Focus on the emotional development, romantic tension, character relationship shifts, and internal feelings.";
  } else if (category === 'plot') {
    promptContext = "Focus on the plot progression, key events, atmosphere building, and what other characters perceive.";
  } else if (category === 'reasoning') {
    promptContext = "Focus on mystery solving progress, clues given to the audience, and logical deductions.";
  }

  const prompt = `Anime: "${animeTitle}". Episode: ${episodeNumber}. 
  Provide 3 to 4 short bullet points analyzing the "${category}" aspect of this episode.
  ${promptContext}
  Keep points concise (under 15 words each).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(),
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];
    
    // Parse the JSON array
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed.map(String);
        }
    } catch (e) {
        console.warn("Failed to parse JSON, attempting fallback", e);
    }
    return [];

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};