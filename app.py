from flask import Flask, render_template, request, jsonify
import requests
from bs4 import BeautifulSoup
from googlesearch import search  # Google Search API

app = Flask(__name__)

# LM Studio API URL
LM_STUDIO_API_URL = "http://localhost:1234/v1/chat/completions"

def scrape_website(url):
    """Extracts text from a webpage"""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract first 2 paragraphs
        paragraphs = soup.find_all("p")[:2]
        content = " ".join(p.get_text() for p in paragraphs)
        
        return content if content else "No relevant information found."
    except Exception as e:
        return f"Error scraping website: {str(e)}"

def google_search(query):
    """Performs Google search and scrapes top result"""
    try:
        search_results = list(search(query, num=3, stop=3, pause=2))  # Get top 3 links
        best_result = search_results[0] if search_results else None

        if best_result:
            return scrape_website(best_result)
        else:
            return "No search results found."
    except Exception as e:
        return f"Google Search Error: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message', '')

    if "search" in user_input.lower() or "find" in user_input.lower():
        # If user requests search, fetch data
        bot_reply = google_search(user_input)
    else:
        # Otherwise, use LM Studio
        payload = {
            "model": "Llama-3.2-1B-Instruct-Q8_0-GGUF",
            "messages": [{"role": "user", "content": user_input}]
        }
        try:
            response = requests.post(LM_STUDIO_API_URL, json=payload)
            response_json = response.json()
            bot_reply = response_json.get("choices", [{}])[0].get("message", {}).get("content", "Error: No response received.")
        except Exception as e:
            bot_reply = f"Error: {str(e)}"

    return jsonify({"response": bot_reply})

if __name__ == '__main__':
    app.run(debug=True)
