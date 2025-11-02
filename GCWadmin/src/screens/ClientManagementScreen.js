import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Mail, Phone, MapPin, Edit2, Trash2 } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../constants/colors';
import ClientModal from '../components/ClientModal';
import { getClients, createClient, updateClient, deleteClient } from '../api/clients';

const ClientManagementScreen = () => {
  const { t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchQuery, clients]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      Alert.alert(t('common.error'), t('clientManager.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.city?.toLowerCase().includes(query)
    );
    setFilteredClients(filtered);
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setModalVisible(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setModalVisible(true);
  };

  const handleSaveClient = async (clientData) => {
    try {
      if (selectedClient) {
        await updateClient(selectedClient.id, clientData);
        Alert.alert(t('common.success'), t('clientManager.updateSuccess'));
      } else {
        await createClient(clientData);
        Alert.alert(t('common.success'), t('clientManager.createSuccess'));
      }
      setModalVisible(false);
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      Alert.alert(t('common.error'), t('clientManager.saveError'));
    }
  };

  const handleDeleteClient = (client) => {
    Alert.alert(
      t('clientManager.deleteTitle'),
      `${t('clientManager.deleteConfirm')} ${client.name}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(client.id);
              Alert.alert(t('common.success'), t('clientManager.deleteSuccess'));
              fetchClients();
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert(t('common.error'), t('clientManager.deleteError'));
            }
          },
        },
      ]
    );
  };

  const renderClientCard = ({ item }) => (
    <View style={{ backgroundColor: 'white', margin: 12, marginTop: 8, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 }}>
            {item.name}
          </Text>
          {item.email && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Mail size={14} color={COLORS.textSecondary} />
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginLeft: 6 }}>
                {item.email}
              </Text>
            </View>
          )}
          {item.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Phone size={14} color={COLORS.textSecondary} />
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginLeft: 6 }}>
                {item.phone}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => handleEditClient(item)}
            style={{ padding: 8, backgroundColor: COLORS.blue + '20', borderRadius: 8 }}
          >
            <Edit2 size={18} color={COLORS.blue} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteClient(item)}
            style={{ padding: 8, backgroundColor: COLORS.red + '20', borderRadius: 8 }}
          >
            <Trash2 size={18} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Address */}
      {(item.street || item.city || item.state || item.zip) && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <MapPin size={16} color={COLORS.textSecondary} style={{ marginTop: 2 }} />
          <View style={{ marginLeft: 6, flex: 1 }}>
            {item.street && (
              <Text style={{ fontSize: 14, color: COLORS.text }}>{item.street}</Text>
            )}
            <Text style={{ fontSize: 14, color: COLORS.text }}>
              {[item.city, item.state, item.zip].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>
      )}

      {/* Notes */}
      {item.notes && (
        <View style={{ marginTop: 12, padding: 12, backgroundColor: COLORS.background, borderRadius: 8 }}>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' }}>
            {item.notes}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>{t('clientManager.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text }}>
            {t('clientManager.title')}
          </Text>
          <TouchableOpacity
            onPress={handleAddClient}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.blue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
          >
            <Plus size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>{t('clientManager.addClient')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 8, paddingHorizontal: 12 }}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={{ flex: 1, padding: 12, fontSize: 16, color: COLORS.text }}
            placeholder={t('clientManager.searchPlaceholder')}
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Client List */}
      <FlatList
        data={filteredClients}
        renderItem={renderClientCard}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchClients();
            }}
            tintColor={COLORS.blue}
          />
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
              {searchQuery ? t('clientManager.noClientsFound') : t('clientManager.noClients')}
            </Text>
          </View>
        }
      />

      {/* Client Modal */}
      <ClientModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveClient}
        client={selectedClient}
      />
    </SafeAreaView>
  );
};

export default ClientManagementScreen;
