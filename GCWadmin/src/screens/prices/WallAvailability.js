import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants';
import SectionSaveButton from './SectionSaveButton';

const WallAvailability = ({
  wallAvailability,
  setWallAvailability,
  markSectionChanged,
  userRole,
  sectionChanges,
  saveStatus,
  onSave,
}) => {
  const { t } = useLanguage();

  const handleAvailabilityChange = (type, newStatus) => {
    setWallAvailability({ ...wallAvailability, [type]: newStatus });
    markSectionChanged('wallAvailability');
  };

  // Only show this component for super admins
  if (userRole !== 'super_admin') {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('pricing.wallAvailability.title')}</Text>

      <Text style={styles.description}>
        {t('pricing.wallAvailability.description')}
      </Text>

      <View style={styles.servicesContainer}>
        {/* Add Wall Service */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>{t('pricing.wallAvailability.addWallService')}</Text>
            <Text style={styles.serviceDescription}>
              {t('pricing.wallAvailability.addWallDesc')}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              wallAvailability.addWallEnabled ? styles.toggleButtonEnabled : styles.toggleButtonDisabled
            ]}
            onPress={() => handleAvailabilityChange('addWallEnabled', !wallAvailability.addWallEnabled)}
          >
            <Text style={styles.toggleButtonText}>
              {wallAvailability.addWallEnabled ? t('pricing.wallAvailability.enabled') : t('pricing.wallAvailability.disabled')}
            </Text>
          </TouchableOpacity>
          {!wallAvailability.addWallEnabled && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {t('pricing.wallAvailability.addDisabledWarning')}
              </Text>
            </View>
          )}
        </View>

        {/* Remove Wall Service */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>{t('pricing.wallAvailability.removeWallService')}</Text>
            <Text style={styles.serviceDescription}>
              {t('pricing.wallAvailability.removeWallDesc')}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              wallAvailability.removeWallEnabled ? styles.toggleButtonEnabled : styles.toggleButtonDisabled
            ]}
            onPress={() => handleAvailabilityChange('removeWallEnabled', !wallAvailability.removeWallEnabled)}
          >
            <Text style={styles.toggleButtonText}>
              {wallAvailability.removeWallEnabled ? t('pricing.wallAvailability.enabled') : t('pricing.wallAvailability.disabled')}
            </Text>
          </TouchableOpacity>
          {!wallAvailability.removeWallEnabled && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {t('pricing.wallAvailability.removeDisabledWarning')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.footerNote}>
        {t('pricing.wallAvailability.footerNote')}
      </Text>

      <SectionSaveButton
        sectionKey="wallAvailability"
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
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.info,
    marginBottom: SPACING[4],
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING[5],
  },
  servicesContainer: {
    gap: SPACING[4],
  },
  serviceCard: {
    backgroundColor: '#EFF6FF', // blue-50
    padding: SPACING[4],
    borderRadius: RADIUS.md,
  },
  serviceInfo: {
    marginBottom: SPACING[4],
  },
  serviceTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#1E3A8A', // blue-900
    fontWeight: '600',
    marginBottom: SPACING[1],
  },
  serviceDescription: {
    ...TYPOGRAPHY.caption,
    color: '#1D4ED8', // blue-700
  },
  toggleButton: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleButtonEnabled: {
    backgroundColor: COLORS.success,
  },
  toggleButtonDisabled: {
    backgroundColor: COLORS.error,
  },
  toggleButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: '600',
  },
  warningBox: {
    marginTop: SPACING[2],
    padding: SPACING[2],
    backgroundColor: '#FEE2E2', // red-100
    borderRadius: RADIUS.sm,
  },
  warningText: {
    ...TYPOGRAPHY.caption,
    color: '#991B1B', // red-800
  },
  footerNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING[4],
  },
});

export default WallAvailability;
