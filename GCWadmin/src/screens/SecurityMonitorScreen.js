import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { getSecurityLogs } from '../api/security';

const SecurityMonitorScreen = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getSecurityLogs();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching security logs:', error);
      Alert.alert('Error', 'Failed to load security logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderLogCard = ({ item }) => (
    <View style={{ backgroundColor: 'white', marginHorizontal: 12, marginVertical: 6, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {item.type === 'success' ? (
          <CheckCircle size={20} color={COLORS.green} />
        ) : (
          <AlertCircle size={20} color={COLORS.red} />
        )}
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text }}>
            {item.event || 'Security Event'}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
            {item.description || 'No description available'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Clock size={12} color={COLORS.textSecondary} />
            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 }}>
              {item.timestamp || 'Unknown time'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Loading security logs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Shield size={28} color={COLORS.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text }}>
              Security Monitor
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>
              System security and access logs
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={logs}
        renderItem={renderLogCard}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLogs(); }} tintColor={COLORS.blue} />
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Shield size={48} color={COLORS.textSecondary} />
            <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12 }}>
              No security logs available
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default SecurityMonitorScreen;
