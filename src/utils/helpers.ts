// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Local storage keys
export const STORAGE_KEYS = {
  LIBRARIES: 'markdown-manager-libraries',
  CATEGORIES: 'markdown-manager-categories',
  DOCUMENTS: 'markdown-manager-documents',
};

// Save data to local storage
export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Load data from local storage
export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

// Parse date strings in objects loaded from JSON
export const parseJsonDates = <T>(obj: T): T => {
  if (!obj) return obj;
  
  const isDate = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return datePattern.test(value);
  };

  const parseObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => parseObject(item));
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        const value = obj[key];
        if (key === 'createdAt' || key === 'updatedAt') {
          result[key] = isDate(value) ? new Date(value) : value;
        } else if (typeof value === 'object' && value !== null) {
          result[key] = parseObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
    
    return obj;
  };
  
  return parseObject(obj);
};
