import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from "react-native-chart-kit";
import { getSessions } from '../../src/utils/Storage'; // DOĞRU YOL

// --- TIP TANIMLAMALARI (TypeScript Hatalarını Çözmek İçin Eklendi) ---

// 1. Session Veri Yapısı (Storage.js'den gelen veri)
interface Session {
  id: number;
  date: string;
  duration: number; // in minutes
  category: string;
  distractionCount: number;
  isCompleted: boolean;
}

// 2. Grafik Veri Yapıları
interface PieDataEntry {
  name: string;
  population: number; // Süre (Dakika)
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface BarData {
    labels: string[];
    datasets: [{ data: number[] }];
}

// 3. Rapor Veri Yapısı (Report bileşeninin state'inde tutulur)
interface ReportData {
  todayTotalDuration: number;
  allTimeTotalDuration: number;
  totalDistractions: number;
  pieData: PieDataEntry[];
  barData: BarData;
}
// -------------------------------------------------------------------

const screenWidth = Dimensions.get("window").width;

// Veri İşleme Fonksiyonu (sessions parametresine Session[] tipi atandı)
const processDataForReports = (sessions: Session[]): ReportData => {
  const today = new Date().toISOString().split('T')[0];
  let todayTotalDuration = 0;
  let allTimeTotalDuration = 0;
  let totalDistractions = 0;
  
  // TypeScript hatasını çözmek için index imzası eklendi
  const categoryMap: { [key: string]: number } = {}; 
  const last7DaysMap: { [key: string]: { date: string, duration: number, label: string } } = {}; 
  
  // Son 7 gün için boş veri yapısını oluştur
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' }); 
    last7DaysMap[dateStr] = { date: dateStr, duration: 0, label: dayName };
  }

  // session parametresine Session tipi atandı
  sessions.forEach((session: Session) => {
    allTimeTotalDuration += session.duration;
    totalDistractions += session.distractionCount;
    
    if (session.date === today) {
      todayTotalDuration += session.duration;
    }

    // Kategoriye göre süreleri topla
    categoryMap[session.category] = (categoryMap[session.category] || 0) + session.duration;

    // Son 7 gün verilerini topla
    if (last7DaysMap.hasOwnProperty(session.date)) {
      last7DaysMap[session.date].duration += session.duration;
    }
  });

  const pieChartColors = ["#007AFF", "#FF9500", "#34C759", "#FF2D55", "#5856D6", "#AAAAAA"];
  let colorIndex = 0;

  // Pasta Grafik (Pie Chart) verisini hazırla
  const pieData: PieDataEntry[] = Object.keys(categoryMap).map(category => {
    const data = {
      name: category,
      population: categoryMap[category] as number, // Tipi kesinleştirildi
      color: pieChartColors[colorIndex % pieChartColors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    };
    colorIndex++;
    return data;
  });
  
  // Bar Chart için günleri sırala (Sıralama fonksiyonuna tip ataması yapıldı)
  const sortedDays = Object.values(last7DaysMap).sort((a, b) => {
    return a.date > b.date ? 1 : a.date < b.date ? -1 : 0;
  });
    
  // Çubuk Grafik (Bar Chart) verisini hazırla
  const barData: BarData = {
    labels: sortedDays.map(item => item.label), 
    datasets: [
      {
        data: sortedDays.map(item => item.duration),
      },
    ],
  };

  return {
    todayTotalDuration,
    allTimeTotalDuration,
    totalDistractions,
    pieData,
    barData,
  };
};


const Reports = () => {
  // useState'e ReportData | null tipi atandı
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const fetchReports = async () => {
    // getSessions, Session[] dönüyor varsayıldı
    const sessions: Session[] = await getSessions(); 
    const data = processDataForReports(sessions);
    setReportData(data); // Artık tip uyumlu
  };
  
  useEffect(() => {
    fetchReports(); 
  }, []); 


  if (!reportData) {
    return <Text style={styles.loadingText}>Veriler yükleniyor...</Text>;
  }

  // Artık reportData'nın tipi ReportData olduğu için güvenle kullanılabilir
  const hasValidData = reportData.allTimeTotalDuration > 0; 

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Genel İstatistikler</Text>
      
      {/* İSTATİSTİK KARTLARI */}
      <View style={styles.statsContainer}>
        <StatCard title="Bugün Odaklanma" value={`${reportData.todayTotalDuration} Dk`} color="#28a745" />
        <StatCard title="Tüm Zamanlar" value={`${reportData.allTimeTotalDuration} Dk`} color="#007AFF" />
        <StatCard title="Toplam Dağınıklık" value={`${reportData.totalDistractions} Kez`} color="#dc3545" />
      </View>
      
      {/* GRAFİKLER */}
      {!hasValidData && (
          <Text style={styles.noDataText}>Henüz yeterli odaklanma verisi kaydedilmedi. Lütfen Ana Sayfa'da seans başlatın.</Text>
      )}
      
      {hasValidData && (
        <React.Fragment>
          <Text style={styles.chartTitle}>Son 7 Gün Odaklanma (Dk)</Text>
          {/* ÇUBUK GRAFİK (BAR CHART) */}
          <View style={styles.chartContainer}>
            <BarChart
              data={reportData.barData}
              width={screenWidth - 40} 
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              fromZero 
              yAxisSuffix=" Dk"
              yAxisLabel=" " // BarChart hatasını çözmek için eklenen zorunlu prop
            />
          </View>

          <Text style={styles.chartTitle}>Kategoriye Göre Dağılım</Text>
          {/* PASTA GRAFİK (PIE CHART) */}
          <View style={styles.chartContainer}>
            <PieChart
              data={reportData.pieData.length > 0 ? reportData.pieData : [
                { name: "Veri Yok", population: 1, color: "#ccc", legendFontColor: '#7F7F7F', legendFontSize: 15 }
              ]}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population" 
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 50]}
              absolute 
            />
          </View>
        </React.Fragment>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

// Ortak Grafik Ayarları
const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0, 
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#ffa726",
  }
};

// İstatistik Kartı Bileşeni (Parametrelere tip ataması yapıldı)
const StatCard = ({ title, value, color }: { title: string, value: string, color: string }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 15,
    paddingHorizontal: 10,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    margin: 5,
    width: '30%', 
    borderLeftWidth: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 15,
    paddingHorizontal: 10,
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // missing styles.chart kuralı eklendi
  chart: { 
      // Grafik bileşenlerine bazen boş stil atamak gerekebilir
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#6c757d'
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    color: '#dc3545',
    fontWeight: '500'
  }
});

export default Reports;