import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants';
import SectionSaveButton from './SectionSaveButton';

const WallPricing = ({
  wallPricing,
  setWallPricing,
  markSectionChanged,
  sectionChanges,
  saveStatus,
  onSave,
}) => {
  const { t } = useLanguage();

  const handleWallPriceChange = (type, newValue) => {
    const price = parseFloat(newValue) || 0;
    if (price < 0) {
      Alert.alert(t('pricing.walls.invalidPrice'), t('pricing.walls.negativeError'));
      return;
    }
    setWallPricing({ ...wallPricing, [type]: price });
    markSectionChanged('walls');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('pricing.walls.title')}</Text>

      <Text style={styles.description}>
        {t('pricing.walls.description')}
      </Text>

      <View style={styles.priceGrid}>
        <View style={styles.inputRow}>
          <Text style={styles.label}>{t('pricing.walls.addWallOpening')}</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.input}
              value={wallPricing.addWall?.toString() || '0'}
              onChangeText={(value) => handleWallPriceChange('addWall', value)}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>{t('pricing.walls.removeWall')}</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.input}
              value={wallPricing.removeWall?.toString() || '0'}
              onChangeText={(value) => handleWallPriceChange('removeWall', value)}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>
      </View>

      <View style={styles.examplesBox}>
        <Text style={styles.examplesTitle}>{t('pricing.walls.examplesTitle')}</Text>
        <Text style={styles.exampleItem}>{t('pricing.walls.example1')}</Text>
        <Text style={styles.exampleItem}>{t('pricing.walls.example2')}</Text>
      </View>

      <SectionSaveButton
        sectionKey="walls"
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
    marginBottom: SPACING[5],
  },
  priceGrid: {
    gap: SPACING[5],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  examplesBox: {
    backgroundColor: '#EFF6FF', // blue-50
    padding: SPACING[4],
    borderRadius: RADIUS.md,
    marginTop: SPACING[5],
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

export default WallPricing;
