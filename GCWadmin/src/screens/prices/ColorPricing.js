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
      Alert.alert(t('pricing.colors.invalidPrice'), t('pricing.colors.negativeError'));
      return;
    }
    setColorPricing({ ...colorPricing, [count]: price });
    markSectionChanged('colors');
  };

  const getColorLabel = (count) => {
    switch (count) {
      case '1': return t('pricing.colors.standard');
      case '2': return t('pricing.colors.twoTone');
      case '3': return t('pricing.colors.multiColor');
      case 'custom': return t('pricing.colors.custom');
      default: return `${count} Colors`;
    }
  };

  const getColorDescription = (count) => {
    switch (count) {
      case '1': return t('pricing.colors.standardDesc');
      case '2': return t('pricing.colors.twoToneDesc');
      case '3': return t('pricing.colors.multiColorDesc');
      case 'custom': return t('pricing.colors.customDesc');
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('pricing.colors.title')}</Text>

      <Text style={styles.description}>
        {t('pricing.colors.description')}
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
          <Text style={styles.examplesTitle}>{t('pricing.colors.examplesTitle')}</Text>
          <Text style={styles.exampleItem}>{t('pricing.colors.example1')}</Text>
          <Text style={styles.exampleItem}>{t('pricing.colors.example2')}</Text>
          <Text style={styles.exampleItem}>{t('pricing.colors.example3')}</Text>
          <Text style={styles.exampleItem}>{t('pricing.colors.example4')}</Text>
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
