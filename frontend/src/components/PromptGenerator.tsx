import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { generatePrompt } from "../api/prompts";

interface PromptGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROMPT_TYPES = [
  "reflective questions about your day",
  "questions about your emotional well-being",
  "meaningful self-reflection prompts",
  "gratitude-focused questions",
  "mindfulness and present moment awareness",
  "personal growth and goals",
];

// Fallback prompts in case the API is not available
const FALLBACK_PROMPTS = {
  "reflective questions about your day": [
    "What was the most meaningful moment of your day today?",
    "What challenged you today, and how did you respond to it?",
    "What did you learn about yourself today?",
    "If you could relive one moment from today, what would it be and why?",
    "How did you take care of yourself today?",
  ],
  "questions about your emotional well-being": [
    "What emotions have been most present for you lately?",
    "When did you last feel truly at peace, and what contributed to that feeling?",
    "What has been draining your emotional energy lately?",
    "What boundaries might you need to set to protect your emotional health?",
    "What simple practices help you return to a positive emotional state?",
  ],
  "meaningful self-reflection prompts": [
    "What parts of yourself are you still learning to accept?",
    "How have your priorities shifted over the past year?",
    "What story about yourself might need rewriting?",
    "What values are most important to you right now?",
    "What would your younger self think of the person you are today?",
  ],
  "gratitude-focused questions": [
    "What three things are you grateful for in this moment?",
    "Who has positively impacted your life recently, and how?",
    "What simple pleasure brought you joy today?",
    "What challenge are you secretly grateful for?",
    "What in nature fills you with gratitude and wonder?",
  ],
  "mindfulness and present moment awareness": [
    "What sensations are you aware of in your body right now?",
    "What sounds can you hear if you pause and listen carefully?",
    "What is one thing you can appreciate about this exact moment?",
    "How does your breathing change when you focus on it?",
    "What thoughts keep pulling you away from the present moment?",
  ],
  "personal growth and goals": [
    "What skill would you like to develop in the next six months?",
    "What small step could you take today toward an important goal?",
    "What habit has been serving you well lately?",
    "What's one belief that might be limiting your growth?",
    "How would you like to challenge yourself this week?",
  ],
};

export default function PromptGenerator({
  isOpen,
  onClose,
}: PromptGeneratorProps) {
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPromptType, setSelectedPromptType] = useState(PROMPT_TYPES[0]);
  const [copied, setCopied] = useState(false);

  // Generate a prompt when the component is first opened
  useEffect(() => {
    if (isOpen && !generatedPrompt && !isLoading) {
      handleGenerate();
    }
  }, [isOpen]);

  // Get a random fallback prompt
  const getFallbackPrompt = (type: string): string => {
    const prompts =
      FALLBACK_PROMPTS[type as keyof typeof FALLBACK_PROMPTS] ||
      FALLBACK_PROMPTS["reflective questions about your day"];
    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setCopied(false);

    try {
      // Call our API to get a prompt
      const prompt = await generatePrompt(selectedPromptType);
      setGeneratedPrompt(prompt);
    } catch (err) {
      console.error("Error generating prompt:", err);

      // Use a fallback prompt instead
      const fallbackPrompt = getFallbackPrompt(selectedPromptType);
      setGeneratedPrompt(fallbackPrompt);

      // Set a user-friendly error message without revealing we're using fallbacks
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(generatedPrompt)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const handlePromptTypeChange = (type: string) => {
    setSelectedPromptType(type);
    handleGenerate();
  };

  const handleClose = () => {
    setGeneratedPrompt("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white">Prompt Generator</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-white">Generating a prompt for your recording</DialogDescription>

        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {PROMPT_TYPES.map((type) => (
              <Button
                key={type}
                variant={selectedPromptType === type ? "default" : "outline"}
                size="sm"
                onClick={() => handlePromptTypeChange(type)}
                className="text-xs"
              >
                {type
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-white">Generating your prompt...</span>
            </div>
          ) : (
            <>
              {generatedPrompt && (
                <div className="bg-slate-100 rounded-lg p-6 relative">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopy}
                      className="h-8 w-8 p-0 "
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-lg font-medium mt-5">{generatedPrompt}</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Generate New Prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
