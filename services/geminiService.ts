
import { GoogleGenAI, Type } from "@google/genai";
import type { DevpostContent } from "../types";

export async function generateSubmissionContent(projectIdea: string): Promise<DevpostContent> {
  // Hämta API-nyckel från chrome.storage
  const result = await chrome.storage.local.get(['geminiApiKey']);
  const API_KEY = result.geminiApiKey;
  
  if (!API_KEY) {
    throw new Error("API_KEY not found. Please set it in chrome.storage.local");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const masterPrompt = `
    Based on the following project idea for the Cloud Run Hackathon, generate a complete project submission.

    Project Idea:
    ---
    ${projectIdea}
    ---

    Your response MUST be a single, valid JSON object with the following 4 keys and nothing else:
    1. "description": A detailed, well-structured project story. Use Markdown for formatting (headings, lists, bold text).
    2. "diagram": A Mermaid diagram in "graph LR" format that visualizes the project's architecture on Google Cloud, focusing on Cloud Run.
    3. "script": A script for a 3-minute video demo. Format it clearly with scenes or speaker notes.
    4. "social": A concise and engaging social media post for platforms like Twitter or LinkedIn to promote the project. This post MUST include the hashtag #CloudRunHackathon.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: masterPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { 
              type: Type.STRING, 
              description: 'A detailed, well-structured project story using Markdown.' 
            },
            diagram: { 
              type: Type.STRING, 
              description: 'A Mermaid diagram in "graph LR" format that visualizes the architecture.' 
            },
            script: { 
              type: Type.STRING, 
              description: 'A script for a 3-minute video demo with scenes or speaker notes.' 
            },
            social: { 
              type: Type.STRING, 
              description: 'A social media post that MUST include the hashtag #CloudRunHackathon.' 
            },
          },
          required: ["description", "diagram", "script", "social"],
        },
      },
    });
    
    const content: DevpostContent = JSON.parse(response.text);
    return content;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate content from AI.");
  }
}
