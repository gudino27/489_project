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
      Alert.alert('Invalid Price', 'Wall pricing cannot be negative. Please enter a positive value.');
      return;
    }
    setWallPricing({ ...wallPricing, [type]: price });
    markSectionChanged('walls');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Wall Modification Pricing</Text>

      <Text style={styles.description}>
        Set pricing for custom wall configurations. These costs apply when customers add or remove walls for open floor plans.
      </Text>

      <View style={styles.priceGrid}>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Add Wall Opening:</Text>
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
          <Text style={styles.label}>Remove Wall:</Text>
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
        <Text style={styles.examplesTitle}>Wall Modification Examples:</Text>
        <Text style={styles.exampleItem}>• Add Wall Opening: Creating a pass-through between kitchen and other rooms</Text>
        <Text style={styles.exampleItem}>• Remove Wall: Full wall removal for open concept design</Text>
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
    padding: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  priceGrid: {
    gap: SPACING.lg,
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
    paddingHorizontal: SPACING.sm,
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
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  examplesBox: {
    backgroundColor: '#EFF6FF', // blue-50
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  examplesTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#1E40AF', // blue-800
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  exampleItem: {
    ...TYPOGRAPHY.bodySmall,
    color: '#1D4ED8', // blue-700
    marginBottom: SPACING.xs,
  },
});

export default WallPricing;
