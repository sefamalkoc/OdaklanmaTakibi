import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'odaklanma_seanslari';

// Yeni bir seansı kaydetme
export const saveSession = async (session) => {
  try {
    const existingSessions = await getSessions();
    const newSessions = [...existingSessions, session];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    console.log('Seans başarıyla kaydedildi.');
  } catch (error) {
    console.error('Seans kaydetme hatası:', error);
  }
};

// Kaydedilmiş tüm seansları çekme
export const getSessions = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    // Eğer kayıt yoksa boş bir dizi döndür, varsa parse et
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Seans çekme hatası:', error);
    return [];
  }
};

// Tüm verileri silme (Geliştirme amaçlı)
export const clearAllSessions = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('Tüm seanslar silindi.');
  } catch (error) {
    console.error('Veri silme hatası:', error);
  }
};