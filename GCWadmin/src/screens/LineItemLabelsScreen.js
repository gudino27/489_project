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

  const renderLabelCard = ({ item }) => (
    <View style={{ backgroundColor: 'white', marginHorizontal: 12, marginVertical: 6, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Tag size={20} color={COLORS.blue} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text }}>
              {item.label}
            </Text>
            {item.description && (
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

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
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text }}>
          Line Item Labels
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
          Quick templates for invoice line items
        </Text>
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
