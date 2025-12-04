import { Tabs } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF', // Aktif sekme rengi
        headerShown: false, // Ekran başlıklarını gizle
        tabBarStyle: { 
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
        }
      }}
    >
      {/* index.tsx dosyasını Ana Sayfa olarak göster */}
      <Tabs.Screen
        name="index" 
        options={{
          title: 'Ana Sayfa', 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'timer' : 'timer-outline'} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* reports.tsx dosyasını Raporlar olarak göster */}
      <Tabs.Screen
        name="reports" 
        options={{
          title: 'Raporlar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'stats-chart' : 'stats-chart-outline'} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}