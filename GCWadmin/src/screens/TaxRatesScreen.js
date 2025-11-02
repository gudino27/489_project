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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Edit2, Trash2, Percent, X } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../constants/colors';
import { getTaxRates, createTaxRate, updateTaxRate, deleteTaxRate } from '../api/taxRates';

const TaxRatesScreen = () => {
  const { t } = useLanguage();
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTaxRate, setSelectedTaxRate] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    state: '',
    rate: '',
    description: '',
  });

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      const data = await getTaxRates();
      setTaxRates(data);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      // Silently fail - don't show error to user if feature not implemented yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddTaxRate = () => {
    setSelectedTaxRate(null);
    setFormData({ city: '', state: '', rate: '', description: '' });
    setModalVisible(true);
  };

  const handleEditTaxRate = (taxRate) => {
    setSelectedTaxRate(taxRate);
    const rate = parseFloat(taxRate.tax_rate);
    setFormData({
      city: taxRate.city || '',
      state: taxRate.state_code || '',
      // If rate > 1, it's already a percentage. If < 1, convert to percentage
      rate: rate > 1 ? rate.toString() : (rate * 100).toString(),
      description: taxRate.description || '',
    });
    setModalVisible(true);
  };

  const handleSaveTaxRate = async () => {
    if (!formData.city.trim() || !formData.state.trim() || !formData.rate.trim()) {
      Alert.alert(t('common.error'), t('invoiceManager.taxRateRequired'));
      return;
    }

    const rateValue = parseFloat(formData.rate);
    if (isNaN(rateValue) || rateValue < 0 || rateValue > 100) {
      Alert.alert(t('common.error'), t('invoiceManager.validRateRequired'));
      return;
    }

    try {
      const taxRateData = {
        city: formData.city.trim(),
        state_code: formData.state.trim().toUpperCase(),
        tax_rate: rateValue / 100, // Convert percentage to decimal (e.g., 8.5% -> 0.085)
        description: formData.description.trim(),
      };

      if (selectedTaxRate) {
        await updateTaxRate(selectedTaxRate.id, taxRateData);
        Alert.alert(t('common.success'), t('invoiceManager.taxRateUpdated'));
      } else {
        await createTaxRate(taxRateData);
        Alert.alert(t('common.success'), t('invoiceManager.taxRateCreated'));
      }

      setModalVisible(false);
      fetchTaxRates();
    } catch (error) {
      console.error('Error saving tax rate:', error);
      Alert.alert(t('common.error'), t('invoiceManager.saveTaxRateError'));
    }
  };

  const handleDeleteTaxRate = (taxRate) => {
    Alert.alert(
      t('invoiceManager.deleteTaxRate'),
      t('invoiceManager.deleteTaxRateConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTaxRate(taxRate.id);
              Alert.alert(t('common.success'), t('invoiceManager.taxRateDeleted'));
              fetchTaxRates();
            } catch (error) {
              console.error('Error deleting tax rate:', error);
              Alert.alert(t('common.error'), t('invoiceManager.deleteTaxRateError'));
            }
          },
        },
      ]
    );
  };

  const renderTaxRateCard = ({ item }) => (
    <View style={{ backgroundColor: 'white', marginHorizontal: 12, marginVertical: 6, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text }}>
            {item.city}, {item.state_code}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Percent size={16} color={COLORS.blue} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.blue, marginLeft: 6 }}>
              {(() => {
                const rate = parseFloat(item.tax_rate);
                // If rate is already a percentage (> 1), display as-is
                // If rate is a decimal (< 1), convert to percentage
                return rate > 1 ? rate.toFixed(3) : (rate * 100).toFixed(3);
              })()}%
            </Text>
          </View>
          {item.description && (
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 8 }}>
              {item.description}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => handleEditTaxRate(item)}
            style={{ padding: 8, backgroundColor: COLORS.blue + '20', borderRadius: 8 }}
          >
            <Edit2 size={18} color={COLORS.blue} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteTaxRate(item)}
            style={{ padding: 8, backgroundColor: COLORS.red + '20', borderRadius: 8 }}
          >
            <Trash2 size={18} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>{t('taxRates.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text }}>
            {t('taxRates.title')}
          </Text>
          <TouchableOpacity
            onPress={handleAddTaxRate}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.blue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
          >
            <Plus size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>{t('taxRates.addRate')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tax Rate List */}
      <FlatList
        data={taxRates}
        renderItem={renderTaxRateCard}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchTaxRates();
            }}
            tintColor={COLORS.blue}
          />
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
              {t('taxRates.noRates')}
            </Text>
          </View>
        }
      />

      {/* Tax Rate Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
            <View style={{ backgroundColor: 'white', margin: 20, borderRadius: 16, maxHeight: '80%' }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}>
                  {selectedTaxRate ? t('taxRates.editRate') : t('taxRates.addRateTitle')}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={{ padding: 20 }}>
                {/* City */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                    {t('taxRates.cityLabel')}
                  </Text>
                  <TextInput
                    style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text }}
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                    placeholder={t('taxRates.cityPlaceholder')}
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>

                {/* State */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                    {t('taxRates.stateLabel')}
                  </Text>
                  <TextInput
                    style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text }}
                    value={formData.state}
                    onChangeText={(text) => setFormData({ ...formData, state: text.toUpperCase() })}
                    placeholder={t('taxRates.statePlaceholder')}
                    placeholderTextColor={COLORS.textSecondary}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Rate */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                    {t('taxRates.rateLabel')}
                  </Text>
                  <TextInput
                    style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text }}
                    value={formData.rate}
                    onChangeText={(text) => setFormData({ ...formData, rate: text })}
                    placeholder={t('taxRates.ratePlaceholder')}
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Description */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                    {t('taxRates.descriptionLabel')}
                  </Text>
                  <TextInput
                    style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text, minHeight: 80 }}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder={t('taxRates.descriptionPlaceholder')}
                    placeholderTextColor={COLORS.textSecondary}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Footer Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: COLORS.background, alignItems: 'center' }}
                >
                  <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 16 }}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveTaxRate}
                  style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: COLORS.blue, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                    {selectedTaxRate ? t('taxRates.update') : t('taxRates.create')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default TaxRatesScreen;
