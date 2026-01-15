import { Flashcard } from "@/components/Flashcard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, RefreshCw, Upload, Shuffle, ArrowRight } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface VocabularyItem {
  word: string;
  meaning: string;
}

export default function Home() {
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseFileContent(text);
    };
    reader.readAsText(file);
  };

  const parseFileContent = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      const parsedList: VocabularyItem[] = [];

      lines.forEach((line) => {
        // Try different separators: tab, comma, colon, or just space
        // Priority: Tab > Colon > Comma > Space (last resort, might be risky)
        let parts: string[] = [];
        
        if (line.includes("\t")) {
            parts = line.split("\t");
        } else if (line.includes(":")) {
            parts = line.split(":");
        } else if (line.includes(",")) {
            parts = line.split(",");
        } else {
            // Fallback: split by first space
            const firstSpaceIndex = line.indexOf(" ");
            if (firstSpaceIndex !== -1) {
                parts = [line.substring(0, firstSpaceIndex), line.substring(firstSpaceIndex + 1)];
            } else {
                parts = [line]; // Only word, no meaning
            }
        }

        if (parts.length >= 1) {
          parsedList.push({
            word: parts[0].trim(),
            meaning: parts.slice(1).join(" ").trim() || "No meaning provided",
          });
        }
      });

      if (parsedList.length === 0) {
        toast.error("No valid vocabulary found in file.");
        return;
      }

      // Shuffle initially
      const shuffled = [...parsedList].sort(() => Math.random() - 0.5);
      setVocabList(shuffled);
      setCurrentIndex(0);
      setIsLoaded(true);
      toast.success(`Loaded ${parsedList.length} words!`);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse file.");
    }
  };

  const handleNext = () => {
    if (currentIndex < vocabList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Loop back to start or finish? Let's loop for continuous study
      setCurrentIndex(0);
      toast.info("Restarting list!");
    }
  };

  const handleShuffle = () => {
    const shuffled = [...vocabList].sort(() => Math.random() - 0.5);
    setVocabList(shuffled);
    setCurrentIndex(0);
    toast.success("Shuffled cards!");
  };

  const handleReset = () => {
    setVocabList([]);
    setCurrentIndex(0);
    setIsLoaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
         {/* We rely on body background in index.css, but can add floating elements here if needed */}
      </div>

      <main className="w-full max-w-4xl z-10 flex flex-col items-center gap-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
            Vocabulary Flashcards
          </h1>
          <p className="text-muted-foreground font-sans text-lg">
            Upload your list, master your words.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isLoaded ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <Card className="border-dashed border-2 border-muted-foreground/20 bg-card/50 backdrop-blur-sm shadow-sm hover:border-accent/50 transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2">
                    <Upload className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <h3 className="text-xl font-serif font-semibold">Upload your .txt file</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Format: "Word [separator] Meaning" per line. <br/>
                    Separators: Tab, Colon (:), Comma (,)
                  </p>
                  <div className="mt-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild size="lg" className="font-sans font-bold shadow-md hover:shadow-lg transition-all">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Select File
                      </label>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="study"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full flex flex-col items-center gap-8"
            >
              {/* Progress Indicator */}
              <div className="font-sans text-sm font-medium text-muted-foreground tracking-wider">
                CARD {currentIndex + 1} OF {vocabList.length}
              </div>

              {/* Flashcard Area */}
              <div className="w-full flex justify-center perspective-1000">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ x: 300, opacity: 0, rotateY: -15 }}
                    animate={{ x: 0, opacity: 1, rotateY: 0 }}
                    exit={{ x: -300, opacity: 0, rotateY: 15 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="w-full flex justify-center"
                  >
                    <Flashcard
                      word={vocabList[currentIndex].word}
                      meaning={vocabList[currentIndex].meaning}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="Upload new file"
                  className="rounded-full w-12 h-12 border-muted-foreground/30 hover:bg-secondary hover:text-secondary-foreground"
                >
                  <FileText className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShuffle}
                  title="Shuffle cards"
                  className="rounded-full w-12 h-12 border-muted-foreground/30 hover:bg-secondary hover:text-secondary-foreground"
                >
                  <Shuffle className="w-5 h-5" />
                </Button>

                <Button
                  size="lg"
                  onClick={handleNext}
                  className="rounded-full px-8 font-sans font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Next Card <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="absolute bottom-4 text-xs text-muted-foreground/50 font-sans">
        Designed by Manus AI
      </footer>
    </div>
  );
}
