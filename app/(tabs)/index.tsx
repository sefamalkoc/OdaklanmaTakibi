import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus // <<-- SON HATA ÇÖZÜMÜ: Tipi buradan import ettik
  ,

  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// TypeScript timer hatalarını çözmek için özel tip
type TimerHandle = NodeJS.Timeout | null; 

// DOĞRU DOSYA YOLU
import { saveSession } from '../../src/utils/Storage';

// Picker kütüphanesi
import { Picker } from '@react-native-picker/picker';


// Sabitler
const INITIAL_TIME = 25 * 60; // 25 dakika
const CATEGORIES = ["Ders Çalışma", "Kodlama", "Proje", "Kitap Okuma"]; 

const Index = () => {
  const [time, setTime] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0); 
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  
  // TypeScript hatasını çözmek için useRef'e tip ataması yapıldı
  const timerRef = useRef<TimerHandle>(null); 
  const appState = useRef(AppState.currentState); 

  // totalSeconds parametresine : number tipi atandı
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // isCompleted parametresine : boolean tipi atandı
  const finalizeSession = (isCompleted: boolean) => {
    const focusedDuration = INITIAL_TIME - time; 

    if (focusedDuration < 60) {
        handleReset(false); 
        return; 
    }
    
    const sessionData = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0], 
        duration: Math.ceil(focusedDuration / 60), 
        category: selectedCategory,
        distractionCount: distractionCount,
        isCompleted: isCompleted,
    };

    saveSession(sessionData); 
    
    Alert.alert(
        "Seans Özeti", 
        `Süre: ${sessionData.duration} dakika\nKategori: ${sessionData.category}\nDağınıklık: ${sessionData.distractionCount} kez`,
        [{ text: "Tamam" }]
    );
    
    handleReset(false); 
  };

  const handlePause = () => {
    if (isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current); 
      }
      setIsRunning(false);
    }
  };

  // shouldFinalize parametresine : boolean tipi atandı
  const handleReset = (shouldFinalize: boolean = true) => {
    const wasRunning = isRunning;
    const initialTimeCheck = time < INITIAL_TIME;
    
    handlePause(); 
    
    if (shouldFinalize && wasRunning && initialTimeCheck) {
        finalizeSession(false); 
    }

    setTime(INITIAL_TIME); 
    setDistractionCount(0); 
    setIsRunning(false); 
  };

  const handleStart = () => {
    if (!isRunning && time > 0) {
      setIsRunning(true); 
      
      timerRef.current = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 1) {
            if (timerRef.current) {
               clearInterval(timerRef.current);
            }
            setIsRunning(false);
            finalizeSession(true); 
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000) as unknown as NodeJS.Timeout; 
    }
  };
  
  // nextAppState parametresine : AppStateStatus tipi atandı
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (isRunning && appState.current.match(/active/) && nextAppState === 'background') {
      
      handlePause(); 
      setDistractionCount(prevCount => prevCount + 1); 
      
      console.log('UYARI: Dikkat Dağınıklığı tespit edildi! Sayaç duraklatıldı.');
    }
    
    if (!isRunning && appState.current.match(/background/) && nextAppState === 'active' && time > 0) {
        Alert.alert(
            "Geri Döndün!",
            "Odaklanmaya devam etmek ister misin?",
            [
                { text: "Hayır (Sıfırla)", onPress: () => handleReset(true), style: 'cancel' }, 
                { text: "Evet (Devam Et)", onPress: handleStart },
            ],
            { cancelable: false }
        );
    }

    appState.current = nextAppState; 
  };
  
  // useEffect temizleme fonksiyonunda null kontrolü yapıldı
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current); 
      }
      subscription.remove(); 
    };
  }, [isRunning, time]); 

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Odaklanma Takibi</Text>

      {/* Kategori Seçimi */}
      <View style={styles.categoryContainer}>
        <Text style={styles.label}>Kategori Seç:</Text>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue: string) => setSelectedCategory(itemValue)}
          style={styles.picker}
          enabled={!isRunning} 
        >
          {CATEGORIES.map((cat, index) => (
            <Picker.Item key={index} label={cat} value={cat} />
          ))}
        </Picker>
      </View>
      
      {/* Sayaç */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(time)}</Text>
      </View>

      {/* Butonlar */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isRunning ? styles.pauseButton : styles.startButton]} 
          onPress={isRunning ? handlePause : handleStart}
          disabled={time === 0}
        >
          <Text style={styles.buttonText}>{isRunning ? 'Duraklat' : 'Başlat'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => handleReset(true)} 
        >
          <Text style={styles.buttonText}>Sıfırla</Text>
        </TouchableOpacity>
      </View>
      
      {/* Dağınıklık Sayacı Geri Bildirimi */}
      <Text style={styles.distractionText}>
        Dikkat Dağınıklığı: {distractionCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#333',
  },
  timerContainer: {
    backgroundColor: '#007AFF',
    padding: 50,
    borderRadius: 150,
    marginVertical: 40,
  },
  timerText: {
    fontSize: 60,
    color: '#fff',
    fontWeight: '300',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginHorizontal: 10,
    backgroundColor: '#6c757d',
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  pauseButton: {
    backgroundColor: '#ffc107',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryContainer: {
    width: '80%',
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  distractionText: {
    marginTop: 30,
    fontSize: 18,
    color: '#dc3545',
  },
});

export default Index;