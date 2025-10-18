import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, TrendingUp, DollarSign, Users, Package } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const AnalyticsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Icon size={24} color={color} />
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginLeft: 8 }}>
              {title}
            </Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text }}>
            {value}
          </Text>
          {subtitle && (
            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text }}>
          Analytics Dashboard
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
          Business insights and metrics
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={COLORS.blue} />
        }
      >
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value="$0.00"
          subtitle="This month"
          color={COLORS.green}
        />
        <StatCard
          icon={TrendingUp}
          title="Growth Rate"
          value="0%"
          subtitle="vs last month"
          color={COLORS.blue}
        />
        <StatCard
          icon={Users}
          title="Total Customers"
          value="0"
          subtitle="Active clients"
          color={COLORS.amber}
        />
        <StatCard
          icon={Package}
          title="Projects"
          value="0"
          subtitle="In progress"
          color={COLORS.primary}
        />

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginTop: 8, alignItems: 'center' }}>
          <BarChart3 size={48} color={COLORS.textSecondary} />
          <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12 }}>
            Detailed charts and graphs will appear here
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;
