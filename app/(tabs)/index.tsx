
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    AppState,
    AppStateStatus,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { saveSession, Session } from '../../src/utils/Storage';

import { Ionicons } from '@expo/vector-icons';

const DEFAULT_TIME = 25 * 60;
const CATEGORIES = ['Ders Çalışma', 'Kodlama', 'Proje', 'Kitap Okuma'];

let globalTimer: ReturnType<typeof setInterval> | null = null;

export default function Index() {
    const [initialTime, setInitialTime] = useState<number>(DEFAULT_TIME);
    const [displayTime, setDisplayTime] = useState<number>(DEFAULT_TIME);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [distractionCount, setDistractionCount] = useState<number>(0);
    const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
    const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

    const timeRef = useRef<number>(DEFAULT_TIME);
    const appState = useRef<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        return () => {
            if (globalTimer) {
                clearInterval(globalTimer);
                globalTimer = null;
            }
        };
    }, []);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const stopTimer = () => {
        if (globalTimer) {
            clearInterval(globalTimer);
            globalTimer = null;
        }
        setIsRunning(false);
    };

    const performCleanReset = () => {
        stopTimer();
        timeRef.current = initialTime;
        setDisplayTime(initialTime);
        setDistractionCount(0);
        setIsRunning(false);
    };

    const finalizeSession = async (isCompleted: boolean) => {
        const focusedSeconds = initialTime - timeRef.current;

        if (focusedSeconds < 60) {
            Alert.alert(
                'Süre Çok Kısa',
                '1 dakikadan kısa süren odaklanma seansları kaydedilmemektedir.',
                [{ text: 'Tamam' }]
            );
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
    };

    const resetTimer = () => {
        const isSessionStarted = timeRef.current < initialTime;

        if (isSessionStarted) {
            Alert.alert(
                "Oturumu Sonlandır",
                "Odaklanma süreniz devam ediyor. Bu oturumu kaydetmek istiyor musun? Kaydetmezseniz ilerlemeniz silinir.",
                [
                    {
                        text: "Kaydet ve Sıfırla",
                        onPress: async () => {
                            stopTimer();
                            await finalizeSession(false);
                            performCleanReset();
                        },
                        style: 'default'
                    },
                    {
                        text: "İlerleme Sil",
                        onPress: performCleanReset,
                        style: 'destructive'
                    },
                    {
                        text: "İptal",
                        onPress: () => {
                            if (isRunning) {
                                startTimer();
                            }
                        },
                        style: 'cancel'
                    }
                ]
            );
            stopTimer();
        } else {
            performCleanReset();
        }
    };


    const startTimer = () => {
        if (globalTimer && isRunning) return;

        if (timeRef.current <= 0) {
            timeRef.current = initialTime;
            setDisplayTime(initialTime);
        }

        setIsRunning(true);
        globalTimer = setInterval(() => {
            timeRef.current -= 1;
            setDisplayTime(timeRef.current);

            if (timeRef.current <= 0) {
                stopTimer();
                finalizeSession(true);
                performCleanReset();
            }
        }, 1000);
    };

    useEffect(() => {
        const sub = AppState.addEventListener('change', (next) => {
            if (appState.current === 'active' && next.match(/background|inactive/)) {
                if (globalTimer) {
                    setDistractionCount((p) => p + 1);
                    stopTimer();
                }
            }

            if (
                (appState.current.match(/background|inactive/) || appState.current === 'unknown') &&
                next === 'active' &&
                timeRef.current > 0
            ) {
                if (!isRunning && timeRef.current > 0 && timeRef.current < initialTime) {
                    Alert.alert(
                        'Geri Döndün!',
                        'Odaklanmaya devam etmek ister misin?',
                        [
                            { text: 'Hayır (Sıfırla)', onPress: resetTimer, style: 'cancel' },
                            { text: 'Evet (Devam Et)', onPress: () => startTimer() },
                        ],
                        { cancelable: false }
                    );
                }
            }

            appState.current = next;
        });

        return () => sub.remove();
    }, [isRunning, initialTime]);

    const handleDurationChange = (change: number) => {
        if (isRunning || displayTime !== initialTime) return;

        const newTime = initialTime + change;
        if (newTime >= 5 * 60 && newTime <= 120 * 60) {
            setInitialTime(newTime);
            setDisplayTime(newTime);
            timeRef.current = newTime;
        }
    };

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
                <View style={styles.timerControls}>
                    <TouchableOpacity
                        onPress={() => handleDurationChange(-5 * 60)}
                        disabled={isRunning || displayTime !== initialTime}
                        style={styles.adjustButton}
                    >
                        <Ionicons name="remove-circle-outline" size={40} color={(isRunning || displayTime !== initialTime) ? "rgba(255,255,255,0.5)" : "#fff"} />
                    </TouchableOpacity>

                    <Text style={styles.timerText}>{formatTime(displayTime)}</Text>

                    <TouchableOpacity
                        onPress={() => handleDurationChange(5 * 60)}
                        disabled={isRunning || displayTime !== initialTime}
                        style={styles.adjustButton}
                    >
                        <Ionicons name="add-circle-outline" size={40} color={(isRunning || displayTime !== initialTime) ? "rgba(255,255,255,0.5)" : "#fff"} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.largeButton, isRunning ? styles.pauseButton : styles.startButton]}
                    onPress={isRunning ? stopTimer : startTimer}
                    disabled={displayTime === 0}
                >
                    <Text style={styles.buttonText}>{isRunning ? 'Duraklat' : 'Başlat'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.largeButton]}
                    onPress={resetTimer}
                    disabled={timeRef.current === initialTime}
                >
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

    timerContainer: { backgroundColor: '#007AFF', padding: 20, borderRadius: 150, marginVertical: 30, width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
    timerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    timerText: { fontSize: 60, color: '#fff', fontWeight: '300', marginHorizontal: 10, fontVariant: ['tabular-nums'] },
    adjustButton: { padding: 5 },

    buttonContainer: { flexDirection: 'row', marginTop: 10, width: '100%', justifyContent: 'center' },
    button: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8, marginHorizontal: 8, backgroundColor: '#6c757d' },
    largeButton: { flex: 1, maxWidth: 150, paddingHorizontal: 0 },
    startButton: { backgroundColor: '#28a745' },
    pauseButton: { backgroundColor: '#ffc107' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

    distractionText: { marginTop: 24, fontSize: 18, color: '#d2293aff' },
});