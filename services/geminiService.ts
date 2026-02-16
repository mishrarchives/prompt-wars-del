
import { GoogleGenAI, Type } from "@google/genai";
import { GameEvent, GameState } from "../types";

// Personality prompts for the AI narrator
export const getAIPersonalityPrompt = (personality: string) => {
  const base = `You are a "Next-Gen Bricks" dynamic narrator. `;
  const personalities: Record<string, string> = {
    'Sarcastic Coach': `You are a sarcastic, high-standard coach who mocks small mistakes but gives grudging respect for big plays. Use gaming slang and dry humor.`,
    'Hype Man': `You are an energetic, shouting Hype Man who treats every line clear like a stadium touchdown. High energy, many emojis, and CAPS LOCK for emphasis.`,
    'Zen Master': `You are a calm, philosophical monk who sees the falling blocks as a metaphor for the universe. Use poetic, tranquil language.`,
    'Cyberpunk Glitch': `You are an AI from 2077 suffering from slight kernel corruption. Use technical jargon, glitchy text (like [REDACTED]), and dystopian vibes.`
  };
  return base + (personalities[personality] || personalities['Sarcastic Coach']);
};

/**
 * Generates witty commentary based on game events using Gemini.
 */
export const generateCommentary = async (
  event: GameEvent, 
  state: Partial<GameState>, 
  personality: string = 'Sarcastic Coach'
): Promise<string> => {
  try {
    // Initialize GoogleGenAI inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Event: ${event}. Current Score: ${state.score}, Lines: ${state.lines}, Level: ${state.level}. 
    Provide a brief (10-15 words) witty reaction to this game state. 
    Context: A line-stacking game similar to Tetris. 
    If it's a "Drought", emphasize the wait for the 'I' piece. If it's a "Tetris" (4 lines), celebrate the clearing.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: getAIPersonalityPrompt(personality),
        temperature: 0.9,
      }
    });

    return response.text?.trim() || "The blocks fall as destiny dictates.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The void remains silent...";
  }
};

/**
 * Suggests a creative game mutation using Gemini's JSON output capability.
 */
export const suggestMutation = async (
  linesPerMinute: number,
  currentLevel: number
): Promise<{ name: string; description: string; type: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player is clearing ${linesPerMinute.toFixed(1)} lines per minute at level ${currentLevel}. 
      Suggest a creative "Mutation" to keep them in flow. Examples: "Gravity Pulse" (random speed shifts), "Mirror Realm" (controls swap), "Ghost Pieces" (blocks turn semi-invisible).
      Return JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING }
          },
          required: ["name", "description", "type"],
          propertyOrdering: ["name", "description", "type"]
        }
      }
    });

    let jsonStr = response.text.trim();
    // Strip potential markdown markers to prevent JSON parse errors
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    }
    
    return JSON.parse(jsonStr || "{}");
  } catch (error) {
    console.error("Mutation Suggestion Error:", error);
    return {
      name: "Gravity Surge",
      description: "Standard level difficulty increase.",
      type: "speed"
    };
  }
};

/**
 * Analyzes an image to generate a starting Tetris grid.
 * Returns (string | null)[][] where strings represent block colors.
 */
export const analyzeLevelImage = async (base64Image: string): Promise<(string | null)[][]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: "Analyze this image's brightness and structure. Convert it into a 20-row by 10-column grid for a Tetris game. Represent high-density or dark areas as 1 (blocked) and light areas as 0 (empty). Return only the JSON grid as an array of arrays of numbers: [[...], [...]]. Limit blocks to the bottom 5 rows to ensure playability." }
        ]
      },
      // responseMimeType is not supported for gemini-2.5-flash-image
    });

    let text = response.text?.trim() || "[]";
    // Strip potential markdown JSON code blocks
    if (text.startsWith('```')) {
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    }

    const numericGrid = JSON.parse(text);
    if (!Array.isArray(numericGrid)) return [];

    // Map numeric indicators (1/0) to actual game grid values: strings for colors, null for empty cells.
    const mappedGrid: (string | null)[][] = numericGrid.map(row => 
      Array.isArray(row) ? row.map(cell => cell === 1 ? '#555555' : null) : []
    );

    return mappedGrid;
  } catch (error) {
    console.error("Image Analysis Error:", error);
    return [];
  }
};
