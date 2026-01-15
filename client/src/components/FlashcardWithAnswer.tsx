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

  // 단어의 첫 글자만 대문자로 변환
  const formatWord = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  return (
    <div className={cn("w-full max-w-md mx-auto px-4", className)}>
      {/* Word Card - 세로 폭 줄임 */}
      <motion.div
        className="relative w-full mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full bg-card rounded-2xl shadow-xl border border-border/50 flex flex-col items-center justify-center p-8 md:p-10 relative overflow-hidden min-h-[180px] md:min-h-[200px]">
          {/* Paper Texture Overlay */}
          <div className="absolute inset-0 opacity-50 pointer-events-none bg-[url('/images/card-texture.jpg')] bg-cover mix-blend-multiply"></div>

          <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground mb-3 z-10">
            영어 단어
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground text-center z-10 break-words max-w-full leading-tight">
            {formatWord(word)}
          </h2>
        </div>
      </motion.div>

      {/* Answer Input Section - 버튼 크기 증가 */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-3">
          <label className="text-sm md:text-base font-sans font-medium text-foreground/70">
            이 단어의 뜻은?
          </label>
          <Input
            type="text"
            placeholder="뜻을 입력하세요..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={showResult}
            className="font-sans text-base md:text-lg h-12 md:h-14 bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50 px-4"
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
                "p-4 md:p-5 rounded-xl flex items-center gap-3 font-sans font-medium",
                isCorrect
                  ? "bg-green-100 text-green-800 border-2 border-green-300"
                  : "bg-red-100 text-red-800 border-2 border-red-300"
              )}
            >
              {isCorrect ? (
                <>
                  <Check className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-base md:text-lg">정답입니다!</p>
                    <p className="text-sm md:text-base opacity-90">{meaning}</p>
                  </div>
                </>
              ) : (
                <>
                  <X className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-base md:text-lg">틀렸습니다</p>
                    <p className="text-sm md:text-base opacity-90">정답: {meaning}</p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Check Button - 크기 증가 */}
        <Button
          onClick={handleCheck}
          disabled={showResult || userAnswer.trim() === ""}
          className="w-full h-14 md:h-16 font-sans font-bold text-lg md:text-xl shadow-lg hover:shadow-xl transition-all bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          <Check className="mr-2 w-6 h-6" />
          정답 확인
        </Button>
      </motion.div>
    </div>
  );
}
