import { FlashcardWithAnswer } from "@/components/FlashcardWithAnswer";
import { DateSelector } from "@/components/DateSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Shuffle, Upload, Calendar as CalendarIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  VocabularyItem,
  getAllVocabulary,
  getVocabularyByDate,
  addVocabulary,
  getAllSavedDates,
} from "@/lib/storage";
import { format } from "date-fns";

export default function Home() {
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [savedDates, setSavedDates] = useState<string[]>([]);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 저장된 날짜 목록 로드
  useEffect(() => {
    loadSavedDates();
  }, []);

  // 날짜가 변경되면 해당 날짜의 단어 로드
  useEffect(() => {
    if (selectedDate) {
      loadVocabularyByDate(selectedDate);
    }
  }, [selectedDate]);

  const loadSavedDates = () => {
    const dates = getAllSavedDates();
    setSavedDates(dates);
  };

  const loadVocabularyByDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const items = getVocabularyByDate(dateStr);
    
    if (items.length === 0) {
      toast.info("선택한 날짜에 저장된 단어가 없습니다.");
      setIsLoaded(false);
      return;
    }

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setVocabList(shuffled);
    setCurrentIndex(0);
    setIsLoaded(true);
    setSlideDirection(null);
    toast.success(`${items.length}개의 단어가 로드되었습니다!`);
  };

  const loadAllVocabulary = () => {
    const items = getAllVocabulary();
    
    if (items.length === 0) {
      toast.info("저장된 단어가 없습니다. 파일을 업로드해주세요.");
      setIsLoaded(false);
      return;
    }

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setVocabList(shuffled);
    setCurrentIndex(0);
    setIsLoaded(true);
    setSlideDirection(null);
    setSelectedDate(null);
    toast.success(`전체 ${items.length}개의 단어가 로드되었습니다!`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      toast.info("PDF 파싱은 현재 지원되지 않습니다. txt 파일을 사용해주세요.");
      return;
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      handleTextUpload(file);
    } else {
      toast.error(".txt 파일을 업로드해주세요");
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

  const parseFileContent = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      const parsedList: Array<{ word: string; meaning: string }> = [];

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
            meaning: parts.slice(1).join(" ").trim() || "뜻 없음",
          });
        }
      });

      if (parsedList.length === 0) {
        toast.error("파일에서 유효한 단어를 찾을 수 없습니다.");
        return;
      }

      // 오늘 날짜로 저장
      const today = format(new Date(), "yyyy-MM-dd");
      const itemsToSave = parsedList.map((item) => ({
        word: item.word,
        meaning: item.meaning,
        savedDate: today,
      }));

      // LocalStorage에 저장 (기존 데이터에 누적)
      const savedItems = addVocabulary(itemsToSave);

      // 저장된 날짜 목록 업데이트
      loadSavedDates();

      // 방금 추가한 단어들로 학습 시작
      const shuffled = [...savedItems].sort(() => Math.random() - 0.5);
      setVocabList(shuffled);
      setCurrentIndex(0);
      setIsLoaded(true);
      setSlideDirection(null);
      setSelectedDate(null);
      
      toast.success(`${parsedList.length}개의 단어가 저장되었습니다!`);
      
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("파일 파싱 오류:", error);
      toast.error("파일을 처리하는 중 오류가 발생했습니다.");
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
    toast.success("카드가 섞였습니다!");
  };

  const handleReset = () => {
    setVocabList([]);
    setCurrentIndex(0);
    setIsLoaded(false);
    setSlideDirection(null);
    setSelectedDate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    if (date === null) {
      // 전체 보기
      setIsLoaded(false);
      setVocabList([]);
    }
  };

  const toggleDateSelector = () => {
    setShowDateSelector(!showDateSelector);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <main className="w-full max-w-4xl z-10 flex flex-col items-center gap-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary tracking-tight">
            영어 단어 암기 플래시카드
          </h1>
          <p className="text-muted-foreground font-sans text-base md:text-lg">
            파일을 업로드하고 단어를 암기하세요
          </p>
        </div>

        {/* Date Selector Toggle */}
        <div className="w-full max-w-md">
          <Button
            variant="outline"
            onClick={toggleDateSelector}
            className="w-full mb-2"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {showDateSelector ? "날짜 선택 닫기" : "날짜별로 학습하기"}
          </Button>

          {showDateSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <DateSelector
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    savedDates={savedDates}
                  />
                  
                  {selectedDate && (
                    <Button
                      onClick={() => loadVocabularyByDate(selectedDate)}
                      className="w-full mt-4"
                    >
                      선택한 날짜 단어 학습하기
                    </Button>
                  )}
                  
                  {!selectedDate && savedDates.length > 0 && (
                    <Button
                      onClick={loadAllVocabulary}
                      className="w-full mt-4"
                      variant="secondary"
                    >
                      전체 단어 학습하기
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
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
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2">
                    <FileText className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-serif font-semibold">
                    단어장 파일 업로드
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-xs">
                    지원 형식: .txt <br />
                    형식: "단어 [구분자] 뜻" (한 줄에 하나) <br />
                    구분자: 탭, 콜론 (:), 쉼표 (,), 공백
                  </p>
                  <div className="mt-4 w-full">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      asChild
                      size="lg"
                      className="w-full font-sans font-bold shadow-md hover:shadow-lg transition-all text-base md:text-lg py-6"
                    >
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-5 w-5" />
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
              className="w-full flex flex-col items-center gap-6"
            >
              {/* Progress Indicator */}
              <div className="font-sans text-sm md:text-base font-medium text-muted-foreground tracking-wider">
                카드 {currentIndex + 1} / {vocabList.length}
              </div>

              {/* Flashcard Area with Slide Animation */}
              <div className="w-full flex justify-center relative min-h-[500px] md:min-h-[550px]">
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
              <div className="flex items-center gap-3 md:gap-4 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="새 파일 업로드"
                  className="rounded-full w-12 h-12 md:w-14 md:h-14 border-muted-foreground/30 hover:bg-secondary hover:text-secondary-foreground"
                >
                  <FileText className="w-5 h-5 md:w-6 md:h-6" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShuffle}
                  title="카드 섞기"
                  className="rounded-full w-12 h-12 md:w-14 md:h-14 border-muted-foreground/30 hover:bg-secondary hover:text-secondary-foreground"
                >
                  <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
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
