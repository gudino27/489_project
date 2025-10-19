import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants';
import SectionSaveButton from './SectionSaveButton';

const ColorPricing = ({
  colorPricing,
  setColorPricing,
  markSectionChanged,
  sectionChanges,
  saveStatus,
  onSave,
}) => {
  const { t } = useLanguage();

  const handleColorPriceChange = (count, newValue) => {
    const price = parseFloat(newValue) || 0;
    if (price < 0) {
      Alert.alert('Invalid Price', 'Color pricing cannot be negative. Please enter a positive value.');
      return;
    }
    setColorPricing({ ...colorPricing, [count]: price });
    markSectionChanged('colors');
  };

  const getColorLabel = (count) => {
    switch (count) {
      case '1': return 'Standard (1 Color)';
      case '2': return 'Two-Tone (2 Colors)';
      case '3': return 'Multi-Color (3+ Colors)';
      case 'custom': return 'Custom Colors';
      default: return `${count} Colors`;
    }
  };

  const getColorDescription = (count) => {
    switch (count) {
      case '1': return 'Single color finish - no additional charge';
      case '2': return 'Two different colors/finishes';
      case '3': return 'Three or more colors/finishes';
      case 'custom': return 'Special custom color matching';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Color Pricing</Text>

      <Text style={styles.description}>
        Set additional charges for color upgrades. Standard single-color finish is usually included in base price.
      </Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.priceGrid}>
          {Object.entries(colorPricing).map(([count, price]) => (
            <View key={count} style={styles.colorCard}>
              <Text style={styles.colorLabel}>{getColorLabel(count)}:</Text>
              {getColorDescription(count) && (
                <Text style={styles.colorDescription}>{getColorDescription(count)}</Text>
              )}
              <View style={styles.inputContainer}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.input}
                  value={price?.toString() || '0'}
                  onChangeText={(value) => handleColorPriceChange(count, value)}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.examplesBox}>
          <Text style={styles.examplesTitle}>Color Pricing Examples:</Text>
          <Text style={styles.exampleItem}>• Standard: Natural wood finish - included in base price</Text>
          <Text style={styles.exampleItem}>• Two-Tone: Different color for island vs. perimeter cabinets</Text>
          <Text style={styles.exampleItem}>• Multi-Color: Multiple accent colors or special finishes</Text>
          <Text style={styles.exampleItem}>• Custom: Color matching to specific paint samples or unique finishes</Text>
        </View>
      </ScrollView>

      <SectionSaveButton
        sectionKey="colors"
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
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING[4],
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING[4],
  },
  content: {
    maxHeight: 500,
  },
  priceGrid: {
    gap: SPACING[4],
  },
  colorCard: {
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING[4],
    borderRadius: RADIUS.md,
    marginBottom: SPACING[2],
  },
  colorLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING[1],
  },
  colorDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING[2],
    width: 100,
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
  examplesBox: {
    backgroundColor: '#EFF6FF', // blue-50
    padding: SPACING[4],
    borderRadius: RADIUS.md,
    marginTop: SPACING[4],
  },
  examplesTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#1E40AF', // blue-800
    fontWeight: '600',
    marginBottom: SPACING[2],
  },
  exampleItem: {
    ...TYPOGRAPHY.bodySmall,
    color: '#1D4ED8', // blue-700
    marginBottom: SPACING[1],
  },
});

export default ColorPricing;
