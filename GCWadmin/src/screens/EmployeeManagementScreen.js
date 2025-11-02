import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, IdCard, Mail, Phone } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import employeesApi from '../api/employees';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const EmployeeManagementScreen = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      if (!token) {
        throw new Error(t('common.authTokenNotFound'));
      }
      const data = await employeesApi.getEmployees(token);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      Alert.alert(t('common.error'), error.message || t('employeeManager.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderEmployeeCard = ({ item }) => (
    <View style={{ backgroundColor: 'white', marginHorizontal: 12, marginVertical: 6, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.blue + '20', justifyContent: 'center', alignItems: 'center' }}>
          <IdCard size={24} color={COLORS.blue} />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 2 }}>
            {item.role || t('employeeManager.defaultRole')}
          </Text>
          {item.email && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Mail size={12} color={COLORS.textSecondary} />
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 }}>
                {item.email}
              </Text>
            </View>
          )}
          {item.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Phone size={12} color={COLORS.textSecondary} />
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 }}>
                {item.phone}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>{t('employeeManager.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}>
            {t('employeeManager.title')}
          </Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.blue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
          >
            <Plus size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>{t('employeeManager.addEmployee')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={employees}
        renderItem={renderEmployeeCard}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
        nestedScrollEnabled
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { 
              setRefreshing(true); 
              fetchEmployees(); 
            }} 
            tintColor={COLORS.blue} 
          />
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
              {t('employeeManager.noEmployees')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default EmployeeManagementScreen;
