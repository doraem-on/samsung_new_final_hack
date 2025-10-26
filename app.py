import os
import pathlib
import base64
from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
from dotenv import load_dotenv

# Load your API key from a .env file
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Set up the Flask app
app = Flask(__name__)

# Configure the Gemini model
#model = genai.GenerativeModel('gemini-1.5-pro-latest') 
model = genai.GenerativeModel('models/gemini-2.5-flash')

# This is the master prompt. It's the "secret sauce".
SYSTEM_PROMPT = """
You are 'Aura', an AI safety agent. Your job is to analyze sensor data
from an elderly person's home and generate a "Situation Report" in JSON format.

A hardware sensor was triggered by a loud thud. You will receive:
1.  A text description of the trigger.
2.  A low-resolution thermal image snapshot.

Analyze the image and text to determine the event, user status, and 
environmental dangers.

Your JSON response MUST include these fields:
- "event": (e.g., "High-Confidence Fall", "Minor Stumble", "Object Dropped")
- "user_status": (e.g., "Unresponsive", "Conscious", "Not in View")
- "environment": (e.g., "Safe", "DANGEROUS", "CRITICAL")
- "context": (A clear, concise 1-2 sentence summary of the scene. 
             Mention any hazards like a hot stove, fire, or water.)
- "urgency": (e.g., "LOW", "HIGH", "CRITICAL")
"""

@app.route('/')
def index():
    """Serves the main dashboard page."""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_event():
    """The main API endpoint that does the AI reasoning."""
    
    data = request.json
    scenario = data.get('scenario')

    if scenario == 'fall':
        image_path = 'mock_fall.png'
        trigger_text = "Trigger: Loud thud detected. Audio is silent."
    elif scenario == 'hazard':
        image_path = 'mock_hazard.png'
        trigger_text = "Trigger: Loud thud detected, followed by a low groan."
    else:
        return jsonify({"error": "Invalid scenario"}), 400

    # 1. Check if mock image exists
    if not pathlib.Path(image_path).exists():
        return jsonify({"error": f"Mock image not found: {image_path}. Make sure you downloaded it."}), 404

    # 2. Load and prepare the image
    image_file = genai.upload_file(path=image_path)

    # 3. Send the request to Gemini
    print(f"Generating report for scenario: {scenario}...")
    try:
        response = model.generate_content([
            SYSTEM_PROMPT,
            trigger_text,
            image_file
        ])
        
        # 4. Clean up the response and send it
        # The response text is often wrapped in ```json ... ```
        report_text = response.text.strip().replace("```json", "").replace("```", "")
        print(f"Report generated:\n{report_text}")
        
        # Return the raw text, the frontend will parse it as JSON
        return report_text

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)