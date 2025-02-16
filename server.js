import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Google Generative AI
if (!process.env.GOOGLE_GEN_AI_API_KEY) {
    console.error("❌ Missing GOOGLE_GEN_AI_API_KEY in .env");
    process.exit(1); // Stop the server if no API key
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEN_AI_API_KEY);

// ✅ Root Route to Avoid "Cannot GET /"
app.get("/", (req, res) => {
    res.send("🚀 AI Code Editor Backend is Running!");
});

// ✅ Chat Completion API
app.post("/chat", async (req, res) => {
    const { context, prompt } = req.body;
    
    if (!context || !prompt) {
        return res.status(400).json({ error: "Missing required parameters: context and prompt" });
    }

    try {
        const fullPrompt = `
            Context: You are working with ${context.language} code. Please consider the following:
    
            ${context.selectedText ? `Selected text: ${context.selectedText}` : ""}
            Current source code: ${context.sourceCode}

            Instructions:
            - If the selected text is provided, use it along with the source code to answer the user's question.
            - If the selected text is not provided, only use the current source code to answer the user's question.

            User question: ${prompt}
        `.trim();

        console.log("📩 Request received:", { context, prompt });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(fullPrompt);
        const response = result.response?.text() || "⚠️ No response from Gemini API";

        res.json({ response });
    } catch (error) {
        console.error("❌ Error in /chat:", error);
        res.status(500).json({ error: "Failed to process request" });
    }
});

// ✅ Autocomplete API
app.post("/autocomplete", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "No prompt provided" });

        console.log("🔍 Autocomplete Request:", { prompt });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response?.text() || "⚠️ No completion generated";

        res.json({ completion: response });
    } catch (error) {
        console.error("❌ Error in /autocomplete:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
