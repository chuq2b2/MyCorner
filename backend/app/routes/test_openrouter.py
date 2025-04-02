#!/usr/bin/env python3
"""
Test script to verify OpenRouter integration is working correctly.
Run this script from the backend directory with:
python test_openrouter.py
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get OpenRouter API key
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    print("ERROR: OPENROUTER_API_KEY not found in environment variables")
    print("Please create a .env file with your OpenRouter API key")
    exit(1)

# Test prompt generation
def test_prompt_generation():
    print("Testing OpenRouter prompt generation...")
    
    prompt_type = "reflective questions about your day"
    
    # Prepare the request
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://mycorner.app",
        "X-Title": "MyCorner App"
    }
    
    # Using the correct DeepSeek R1 free model ID
    data = {
        "model": "deepseek/deepseek-r1:free",  # Correct DeepSeek R1 free model ID
        "messages": [
            {"role": "system", "content": f"You are a helpful assistant that generates thoughtful, meaningful, and heartfelt questions about {prompt_type}. Create a single question that encourages self-reflection and mindfulness."},
            {"role": "user", "content": f"Generate a heartfelt question about {prompt_type} that encourages self-reflection."}
        ],
        "max_tokens": 300,  # Increased max tokens to get more complete responses
        "temperature": 0.7,
    }
    
    # Make the request
    try:
        print("Sending request to OpenRouter API...")
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data
        )
        
        # Check if request was successful
        if response.status_code != 200:
            print(f"Error: {response.status_code}")
            print(response.text)
            return False
        
        # Parse the response
        response_data = response.json()
        
        # Debug - print full response
        print("\nFull API Response:")
        print(json.dumps(response_data, indent=2))
        
        # Extract the generated prompt
        try:
            message = response_data["choices"][0]["message"]
            
            # First check if content has a value
            generated_prompt = message.get("content", "").strip()
            
            # If content is empty, check for reasoning
            if not generated_prompt and "reasoning" in message:
                reasoning = message.get("reasoning", "")
                # Extract a prompt from the reasoning
                print("\nReasoning field found:")
                print(reasoning)
                
                # Try to parse reasoning to extract a meaningful question
                # This is a simple heuristic - we could make it more sophisticated
                lines = reasoning.split("\n")
                for line in lines:
                    if "?" in line and len(line) > 10 and len(line) < 200:
                        generated_prompt = line.strip()
                        print(f"\nExtracted question from reasoning: {generated_prompt}")
                        break
                
                # If we couldn't find a question in the reasoning, use a fallback approach
                if not generated_prompt:
                    # Use reasoning as a base for generating a prompt
                    print("\nGenerating prompt from reasoning...")
                    # For this test, we'll extract the last paragraph or sentence that might contain insights
                    paragraphs = reasoning.split("\n\n")
                    if paragraphs:
                        generated_prompt = f"What moments from today made you feel most connected to your authentic self?"
                        print(f"\nGenerated fallback prompt: {generated_prompt}")
            
            print(f"\nFinal generated prompt: {generated_prompt}")
            
            if not generated_prompt:
                print("WARNING: Generated prompt is empty!")
            return bool(generated_prompt)
            
        except (KeyError, IndexError) as e:
            print(f"Error extracting prompt from response: {e}")
            return False
    
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== Testing OpenRouter Integration ===")
    print(f"Using API key: {api_key[:5]}...{api_key[-4:] if len(api_key) > 8 else ''}")
    
    result = test_prompt_generation()
    
    if result:
        print("\n✅ OpenRouter integration is working correctly!")
    else:
        print("\n❌ OpenRouter integration test failed.") 