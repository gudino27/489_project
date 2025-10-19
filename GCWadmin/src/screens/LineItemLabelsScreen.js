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

const LineItemLabelsScreen = () => {
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
      Alert.alert('Error', 'Failed to load labels');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteLabel = (label) => {
    Alert.alert(
      'Delete Label',
      `Are you sure you want to delete "${label.label_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLabel(label.id);
              Alert.alert('Success', 'Label deleted successfully');
              fetchLabels();
            } catch (error) {
              console.error('Error deleting label:', error);
              Alert.alert('Error', 'Failed to delete label');
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
      Alert.alert('Error', 'Please select at least one label to delete');
      return;
    }

    Alert.alert(
      'Delete Multiple Labels',
      `Are you sure you want to delete ${selectedLabels.length} label(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(selectedLabels.map(id => deleteLabel(id)));
              Alert.alert('Success', `${selectedLabels.length} label(s) deleted successfully`);
              setSelectedLabels([]);
              setSelectionMode(false);
              fetchLabels();
            } catch (error) {
              console.error('Error deleting labels:', error);
              Alert.alert('Error', 'Failed to delete some labels');
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
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Loading labels...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text }}>
              Line Item Labels
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
              {selectionMode 
                ? `${selectedLabels.length} selected` 
                : 'Quick templates for invoice line items'}
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
                <Text style={{ color: COLORS.text, fontWeight: '600' }}>Cancel</Text>
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
                  Delete ({selectedLabels.length})
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setSelectionMode(true)}
              style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.blue, borderRadius: 8 }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Select</Text>
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
              No labels yet. Add your first line item template!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default LineItemLabelsScreen;
