import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { DollarSign, Home, Bath } from 'lucide-react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants';
import SectionSaveButton from './SectionSaveButton';

const CabinetPricing = ({
  basePrices,
  setBasePrices,
  markSectionChanged,
  sectionChanges,
  saveStatus,
  onSave,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('kitchen');

  // Kitchen cabinet types
  const kitchenTypes = [
    'base', 'sink-base', 'wall', 'tall', 'corner', 'drawer-base',
    'double-drawer-base', 'glass-wall', 'open-shelf', 'island-base',
    'peninsula-base', 'pantry', 'corner-wall', 'lazy-susan',
    'blind-corner', 'appliance-garage', 'wine-rack', 'spice-rack',
    'tray-divider', 'pull-out-drawer', 'soft-close-drawer', 'under-cabinet-lighting'
  ];

  // Bathroom cabinet types
  const bathroomTypes = [
    'vanity', 'vanity-sink', 'double-vanity', 'floating-vanity', 'corner-vanity',
    'vanity-tower', 'medicine', 'medicine-mirror', 'linen', 'linen-tower',
    'wall-hung-vanity', 'vessel-sink-vanity', 'undermount-sink-vanity',
    'powder-room-vanity', 'master-bath-vanity', 'kids-bathroom-vanity',
    'toilet', 'bathtub', 'shower'
  ];

  const getKitchenCabinets = () => {
    return Object.entries(basePrices).filter(([type]) => kitchenTypes.includes(type));
  };

  const getBathroomCabinets = () => {
    return Object.entries(basePrices).filter(([type]) => bathroomTypes.includes(type));
  };

  const handlePriceChange = (type, newValue) => {
    const price = parseFloat(newValue) || 0;
    if (price < 0) {
      Alert.alert(t('pricing.cabinets.invalidPrice'), t('pricing.cabinets.negativeError'));
      return;
    }
    setBasePrices({ ...basePrices, [type]: price });
    markSectionChanged('cabinets');
  };

  const formatLabel = (type) => {
    return type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const renderPriceInput = ([type, price]) => (
    <View key={type} style={styles.inputRow}>
      <Text style={styles.label}>{formatLabel(type)}:</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.input}
          value={price?.toString() || '0'}
          onChangeText={(value) => handlePriceChange(type, value)}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'kitchen' && styles.tabActiveKitchen
          ]}
          onPress={() => setActiveTab('kitchen')}
        >
          <Home
            color={activeTab === 'kitchen' ? COLORS.info : COLORS.textSecondary}
            size={16}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'kitchen' && styles.tabTextActiveKitchen
          ]}>
            {t('pricing.cabinets.kitchen')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'bathroom' && styles.tabActiveBathroom
          ]}
          onPress={() => setActiveTab('bathroom')}
        >
          <Bath
            color={activeTab === 'bathroom' ? COLORS.purple : COLORS.textSecondary}
            size={16}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'bathroom' && styles.tabTextActiveBathroom
          ]}>
            {t('pricing.cabinets.bathroom')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Kitchen Tab Content */}
      {activeTab === 'kitchen' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Home color={COLORS.info} size={16} />
            <Text style={[styles.sectionTitle, { color: COLORS.info }]}>
              {t('pricing.cabinets.kitchenCabinets')}
            </Text>
          </View>
          <View style={styles.priceGrid}>
            {getKitchenCabinets().map(renderPriceInput)}
          </View>
        </ScrollView>
      )}

      {/* Bathroom Tab Content */}
      {activeTab === 'bathroom' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Bath color={COLORS.purple} size={16} />
            <Text style={[styles.sectionTitle, { color: COLORS.purple }]}>
              {t('pricing.cabinets.bathroomCabinets')}
            </Text>
          </View>
          <View style={styles.priceGrid}>
            {getBathroomCabinets().map(renderPriceInput)}
          </View>
        </ScrollView>
      )}

      {/* Section Save Button */}
      <SectionSaveButton
        sectionKey="cabinets"
        sectionChanges={sectionChanges}
        saveStatus={saveStatus}
        onSave={onSave}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING[4],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING[5],
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.sm,
    gap: SPACING[1],
  },
  tabActiveKitchen: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabActiveBathroom: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  tabTextActiveKitchen: {
    color: COLORS.info,
    fontWeight: '600',
  },
  tabTextActiveBathroom: {
    color: COLORS.purple,
    fontWeight: '600',
  },
  content: {
    maxHeight: 500,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
  },
  priceGrid: {
    gap: SPACING[4],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING[2],
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING[2],
    minWidth: 100,
  },
  dollarSign: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  input: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    paddingVertical: SPACING[2],
    minHeight: 44,
  },
});

export default CabinetPricing;
