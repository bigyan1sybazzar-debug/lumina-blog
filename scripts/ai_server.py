
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Configure Gemini
api_key = os.getenv("NEXT_PUBLIC_GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    # Try getting the specific key from user history/context if typical names fail
    # or fallback to a known variable name if the user uses one.
    print("Warning: NEXT_PUBLIC_GEMINI_API_KEY or GOOGLE_API_KEY not found in env.")

if api_key:
    # Debug: Check key type
    if api_key.startswith('vck_'):
        print(f"CRITICAL WARNING: The loaded API Key ('{api_key[:10]}...') appears to be a Vercel Key.")
        # We cannot configure genai with this.
        # We will let the request fail gracefully later or just not configure.
        # Actually, let's explicitly fail requests if we know it won't work.
    elif api_key.startswith('AIza'):
        print(f"DEBUG: Loaded Google API Key: {api_key[:5]}...")
        genai.configure(api_key=api_key)
    else:
        print(f"DEBUG: Loaded API Key (Unknown Type): {api_key[:5]}...")
        genai.configure(api_key=api_key)

SYSTEM_PROMPT = """
System Role: > You are the core engine of a Premium Plagiarism & AI Humanizer Tool. Your goal is to process user text and provide two distinct outputs: a "Plagiarism Analysis" and a "Humanized Rewrite."

Task 1: Plagiarism Analysis
Identify phrases that look like common web patterns or "AI-generated" structures.
Flag specific sentences that have high "perplexity" or "burstiness" issues (typical of AI).
Provide a similarity score estimate from 0-100%.

Task 2: Instant Humanization
Rewrite the text to bypass AI detectors and plagiarism filters.
Constraint: Maintain the original meaning and core facts perfectly.
Technique: Use "Dynamic Sentence Variation." Mix short, punchy sentences with longer, complex ones.
Technique: Use "Lexical Diversity." Replace overused AI transitions (e.g., "In conclusion," "Furthermore") with natural human transitions.
Tone: Adjust to a "Professional-Human" tone—intelligent but not robotic.

Output Format (JSON):
{
  "score": number,
  "flagged_sentences": [string],
  "humanized_text": "string",
  "explanation": "string"
}
"""

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400

        if not api_key:
            return jsonify({"error": "Server missing API Key configuration"}), 500

        if api_key.startswith('vck_'):
             return jsonify({
                 "error": "Invalid API Key Type", 
                 "message": "You are using a Vercel Key ('vck_...'), but this Python backend requires a standard Google API Key ('AIza...'). Please update your .env.local file."
             }), 400

        # Model configuration
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash", 
            generation_config={"response_mime_type": "application/json"}
        )

        # Generate content
        response = model.generate_content(
            f"{SYSTEM_PROMPT}\n\nUser Text to Analyze:\n{text}"
        )

        # Parse JSON
        result_json = json.loads(response.text)
        return jsonify(result_json)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def health():
    return jsonify({"status": "AI Server Running", "key_configured": bool(api_key)})

if __name__ == '__main__':
    print("Starting AI Python Server on port 5000...")
    app.run(port=5000, debug=True)
