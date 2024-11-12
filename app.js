// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

// Setup Google Gemini API
const apiKey = process.env.GEMINI_API_KEY; // Add your API key to the .env file
const genAI = new GoogleGenerativeAI(apiKey);

// Initialize Gemini model configuration
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash', // Replace with your model ID
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
};
// Function to escape special characters for HTML
function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (char) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char];
    });
}

// Function to sanitize text and remove specific characters
function sanitizeText(text) {
    // Remove asterisks (*), hashtags (#), colons (:), and the sequence "039"
    return text.replace(/[*#:]/g, '').replace(/039/g, '');
}

// Post endpoint to handle chatbot interactions
app.post('/chatbot', async (req, res) => {
    const userText = req.body.text;

    try {
        const chatSession = model.startChat({
            generationConfig,
            history: [],
        });

        const result = await chatSession.sendMessage(userText);
        let botResponse = result.response.text();

        // Sanitize the bot response
        botResponse = sanitizeText(botResponse);

        // Escape HTML special characters before sending the response
        botResponse = escapeHtml(botResponse);

        // Check if the response contains code (e.g., wrapped in triple backticks)
        if (botResponse.includes('```')) {
            botResponse = `<pre><code>${botResponse}</code></pre>`;
        }

        res.json({ botResponse });
    } catch (error) {
        console.error('Error with Gemini API:', error);
        res.status(500).json({ botResponse: 'Sorry, I couldn\'t process your request.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
