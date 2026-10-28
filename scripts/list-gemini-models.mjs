import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function main() {
  console.log('--- Querying available models ---');
  try {
    const pager = await ai.models.list();
    const modelNames = [];
    for await (const model of pager) {
      if (model.name && model.name.includes('gemini')) {
        modelNames.push(model.name);
      }
    }
    console.log('Available Gemini Models:', modelNames);
  } catch (err) {
    console.error('List models error:', err.message || err);
  }

  // Also test direct generation with a few candidate models
  const candidates = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-2.5-pro'];
  for (const model of candidates) {
    try {
      console.log(`Testing model: ${model}...`);
      const resp = await ai.models.generateContent({
        model,
        contents: 'Hello! Respond with: ONLINE',
      });
      console.log(`SUCCESS [${model}]:`, resp.text?.trim());
      break;
    } catch (e) {
      console.log(`FAILED [${model}]:`, e.message?.slice(0, 120));
    }
  }
}

main();
