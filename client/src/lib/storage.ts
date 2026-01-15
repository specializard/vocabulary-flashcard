/**
 * 데이터 저장소 레이어
 * LocalStorage를 사용하며, 나중에 Firebase로 쉽게 전환 가능하도록 설계
 */

export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  savedDate: string; // ISO 8601 format
  createdAt: number; // timestamp
}

export interface VocabularyStorage {
  items: VocabularyItem[];
  lastUpdated: number;
}

const STORAGE_KEY = 'vocabulary_flashcard_data';

/**
 * 모든 단어 데이터 가져오기
 */
export function getAllVocabulary(): VocabularyItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const storage: VocabularyStorage = JSON.parse(data);
    return storage.items || [];
  } catch (error) {
    console.error('데이터 로드 오류:', error);
    return [];
  }
}

/**
 * 특정 날짜의 단어 데이터 가져오기
 */
export function getVocabularyByDate(date: string): VocabularyItem[] {
  const allItems = getAllVocabulary();
  return allItems.filter(item => item.savedDate === date);
}

/**
 * 날짜 범위로 단어 데이터 가져오기
 */
export function getVocabularyByDateRange(startDate: string, endDate: string): VocabularyItem[] {
  const allItems = getAllVocabulary();
  return allItems.filter(item => 
    item.savedDate >= startDate && item.savedDate <= endDate
  );
}

/**
 * 단어가 저장된 모든 날짜 목록 가져오기
 */
export function getAllSavedDates(): string[] {
  const allItems = getAllVocabulary();
  const dates = new Set(allItems.map(item => item.savedDate));
  return Array.from(dates).sort();
}

/**
 * 새 단어 추가 (기존 데이터에 누적)
 */
export function addVocabulary(items: Omit<VocabularyItem, 'id' | 'createdAt'>[]): VocabularyItem[] {
  try {
    const existingItems = getAllVocabulary();
    const now = Date.now();
    
    const newItems: VocabularyItem[] = items.map((item, index) => ({
      ...item,
      id: `${now}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now + index,
    }));
    
    const updatedItems = [...existingItems, ...newItems];
    
    const storage: VocabularyStorage = {
      items: updatedItems,
      lastUpdated: now,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    return newItems;
  } catch (error) {
    console.error('데이터 저장 오류:', error);
    throw error;
  }
}

/**
 * 특정 단어 삭제
 */
export function deleteVocabulary(id: string): void {
  try {
    const existingItems = getAllVocabulary();
    const updatedItems = existingItems.filter(item => item.id !== id);
    
    const storage: VocabularyStorage = {
      items: updatedItems,
      lastUpdated: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('데이터 삭제 오류:', error);
    throw error;
  }
}

/**
 * 특정 날짜의 모든 단어 삭제
 */
export function deleteVocabularyByDate(date: string): void {
  try {
    const existingItems = getAllVocabulary();
    const updatedItems = existingItems.filter(item => item.savedDate !== date);
    
    const storage: VocabularyStorage = {
      items: updatedItems,
      lastUpdated: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('데이터 삭제 오류:', error);
    throw error;
  }
}

/**
 * 모든 데이터 삭제
 */
export function clearAllVocabulary(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('데이터 초기화 오류:', error);
    throw error;
  }
}

/**
 * 데이터 내보내기 (JSON)
 */
export function exportVocabulary(): string {
  const allItems = getAllVocabulary();
  return JSON.stringify(allItems, null, 2);
}

/**
 * 데이터 가져오기 (JSON)
 */
export function importVocabulary(jsonData: string): void {
  try {
    const items: VocabularyItem[] = JSON.parse(jsonData);
    
    // 유효성 검사
    if (!Array.isArray(items)) {
      throw new Error('유효하지 않은 데이터 형식입니다.');
    }
    
    const existingItems = getAllVocabulary();
    const updatedItems = [...existingItems, ...items];
    
    const storage: VocabularyStorage = {
      items: updatedItems,
      lastUpdated: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('데이터 가져오기 오류:', error);
    throw error;
  }
}

/**
 * Firebase 연동을 위한 인터페이스 (향후 구현)
 */
export interface FirebaseStorageAdapter {
  getAllVocabulary(): Promise<VocabularyItem[]>;
  addVocabulary(items: Omit<VocabularyItem, 'id' | 'createdAt'>[]): Promise<VocabularyItem[]>;
  deleteVocabulary(id: string): Promise<void>;
  syncWithLocal(): Promise<void>;
}

// Firebase 어댑터는 나중에 구현 시 여기에 추가
