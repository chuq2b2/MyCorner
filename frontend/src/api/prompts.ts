import { API_BASE_URL } from "./config";

/**
 * Generate a reflective prompt using OpenRouter with DeepSeek model
 * @param promptType - The type of prompt to generate
 * @returns The generated prompt
 */
export async function generatePrompt(promptType: string): Promise<string> {
  // Create an AbortController to handle timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for longer model inference

  try {
    const response = await fetch(`${API_BASE_URL}/prompts/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ promptType }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear the timeout if we got a response

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || `Failed to generate prompt: ${response.status}`
      );
    }

    const data = await response.json();
    return data.prompt;
  } catch (error) {
    // AbortError happens when the request times out
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Request timed out when generating prompt");
      throw new Error("Request timed out. The server might be unavailable.");
    }

    // For any other errors
    console.error("Error generating prompt:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId); // Ensure timeout is cleared in all cases
  }
}
