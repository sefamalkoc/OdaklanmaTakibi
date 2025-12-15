
import { useFocusEffect } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { getSessions, Session } from '../../src/utils/Storage';


export default function Reports() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        const s = await getSessions();
        setSessions(s);
      };
      load();
    }, [])
  );


  // helper: last 7 days labels and totals (minutes)
  const { last7Labels, last7Values, categoryData, todayTotal, totalMinutes, totalDistractions } = useMemo(() => {
    const labels: string[] = [];
    const values: number[] = [];
    const today = new Date();
    const sessionsByDate: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('tr-TR', { weekday: 'short' })); // Pzt, Sal, ...
      sessionsByDate[key] = 0;
    }

    sessions.forEach((s) => {
      if (s && s.date) {
        sessionsByDate[s.date] = (sessionsByDate[s.date] || 0) + s.duration;
      }
    });

    Object.keys(sessionsByDate).forEach((k) => {
      values.push(sessionsByDate[k]);
    });

    // category aggregation
    const catMap: Record<string, number> = {};
    let totalDurationForPie = 0; // NEW: Track total for percentage

    sessions.forEach((s) => {
      catMap[s.category] = (catMap[s.category] || 0) + s.duration;
      totalDurationForPie += s.duration; // NEW
    });

    const pieData = Object.keys(catMap).map((k, idx) => {
      const colorList = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'];
      const val = catMap[k];
      const percentage = totalDurationForPie > 0 ? ((val / totalDurationForPie) * 100).toFixed(1) : 0; // NEW

      return {
        name: `%${percentage} ${k}`,
        population: val,
        color: colorList[idx % colorList.length],
        legendFontColor: '#000',
        legendFontSize: 12,
      };
    });

    const todayKey = new Date().toISOString().split('T')[0];
    const todayTotalLocal = sessions.filter((s) => s.date === todayKey).reduce((t, s) => t + s.duration, 0);
    const total = sessions.reduce((t, s) => t + s.duration, 0);
    const distractions = sessions.reduce((t, s) => t + s.distractionCount, 0);

    return {
      last7Labels: labels,
      last7Values: values,
      categoryData: pieData.length ? pieData : [{ name: 'Yok', population: 0, color: '#ccc', legendFontColor: '#000', legendFontSize: 12 }],
      todayTotal: todayTotalLocal,
      totalMinutes: total,
      totalDistractions: distractions,
    };
  }, [sessions]);

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Raporlar</Text>

      <View style={{ marginBottom: 12 }}>
        <Text>Bugün Toplam Odaklanma: {todayTotal} dk</Text>
        <Text>Tüm Zamanlar Toplam: {totalMinutes} dk</Text>
        <Text>Toplam Dikkat Dağınıklığı: {totalDistractions}</Text>
      </View>

      <Text style={{ marginTop: 10, marginBottom: 6 }}>Son 7 Gün (dk)</Text>
      <BarChart
        data={{
          labels: last7Labels,
          datasets: [{ data: last7Values }],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisLabel=""
        yAxisSuffix="dk"
        chartConfig={{
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
        }}
        style={{ borderRadius: 8 }}
      />

      <Text style={{ marginTop: 16, marginBottom: 6 }}>Kategori Dağılımı</Text>
      <PieChart
        data={categoryData}
        width={screenWidth - 32}
        height={220}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        chartConfig={{
          color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
        }}
        absolute
      />
    </ScrollView>
  );
}
