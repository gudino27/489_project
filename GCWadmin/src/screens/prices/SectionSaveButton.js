import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Save } from 'lucide-react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants';

const SectionSaveButton = ({
  sectionKey,
  sectionChanges,
  saveStatus,
  onSave,
}) => {
  const { t } = useLanguage();
  const hasChanges = sectionChanges[sectionKey];

  if (!hasChanges) return null;

  return (
    <View style={styles.container}>
      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>
          {t('sectionSave.unsavedWarning')}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          saveStatus === 'saving' && styles.buttonDisabled
        ]}
        onPress={onSave}
        disabled={saveStatus === 'saving'}
      >
        <Save color={COLORS.white} size={16} />
        <Text style={styles.buttonText}>
          {saveStatus === 'saving' ? t('priceManagement.saving') : t('sectionSave.saveChanges')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING[5],
    padding: SPACING[4],
    backgroundColor: '#EFF6FF', // blue-50
    borderWidth: 1,
    borderColor: '#BFDBFE', // blue-200
    borderRadius: RADIUS.md,
    gap: SPACING[2],
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#1E40AF', // blue-700
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.sm,
    gap: SPACING[1],
    minHeight: 44,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  buttonText: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.white,
  },
});

export default SectionSaveButton;
