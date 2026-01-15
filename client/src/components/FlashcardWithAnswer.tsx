import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";

interface FlashcardWithAnswerProps {
  word: string;
  meaning: string;
  onCorrect?: () => void;
  onIncorrect?: () => void;
  className?: string;
}

export function FlashcardWithAnswer({
  word,
  meaning,
  onCorrect,
  onIncorrect,
  className,
}: FlashcardWithAnswerProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when word changes
  useEffect(() => {
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
  }, [word, meaning]);

  const handleCheck = () => {
    // Simple similarity check: normalize and compare
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect = meaning.toLowerCase().trim();

    // Check if user answer contains key words from the meaning or exact match
    const isMatch =
      normalizedUser === normalizedCorrect ||
      normalizedCorrect.includes(normalizedUser) ||
      normalizedUser.includes(normalizedCorrect);

    setIsCorrect(isMatch);
    setShowResult(true);

    // Auto-trigger callback after animation
    setTimeout(() => {
      if (isMatch) {
        onCorrect?.();
      } else {
        onIncorrect?.();
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !showResult) {
      handleCheck();
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Word Card */}
      <motion.div
        className="relative w-full aspect-[3/2] mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full h-full bg-card rounded-xl shadow-lg border border-border/50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
          {/* Paper Texture Overlay */}
          <div className="absolute inset-0 opacity-50 pointer-events-none bg-[url('/images/card-texture.jpg')] bg-cover mix-blend-multiply"></div>

          <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground mb-4 z-10">
            영어 단어
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground text-center z-10 break-words max-w-full">
            {word}
          </h2>
        </div>
      </motion.div>

      {/* Answer Input Section */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-2">
          <label className="text-sm font-sans font-medium text-foreground/70">
            이 단어의 뜻은?
          </label>
          <Input
            type="text"
            placeholder="뜻을 입력하세요..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={showResult}
            className="font-sans text-base bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Result Message */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "p-4 rounded-lg flex items-center gap-3 font-sans font-medium",
                isCorrect
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              )}
            >
              {isCorrect ? (
                <>
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">정답입니다!</p>
                    <p className="text-sm opacity-90">{meaning}</p>
                  </div>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">틀렸습니다</p>
                    <p className="text-sm opacity-90">정답: {meaning}</p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Check Button */}
        <Button
          onClick={handleCheck}
          disabled={showResult || userAnswer.trim() === ""}
          className="w-full font-sans font-bold text-lg shadow-md hover:shadow-lg transition-all bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="mr-2 w-5 h-5" />
          정답 확인
        </Button>
      </motion.div>
    </div>
  );
}
