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
import { Plus, Edit2, Trash2, Tag } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { getLabels, createLabel, updateLabel, deleteLabel } from '../api/labels';
import { useLanguage } from '../contexts/LanguageContext';

const LineItemLabelsScreen = () => {
  const { t } = useLanguage();
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState([]); // For bulk delete
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const data = await getLabels();
      setLabels(data);
    } catch (error) {
      console.error('Error fetching labels:', error);
      Alert.alert(t('common.error'), t('lineItems.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteLabel = (label) => {
    Alert.alert(
      t('lineItems.deleteTitle'),
      t('lineItems.deleteConfirm').replace('{name}', label.label_name),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLabel(label.id);
              Alert.alert(t('common.success'), t('lineItems.deleteSuccess'));
              fetchLabels();
            } catch (error) {
              console.error('Error deleting label:', error);
              Alert.alert(t('common.error'), t('lineItems.deleteError'));
            }
          },
        },
      ]
    );
  };

  const toggleSelection = (labelId) => {
    setSelectedLabels(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedLabels.length === 0) {
      Alert.alert(t('common.error'), t('lineItems.selectOneError'));
      return;
    }

    Alert.alert(
      t('lineItems.deleteMultiple'),
      t('lineItems.deleteMultipleConfirm').replace('{count}', selectedLabels.length.toString()),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(selectedLabels.map(id => deleteLabel(id)));
              Alert.alert(t('common.success'), t('lineItems.deleteMultipleSuccess').replace('{count}', selectedLabels.length.toString()));
              setSelectedLabels([]);
              setSelectionMode(false);
              fetchLabels();
            } catch (error) {
              console.error('Error deleting labels:', error);
              Alert.alert(t('common.error'), t('lineItems.deleteMultipleError'));
            }
          },
        },
      ]
    );
  };

  const renderLabelCard = ({ item }) => {
    const isSelected = selectedLabels.includes(item.id);
    
    return (
      <TouchableOpacity
        onPress={() => selectionMode && toggleSelection(item.id)}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            setSelectedLabels([item.id]);
          }
        }}
        activeOpacity={selectionMode ? 0.7 : 1}
      >
        <View style={{ 
          backgroundColor: isSelected ? COLORS.blue + '10' : 'white', 
          marginHorizontal: 12, 
          marginVertical: 6, 
          borderRadius: 12, 
          padding: 16, 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 2 }, 
          shadowOpacity: 0.1, 
          shadowRadius: 4, 
          elevation: 3,
          borderWidth: isSelected ? 2 : 0,
          borderColor: COLORS.blue,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              {selectionMode && (
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? COLORS.blue : COLORS.textLight,
                  backgroundColor: isSelected ? COLORS.blue : 'transparent',
                  marginRight: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {isSelected && <Text style={{ color: 'white', fontSize: 14 }}>✓</Text>}
                </View>
              )}
              <Tag size={20} color={COLORS.blue} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text }}>
                  {item.label_name}
                </Text>
                {item.default_unit_price > 0 && (
                  <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
                    ${parseFloat(item.default_unit_price).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
            
            {!selectionMode && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleDeleteLabel(item)}
                  style={{ padding: 8, backgroundColor: COLORS.red + '20', borderRadius: 8 }}
                >
                  <Trash2 size={18} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>{t('lineItems.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text }}>
              {t('lineItems.title')}
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
              {selectionMode
                ? `${selectedLabels.length} ${t('lineItems.selected')}`
                : t('lineItems.subtitle')}
            </Text>
          </View>

          {selectionMode ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setSelectionMode(false);
                  setSelectedLabels([]);
                }}
                style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.textLight + '20', borderRadius: 8 }}
              >
                <Text style={{ color: COLORS.text, fontWeight: '600' }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBulkDelete}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor: COLORS.red,
                  borderRadius: 8,
                  opacity: selectedLabels.length === 0 ? 0.5 : 1,
                }}
                disabled={selectedLabels.length === 0}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {t('lineItems.deleteSelected').replace('{count}', selectedLabels.length.toString())}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setSelectionMode(true)}
              style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.blue, borderRadius: 8 }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>{t('lineItems.select')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={labels}
        renderItem={renderLabelCard}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLabels(); }} tintColor={COLORS.blue} />
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
              {t('lineItems.noLabels')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default LineItemLabelsScreen;
