import Constants from 'expo-constants';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';


const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

interface GenerateDescriptionParams {
    title: string;
    location: string; 
    type: 'ACCOMMODATION' | 'TOURS';
    amenities?: string[]; 
    highlights?: string[]; 
    style?: 'luxury' | 'adventurous' | 'calm' | 'romantic';
}

export const AIService = {
    generateDescription: async (params: GenerateDescriptionParams): Promise<string> => {
        if (!API_KEY || API_KEY.includes('PLACEHOLDER')) {
            throw new Error("Missing Groq API Key. Please add EXPO_PUBLIC_GROQ_API_KEY to .env file.");
        }

        const systemPrompt = `You are an expert travel copywriter. Write a compelling, engaging, and professional marketing description for a travel offer.
        Keep it under 150 words. Focus on the experience, atmosphere, and key selling points. Do not include headers, just the body text.`;

        let userPrompt = "";

        if (params.type === 'ACCOMMODATION') {
            userPrompt = `Write a description for a property named "${params.title}" located in ${params.location}.
            Key amenities: ${params.amenities?.join(', ') || 'Standard amenities'}.
            Style: ${params.style || 'inviting and comfortable'}.`;
        } else {
            userPrompt = `Write a description for a tour named "${params.title}" located in ${params.location}.
            Highlights: ${params.highlights?.join(', ') || 'Exciting sights'}.
            Style: ${params.style || 'adventurous and exciting'}.`;
        }

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Groq API Error:", data);
                throw new Error(data.error?.message || "Failed to generate description");
            }

            return data.choices[0].message.content.trim();

        } catch (error) {
            console.error("AI Generation failed:", error);
            throw error;
        }
    },
    checkContentSafety: async (text: string): Promise<{ safe: boolean; reason?: string }> => {
        if (!API_KEY || API_KEY.includes('PLACEHOLDER')) {
            console.warn("Missing Groq API Key. Skipping safety check.");
            return { safe: true }; 
        }

        const systemPrompt = `You are a content safety moderator. Analyze the user text for hate speech, harassment, explicit violence, self-harm, or adult content. 
        Return ONLY a JSON object with the following structure: { "safe": boolean, "reason": "string explaining why if unsafe, else null" }.
        Do not include any other text.`;

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: text }
                    ],
                    temperature: 0,
                    response_format: { type: "json_object" }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Groq API Error (Safety Check):", data);
                return { safe: true }; 
            }

            const content = data.choices[0].message.content;
            const result = JSON.parse(content);
            return { safe: result.safe, reason: result.reason };

        } catch (error) {
            console.error("AI Safety Check failed:", error);
            return { safe: true }; 
        }
    }
};
