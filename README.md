# Odaklanma Takibi (Focus Tracker)

"Odaklanma Takibi", kullanıcıların verimliliklerini artırmak amacıyla çalışma sürelerini izlemelerini (Pomodoro vb.), kategorize etmelerini ve grafiksel raporlarla analiz etmelerini sağlayan, React Native ve Expo altyapısı ile geliştirilmiş bir mobil uygulamadır.

## Özellikler

- **Odaklanma Sayacı**: Dikkat dağıtıcı unsurlar olmadan çalışmanızı sağlayan geri sayım sayacı.
- **Kategori Sistemi**: Yaptığınız işi (Ders Çalışma, Kodlama, Kitap Okuma vb.) kategorize etme imkanı.
- **Kesinti Takibi**: Uygulama arka plana atıldığında veya odaklanma bozulduğunda dikkat dağınıklığı sayısının takibi.
- **Raporlama**: Günlük ve haftalık çalışma istatistikleri, kategori dağılım grafikleri.
- **Kalıcı Depolama**: Geçmiş çalışma verilerinin cihazda saklanması.

## Kurulum ve Çalıştırma

Bu projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- [Node.js](https://nodejs.org/) (LTS sürümü önerilir)
- [Expo Go](https://expo.dev/go) uygulaması (Telefonunuzda test etmek için) veya Android Studio/Xcode (Emülatör için)

### Adım 1: Depoyu Klonlayın

```bash
git clone https://github.com/sefamalkoc/OdaklanmaTakibi.git
cd OdaklanmaTakibi
```

### Adım 2: Bağımlılıkları Yükleyin

Proje dizininde terminali açın ve gerekli paketleri yükleyin:

```bash
npm install
```

### Adım 3: Uygulamayı Başlatın

```bash
npx expo start
```

Bu komut Expo geliştirme sunucusunu başlatacaktır. Çıkan QR kodunu telefonunuzdaki **Expo Go** uygulaması ile okutarak veya terminalde `a` (Android) veya `i` (iOS) tuşlarına basarak emülatörde çalıştırabilirsiniz.

## Proje Yapısı

- **`app/`**: Uygulama ekranları ve navigasyon (Expo Router).
- **`src/`**: Yardımcı fonksiyonlar ve iş mantığı.
- **`components/`**: UI bileşenleri.
- **`assets/`**: Görseller ve font dosyaları.

## Teknoloji Yığını

- **Framework**: React Native (Expo)
- **Dil**: TypeScript
- **Navigasyon**: Expo Router
- **Grafikler**: react-native-chart-kit
- **Depolama**: AsyncStorage

---
Geliştirici: Sefa Malkoç
