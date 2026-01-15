import { useAuth } from "@/_core/hooks/useAuth";
import { FlashcardWithAnswer } from "@/components/FlashcardWithAnswer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Shuffle, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface VocabularyItem {
  word: string;
  meaning: string;
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      handlePdfUpload(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      handleTextUpload(file);
    } else {
      toast.error('.txt 또는 .pdf 파일을 업로드해주세요');
    }
  };

  const handleTextUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseFileContent(text);
    };
    reader.readAsText(file);
  };

  const handlePdfUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      if (base64) {
        parsePdfContent(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const parsePdfContent = async (base64: string) => {
    try {
      // Since we don't have a list ID yet, we'll just parse the PDF locally
      // In a full implementation, this would be sent to the server
        toast.info('PDF 파싱은 데이터베이스 통합 후 사용 가능합니다');
    } catch (error) {
      console.error('PDF 처리 오류:', error);
      toast.error('PDF를 처리하는 중 오류가 발생했습니다.');
    }
  };

  const parseFileContent = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      const parsedList: VocabularyItem[] = [];

      lines.forEach((line) => {
        let parts: string[] = [];

        if (line.includes("\t")) {
          parts = line.split("\t");
        } else if (line.includes(":")) {
          parts = line.split(":");
        } else if (line.includes(",")) {
          parts = line.split(",");
        } else {
          const firstSpaceIndex = line.indexOf(" ");
          if (firstSpaceIndex !== -1) {
            parts = [
              line.substring(0, firstSpaceIndex),
              line.substring(firstSpaceIndex + 1),
            ];
          } else {
            parts = [line];
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
        toast.error("파일에서 유효한 단어를 찾을 수 없습니다.");
        return;
      }

      const shuffled = [...parsedList].sort(() => Math.random() - 0.5);
      setVocabList(shuffled);
      setCurrentIndex(0);
      setIsLoaded(true);
      setSlideDirection(null);
      toast.success(`${parsedList.length}개의 단어가 로드되었습니다!`);
    } catch (error) {
      console.error("파일 파싱 오류:", error);
      toast.error('파일을 처리하는 중 오류가 발생했습니다.');
    }
  };

  const handleCorrect = () => {
    setSlideDirection("right");
    setTimeout(() => {
      if (currentIndex < vocabList.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSlideDirection(null);
      } else {
        toast.info("모든 단어 학습이 완료되었습니다! 🎉");
        setIsLoaded(false);
        setVocabList([]);
      }
    }, 500);
  };

  const handleIncorrect = () => {
    setSlideDirection("left");
    setTimeout(() => {
      if (currentIndex < vocabList.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSlideDirection(null);
      } else {
        toast.info("모든 단어 학습이 완료되었습니다! 🎉");
        setIsLoaded(false);
        setVocabList([]);
      }
    }, 500);
  };

  const handleShuffle = () => {
    const shuffled = [...vocabList].sort(() => Math.random() - 0.5);
    setVocabList(shuffled);
    setCurrentIndex(0);
    setSlideDirection(null);
    toast.success('카드가 섞였습니다!');
  };

  const handleReset = () => {
    setVocabList([]);
    setCurrentIndex(0);
    setIsLoaded(false);
    setSlideDirection(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <main className="w-full max-w-4xl z-10 flex flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
            영어 단어 암기 플래시카드
          </h1>
          <p className="text-muted-foreground font-sans text-lg">
            파일을 업로드하고 단어를 암기하세요.
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
                    <FileText className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <h3 className="text-xl font-serif font-semibold">
                    단어장 파일 업로드
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    지원 형식: .txt 또는 .pdf <br />
                    형식: "단어 [구분자] 뜻" (한 줄에 하나) <br />
                    구분자: 탭, 콜론 (:), 쉼표 (,)
                  </p>
                  <div className="mt-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      asChild
                      size="lg"
                      className="font-sans font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      <label htmlFor="file-upload" className="cursor-pointer">
                        파일 선택
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
                카드 {currentIndex + 1} / {vocabList.length}
              </div>

              {/* Flashcard Area with Slide Animation */}
              <div className="w-full flex justify-center relative h-96">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{
                      x: slideDirection === "right" ? 0 : 0,
                      opacity: 1,
                    }}
                    animate={{
                      x: 0,
                      opacity: 1,
                    }}
                    exit={{
                      x: slideDirection === "right" ? 500 : -500,
                      opacity: 0,
                      transition: { duration: 0.4 },
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="w-full flex justify-center absolute"
                  >
                    <FlashcardWithAnswer
                      word={vocabList[currentIndex].word}
                      meaning={vocabList[currentIndex].meaning}
                      onCorrect={handleCorrect}
                      onIncorrect={handleIncorrect}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="새 파일 업로드"
                  className="rounded-full w-12 h-12 border-muted-foreground/30 hover:bg-secondary hover:text-secondary-foreground"
                >
                  <FileText className="w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShuffle}
                  title="카드 섞기"
                  className="rounded-full w-12 h-12 border-muted-foreground/30 hover:bg-secondary hover:text-secondary-foreground"
                >
                  <Shuffle className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="absolute bottom-4 text-xs text-muted-foreground/50 font-sans">
        Manus AI가 만들었습니다
      </footer>
    </div>
  );
}
