import 'dotenv/config';
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEN_AI_API_KEY);

// API Route to Get Chat Completion
app.post("/chat", async (req, res) => {
    const { context, prompt } = req.body; // Extract context and prompt from the request body
    try {
        const fullPrompt = `
            Context: You are working with ${context.language} code. Please consider the following:
    
            ${context.selectedText ? `Selected text: ${context.selectedText}` : ''}  // If selectedText exists
            Current source code: ${context.sourceCode}

            Instructions:
            - If the selected text is provided, use it along with the source code to answer the user's question about the selected text.
            - If the selected text is not provided, only use the current source code to answer the user's question.

            User question: ${prompt}
        `.trim();
        console.log("Request received");
        console.log(fullPrompt);

        // Call Google's Generative AI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        
        // Send only the response back to the frontend
        res.json({
            response: response.text()
        });
        
    } catch (error) {
        console.error('Error calling Google Generative AI:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

app.post("/autocomplete", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "No prompt provided" });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response.text();

        res.json({ completion: response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
