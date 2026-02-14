
import { GoogleGenAI, Modality, Type } from "@google/genai";

const getAI = () => {
  // Fix: Direct use of process.env.API_KEY for initializing GoogleGenAI as per guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// সাময়িক সার্ভার সমস্যা এড়াতে Retry Logic
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

export const generateReflection = async (songTitle: string, lyrics: string[]) => {
  return withRetry(async () => {
    const ai = getAI();
    const prompt = `Based on the lyrics of the Bible song "${songTitle}", provide a short spiritual reflection and a related Bible verse. Lyrics: ${lyrics.join(' ')}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a thoughtful spiritual guide. Keep reflections brief, encouraging, and centered on the themes of the song provided."
      }
    });
    return response.text;
  }).catch(error => {
    console.error("Reflection Error:", error);
    return "এখন ব্যাখ্যা তৈরি করা যাচ্ছে না।";
  });
};

export const explainVerse = async (verseReference: string) => {
  return withRetry(async () => {
    const ai = getAI();
    const prompt = `Explain the Bible verse "${verseReference}" in Bengali. Provide: 1. The verse itself. 2. Historical/Spiritual Context. 3. Detailed Meaning. 4. Life Application. Format as clear sections.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert biblical scholar and theologian. Your goal is to explain Bible verses in a clear, deep, and spiritually enriching way in Bengali."
      }
    });
    return response.text;
  }).catch(error => {
    console.error("Explanation Error:", error);
    return "দুঃখিত, এই পদের ব্যাখ্যা খুঁজে পাওয়া যাচ্ছে না। অনুগ্রহ করে নেটওয়ার্ক চেক করে আবার চেষ্টা করুন।";
  });
};

export const fetchSongFromAI = async (query: string) => {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the lyrics for the Bible song or hymn: "${query}". Return the title, primary Bible reference, category, and lyrics as a list of lines.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            reference: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Worship', 'Praise', 'Hymn', 'Kids'] },
            lyrics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "reference", "category", "lyrics"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }).catch(error => {
    console.error("Fetch Song Error:", error);
    return null;
  });
};

export const composeNewSong = async (theme: string) => {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Compose a new Bible song or hymn based on the theme: "${theme}". Include a title, a relevant Bible reference, and lyrics structured in verses.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            reference: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Worship', 'Praise', 'Hymn', 'Kids'] },
            lyrics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "reference", "category", "lyrics"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }).catch(error => {
    console.error("Compose Song Error:", error);
    return null;
  });
};

export const speakLyrics = async (text: string) => {
  return withRetry(async () => {
    const ai = getAI();
    // Fix: Simplified contents format to simple string as per guidelines
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: `Read these lyrics warmly: ${text}`,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data");
    
    return base64Audio;
  }).catch(error => {
    console.error("TTS Error:", error);
    return null;
  });
};

export const decodeBase64Audio = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};
