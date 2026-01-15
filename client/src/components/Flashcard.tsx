import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface FlashcardProps {
  word: string;
  meaning: string;
  onNext?: () => void;
  className?: string;
}

export function Flashcard({ word, meaning, onNext, className }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when word changes
  useEffect(() => {
    setIsFlipped(false);
  }, [word, meaning]);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className={cn("perspective-1000 w-full max-w-md aspect-[3/2] cursor-pointer group", className)} onClick={handleCardClick}>
      <motion.div
        className="relative w-full h-full transform-style-3d transition-all duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front of Card (Word) */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="w-full h-full bg-card rounded-xl shadow-lg border border-border/50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 opacity-50 pointer-events-none bg-[url('/images/card-texture.jpg')] bg-cover mix-blend-multiply"></div>
            
            <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground mb-4 z-10">English Word</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground text-center z-10 break-words max-w-full">
              {word}
            </h2>
            <div className="absolute bottom-4 right-4 text-muted-foreground/50 text-sm z-10">
              Click to flip
            </div>
          </div>
        </div>

        {/* Back of Card (Meaning) */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-card rounded-xl shadow-lg border border-border/50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
             {/* Paper Texture Overlay */}
             <div className="absolute inset-0 opacity-50 pointer-events-none bg-[url('/images/card-texture.jpg')] bg-cover mix-blend-multiply"></div>

            <span className="text-xs font-sans uppercase tracking-widest text-accent mb-4 z-10">Meaning</span>
            <p className="text-2xl md:text-3xl font-sans font-medium text-foreground/90 text-center z-10 break-words max-w-full">
              {meaning}
            </p>
            <div className="absolute bottom-4 right-4 text-muted-foreground/50 text-sm z-10">
              Click to flip back
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
