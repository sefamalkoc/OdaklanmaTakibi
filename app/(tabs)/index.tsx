// app/(tabs)/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { saveSession, Session } from '../../src/utils/Storage';

const INITIAL_TIME = 25 * 60; // saniye cinsinden
const CATEGORIES = ['Ders Çalışma', 'Kodlama', 'Proje', 'Kitap Okuma'];

let globalTimer: ReturnType<typeof setInterval> | null = null;

export default function Index() {
  const [displayTime, setDisplayTime] = useState<number>(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [distractionCount, setDistractionCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  const timeRef = useRef<number>(INITIAL_TIME);
  const appState = useRef<AppStateStatus>(AppState.currentState);

 
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startTimer = () => {
    if (globalTimer) return;
    if (timeRef.current <= 0) {
      // reset if zero
      timeRef.current = INITIAL_TIME;
      setDisplayTime(INITIAL_TIME);
    }

    setIsRunning(true);
    globalTimer = setInterval(() => {
      timeRef.current -= 1;
      setDisplayTime(timeRef.current);

      if (timeRef.current <= 0) {
        stopTimer();
        finalizeSession(true);
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (globalTimer) {
      clearInterval(globalTimer);
      globalTimer = null;
    }
    setIsRunning(false);
  };

  const resetTimer = (shouldFinalize = true) => {
    const wasRunning = isRunning;
    stopTimer();
    if (shouldFinalize && wasRunning && timeRef.current < INITIAL_TIME) {
      // only finalize if some time passed
      finalizeSession(false);
    }
    timeRef.current = INITIAL_TIME;
    setDisplayTime(INITIAL_TIME);
    setDistractionCount(0);
  };

  const finalizeSession = async (isCompleted: boolean) => {
    const focusedSeconds = INITIAL_TIME - timeRef.current;
    if (focusedSeconds < 60) {
      // ignore too short sessions
      timeRef.current = INITIAL_TIME;
      setDisplayTime(INITIAL_TIME);
      setIsRunning(false);
      setDistractionCount(0);
      return;
    }

    const session: Session = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      duration: Math.ceil(focusedSeconds / 60),
      category: selectedCategory,
      distractionCount,
      isCompleted: isCompleted,
    };

    try {
      await saveSession(session);
    } catch (e) {
      console.warn('saveSession error', e);
    }

    Alert.alert(
      'Seans Özeti',
      `Süre: ${session.duration} dakika\nKategori: ${session.category}\nDağınıklık: ${session.distractionCount} kez`,
      [{ text: 'Tamam' }]
    );

    // reset but do not re-finalize
    timeRef.current = INITIAL_TIME;
    setDisplayTime(INITIAL_TIME);
    setDistractionCount(0);
    setIsRunning(false);
  };

  // AppState değişikliklerini güvenilir şekilde yakalama
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      // aktiften arka plana/inactive geçiş -> dikkat dağınıklığı
      if (appState.current === 'active' && next.match(/background|inactive/)) {
        if (globalTimer) {
          // bir dikkat dağınıklığı say
          setDistractionCount((p) => p + 1);
          stopTimer();
        }
      }

      // arka plandan aktif olursa (kullanıcı döndü)
      if (
        (appState.current.match(/background|inactive/) || appState.current === 'unknown') &&
        next === 'active' &&
        timeRef.current > 0
      ) {
        if (!isRunning && timeRef.current > 0 && timeRef.current < INITIAL_TIME) {
          Alert.alert(
            'Geri Döndün!',
            'Odaklanmaya devam etmek ister misin?',
            [
              { text: 'Hayır (Sıfırla)', onPress: () => resetTimer(true), style: 'cancel' },
              { text: 'Evet (Devam Et)', onPress: () => startTimer() },
            ],
            { cancelable: false }
          );
        }
      }

      appState.current = next;
    });

    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Odaklanma Takibi</Text>

      <View style={styles.categoryContainer}>
        <Text style={styles.label}>Kategori Seç:</Text>

        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => {
            if (!isRunning) setShowCategoryModal(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.categoryButtonText}>{selectedCategory}</Text>
        </TouchableOpacity>

        <Modal visible={showCategoryModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Kategori Seç</Text>
              {CATEGORIES.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.modalCloseText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(displayTime)}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isRunning ? styles.pauseButton : styles.startButton]}
          onPress={isRunning ? stopTimer : startTimer}
        >
          <Text style={styles.buttonText}>{isRunning ? 'Duraklat' : 'Başlat'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => resetTimer(true)}>
          <Text style={styles.buttonText}>Sıfırla</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.distractionText}>Dikkat Dağınıklığı: {distractionCount}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: 'bold', marginVertical: 20, color: '#333' },

  categoryContainer: { width: '100%', marginBottom: 12 },
  label: { fontSize: 16, marginBottom: 6 },
  categoryButton: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  categoryButtonText: { fontSize: 16, color: '#333' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 18, textAlign: 'center' },
  modalCloseButton: { marginTop: 15, padding: 15, backgroundColor: '#dc3545', borderRadius: 8 },
  modalCloseText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },

  timerContainer: { backgroundColor: '#007AFF', padding: 36, borderRadius: 150, marginVertical: 30 },
  timerText: { fontSize: 60, color: '#fff', fontWeight: '300' },

  buttonContainer: { flexDirection: 'row', marginTop: 10 },
  button: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 8, marginHorizontal: 8, backgroundColor: '#6c757d' },
  startButton: { backgroundColor: '#28a745' },
  pauseButton: { backgroundColor: '#ffc107' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  distractionText: { marginTop: 24, fontSize: 18, color: '#dc3545' },
});
