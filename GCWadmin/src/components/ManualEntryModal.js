import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Clock, Calendar as CalendarIcon, Save } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { ContentGlass } from './GlassView';

const ManualEntryModal = ({
  visible,
  onClose,
  manualEntry,
  onEntryChange,
  onSubmit,
  submitting
}) => {
  const { t } = useLanguage();

  const handleSubmit = () => {
    // Validation
    if (!manualEntry.date) {
      Alert.alert(t('common.error'), t('timeclock.date_required'));
      return;
    }
    if (!manualEntry.timeIn) {
      Alert.alert(t('common.error'), t('timeclock.time_in_required'));
      return;
    }
    if (!manualEntry.timeOut) {
      Alert.alert(t('common.error'), t('timeclock.time_out_required'));
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(manualEntry.timeIn)) {
      Alert.alert(t('common.error'), t('timeclock.invalid_time_format'));
      return;
    }
    if (!timeRegex.test(manualEntry.timeOut)) {
      Alert.alert(t('common.error'), t('timeclock.invalid_time_format'));
      return;
    }

    // Validate that time out is after time in
    const [inHour, inMin] = manualEntry.timeIn.split(':').map(Number);
    const [outHour, outMin] = manualEntry.timeOut.split(':').map(Number);
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;

    if (outMinutes <= inMinutes) {
      Alert.alert(t('common.error'), t('timeclock.time_out_must_be_after_time_in'));
      return;
    }

    onSubmit();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ContentGlass style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <Clock size={24} color={COLORS.accent} />
                <Text style={styles.modalTitle}>{t('timeclock.add_manual_entry')}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Date Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <CalendarIcon size={16} color={COLORS.accent} /> {t('timeclock.date')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={manualEntry.date}
                  onChangeText={(text) => onEntryChange('date', text)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textLight}
                />
                <Text style={styles.helperText}>{t('timeclock.date_format_helper')}</Text>
              </View>

              {/* Time In Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Clock size={16} color={COLORS.accent} /> {t('timeclock.time_in')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={manualEntry.timeIn}
                  onChangeText={(text) => onEntryChange('timeIn', text)}
                  placeholder="HH:MM (24-hour format)"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numbers-and-punctuation"
                />
                <Text style={styles.helperText}>{t('timeclock.time_format_helper')}</Text>
              </View>

              {/* Time Out Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Clock size={16} color={COLORS.accent} /> {t('timeclock.time_out')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={manualEntry.timeOut}
                  onChangeText={(text) => onEntryChange('timeOut', text)}
                  placeholder="HH:MM (24-hour format)"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              {/* Break Minutes Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('timeclock.break_minutes')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={manualEntry.breakMinutes.toString()}
                  onChangeText={(text) => onEntryChange('breakMinutes', text)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
              </View>

              {/* Notes Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('timeclock.notes')} ({t('common.optional')})
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={manualEntry.notes}
                  onChangeText={(text) => onEntryChange('notes', text)}
                  placeholder={t('timeclock.notes_placeholder')}
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.submitButton, submitting && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <>
                      <Save size={16} color={COLORS.background} />
                      <Text style={styles.submitButtonText}>{t('timeclock.submit_entry')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </ContentGlass>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalContent: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING[4],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[4],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING[2],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glassDark,
  },
  modalBody: {
    maxHeight: 600,
  },
  inputGroup: {
    marginBottom: SPACING[4],
  },
  label: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  input: {
    backgroundColor: COLORS.glassDark,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  textArea: {
    minHeight: 100,
  },
  helperText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginTop: SPACING[4],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    padding: SPACING[3],
    borderRadius: RADIUS.lg,
  },
  cancelButton: {
    backgroundColor: COLORS.glassDark,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.background,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ManualEntryModal;
