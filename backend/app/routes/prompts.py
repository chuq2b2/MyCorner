from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
import os
import requests
import json
from dotenv import load_dotenv
from ..config.settings import logger

# Load environment variables
load_dotenv()

# Configure OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    logger.warning("OPENROUTER_API_KEY not found in environment variables")

router = APIRouter(
    prefix="/prompts",
    tags=["prompts"],
    responses={404: {"description": "Not found"}},
)

class PromptRequest(BaseModel):
    promptType: str

@router.post("/generate")
async def generate_prompt(request: PromptRequest = Body(...)):
    """
    Generate a reflective prompt using OpenRouter with DeepSeek R1 free model
    """
    try:
        # Log the request
        logger.info(f"Generating prompt for type: {request.promptType}")
        
        # Create the system message based on the prompt type
        system_message = f"You are a helpful assistant that generates thoughtful, meaningful, and heartfelt questions about {request.promptType}. Create a single question that encourages self-reflection and mindfulness without further explanation."
        
        # Prepare the request to OpenRouter API
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://mycorner.app",  # Replace with your app domain
            "X-Title": "MyCorner App"  # Name of your app
        }
        
        # Using the DeepSeek R1 free model ID
        data = {
            "model": "deepseek/deepseek-r1:free",  # DeepSeek R1 free model ID
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": f"Generate a heartfelt question about {request.promptType} that encourages self-reflection."}
            ],
            "max_tokens": 300,  # Increased max tokens to get more complete responses
            "temperature": 0.7,
        }
        
        # Log the request data for debugging
        logger.debug(f"OpenRouter request data: {json.dumps(data)}")
        
        # Call OpenRouter API
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data
        )
        
        # Check if request was successful
        if response.status_code != 200:
            logger.error(f"OpenRouter API error: {response.status_code}, {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Failed to generate prompt from OpenRouter: {response.text}")
        
        # Parse the response
        response_data = response.json()
        
        # Log full response for debugging 
        logger.debug(f"OpenRouter response: {json.dumps(response_data)}")
        
        # Extract the generated prompt
        try:
            message = response_data["choices"][0]["message"]
            
            # First check if content has a value
            generated_prompt = message.get("content", "").strip()
            
            # If content is empty, check for reasoning
            if not generated_prompt and "reasoning" in message:
                reasoning = message.get("reasoning", "")
                logger.debug(f"Found reasoning field: {reasoning}")
                
                # Try to parse reasoning to extract a meaningful question
                # This is a simple heuristic - we could make it more sophisticated
                lines = reasoning.split("\n")
                for line in lines:
                    if "?" in line and len(line) > 10 and len(line) < 200:
                        generated_prompt = line.strip()
                        logger.info(f"Extracted question from reasoning: {generated_prompt}")
                        break
                
                # If we couldn't find a question in the reasoning, use a fallback approach
                if not generated_prompt:
                    # Choose from predefined prompts based on the prompt type
                    fallback_prompts = {
                        "reflective questions about your day": "What moments from today made you feel most connected to your authentic self?",
                        "questions about your emotional well-being": "How have your emotions been guiding your decisions lately, and what might they be trying to tell you?",
                        "meaningful self-reflection prompts": "What parts of yourself are you still learning to accept and appreciate?",
                        "gratitude-focused questions": "What unexpected blessing has appeared in your life recently that you haven't fully acknowledged?",
                        "mindfulness and present moment awareness": "What sensations, sounds, or sights are you aware of right now that you might normally overlook?",
                        "personal growth and goals": "What small step could you take today that aligns with your deeper values and aspirations?"
                    }
                    
                    # Get a relevant prompt or use a default
                    generated_prompt = fallback_prompts.get(
                        request.promptType,
                        "What insights about yourself have you gained today that might help you grow tomorrow?"
                    )
                    logger.info(f"Using fallback prompt: {generated_prompt}")
            
            # Check if the prompt is empty
            if not generated_prompt:
                logger.warning("OpenRouter returned an empty prompt and fallback extraction failed")
                raise HTTPException(status_code=500, detail="Failed to generate a prompt from the model response")
                
            # Log the generated prompt
            logger.info(f"Final generated prompt: {generated_prompt}")
            
            return {"prompt": generated_prompt}
        except (KeyError, IndexError) as e:
            logger.error(f"Error extracting prompt from response: {e}, response: {response_data}")
            raise HTTPException(status_code=500, detail=f"Error extracting prompt from response: {str(e)}")
    
    except Exception as e:
        # Log any errors
        logger.error(f"Error generating prompt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate prompt: {str(e)}") 