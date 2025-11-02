import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';

const InvoiceTrackingScreen = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
  });

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Icon size={24} color={color} />
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginLeft: 8 }}>
          {title}
        </Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text }}>
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text }}>
          {t('invoiceTracking.title')}
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
          {t('invoiceTracking.subtitle')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={COLORS.blue} />
        }
      >
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <StatCard icon={BarChart3} title={t('invoiceTracking.total')} value={stats.totalInvoices} color={COLORS.blue} />
          <StatCard icon={TrendingUp} title={t('invoiceTracking.paid')} value={stats.paidInvoices} color={COLORS.green} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard icon={DollarSign} title={t('invoiceTracking.revenue')} value={`$${stats.totalRevenue}`} color={COLORS.amber} />
          <StatCard icon={Users} title={t('invoiceTracking.pending')} value={stats.pendingInvoices} color={COLORS.textSecondary} />
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginTop: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
            {t('invoiceTracking.liveData')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InvoiceTrackingScreen;
