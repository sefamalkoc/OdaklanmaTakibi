import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AppStateStatus 
} from 'react-native';
type TimerHandle = NodeJS.Timeout | null; 
import { saveSession } from '../../src/utils/Storage'; 
import { Picker } from '@react-native-picker/picker'; 

// Sabitler
const INITIAL_TIME = 25 * 60; // 25 dakika
const CATEGORIES = ["Ders Çalışma", "Kodlama", "Proje", "Kitap Okuma"]; 

const Index = () => {
  const [displayTime, setDisplayTime] = useState(INITIAL_TIME); 
  const [isRunning, setIsRunning] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0); 
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  
  const timeRef = useRef(INITIAL_TIME); 
  const timerRef = useRef<TimerHandle>(null); 
  const appState = useRef(AppState.currentState); 

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const finalizeSession = (isCompleted: boolean) => {
    const focusedDuration = INITIAL_TIME - timeRef.current; 

    // 1 dakikadan az odaklanma süresi kaydetme
    if (focusedDuration < 60) {
        // Oturum sıfırlanır ancak kayıt yapılmaz
        handleReset(); 
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
    
    // Finalize edildikten sonra sıfırlamayı Kaydetme (handleSave) fonksiyonu yapacak
    // veya handleStart içinde çağrıldığında manuel reset yapılmayacak.
    // Burada sadece veriyi kaydetme işini yapsın.
  };

  const handlePause = () => {
    if (isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current); 
      }
      setIsRunning(false);
    }
  };

  // SADECE sıfırlama işlemi yapar, kaydetme yapmaz
  const handleReset = () => {
    handlePause(); 
    timeRef.current = INITIAL_TIME; 
    setDisplayTime(INITIAL_TIME); 
    setDistractionCount(0); 
    setIsRunning(false); 
  };
  
  // YENİ FONKSİYON: Oturumu kaydeder ve sıfırlar
  const handleSave = () => {
      // Pause durumunda olduğumuzdan eminiz
      if (!isRunning && timeRef.current < INITIAL_TIME) {
          finalizeSession(false); // Başarıyla tamamlanmadı (manuel durduruldu)
          handleReset(); // Kayıt yapıldıktan sonra sıfırla
      }
  };


  const handleStart = () => {
    if (!isRunning && timeRef.current > 0) {
      setIsRunning(true); 
      
      timerRef.current = setInterval(() => {
        timeRef.current -= 1; 
        setDisplayTime(timeRef.current); 
        
        if (timeRef.current <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          setIsRunning(false);
          finalizeSession(true); // Başarıyla tamamlandı (timer 0'a ulaştı)
          handleReset(); // Otomatik olarak sıfırla
        }
        
      }, 1000) as unknown as NodeJS.Timeout; 
    }
  };
  
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (isRunning && appState.current.match(/active/) && nextAppState === 'background') {
      
      handlePause(); 
      setDistractionCount(prevCount => prevCount + 1); 
      
      console.log('UYARI: Dikkat Dağınıklığı tespit edildi! Sayaç duraklatıldı.');
    }
    
    if (!isRunning && appState.current.match(/background/) && nextAppState === 'active' && timeRef.current > 0) {
        Alert.alert(
            "Geri Döndün!",
            "Odaklanmaya devam etmek ister misin?",
            [
                { text: "Hayır (Sıfırla)", onPress: handleReset, style: 'cancel' }, // Sadece reset et
                { text: "Evet (Devam Et)", onPress: handleStart },
            ],
            { cancelable: false }
        );
    }

    appState.current = nextAppState; 
  };
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current); 
      }
      subscription.remove(); 
    };
  }, [isRunning]);

  // Sayaç çalışmış mı kontrolü (Kaydet butonu için)
  const isSessionStarted = displayTime < INITIAL_TIME;

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
        <Text style={styles.timerText}>{formatTime(displayTime)}</Text>
      </View>

      {/* Butonlar */}
      <View style={styles.buttonContainer}>
        {/* Buton 1: Başlat / Duraklat */}
        <TouchableOpacity 
          style={[styles.button, isRunning ? styles.pauseButton : styles.startButton]} 
          onPress={isRunning ? handlePause : handleStart}
          disabled={displayTime === 0}
        >
          <Text style={styles.buttonText}>{isRunning ? 'Duraklat' : 'Başlat'}</Text>
        </TouchableOpacity>
        
        {/* Buton 2: Kaydet (Duraklatılmışsa ve oturum başlamışsa) VEYA Sıfırla */}
        {(!isRunning && isSessionStarted) ? (
            // Kaydet butonu
            <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSave} 
            >
                <Text style={styles.buttonText}>Kaydet</Text>
            </TouchableOpacity>
        ) : (
             // Sıfırla butonu (Koşulsuz reset)
            <TouchableOpacity 
                style={styles.button} 
                onPress={handleReset} 
                disabled={isRunning}
            >
                <Text style={styles.buttonText}>Sıfırla</Text>
            </TouchableOpacity>
        )}
        
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
  saveButton: { // YENİ: Kaydet butonu stili
    backgroundColor: '#007AFF',
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