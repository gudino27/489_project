import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/colors';

const SMSSendModal = ({
  visible,
  invoice,
  onClose,
  onSend,
  sending,
}) => {
  const [useCustomPhone, setUseCustomPhone] = React.useState(false);
  const [customPhoneNumber, setCustomPhoneNumber] = React.useState('');
  const [message, setMessage] = React.useState('');

  if (!invoice) return null;

  const clientName = invoice.is_business
    ? invoice.company_name
    : `${invoice.first_name} ${invoice.last_name}`;

  const handleSend = () => {
    const smsData = {
      phone: useCustomPhone ? customPhoneNumber : invoice.phone,
      message,
    };
    onSend(smsData);
  };

  const characterCount = message.length;
  const maxCharacters = 160;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💬 Send Invoice via SMS</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Invoice Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Invoice: <Text style={styles.infoValue}>{invoice.invoice_number}</Text></Text>
              <Text style={styles.infoLabel}>Client: <Text style={styles.infoValue}>{clientName}</Text></Text>
              <Text style={styles.infoLabel}>Phone: <Text style={styles.infoValue}>{invoice.phone || 'Not provided'}</Text></Text>
            </View>

            {/* Phone Number Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phone Number</Text>
              <View style={styles.phoneCard}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setUseCustomPhone(false)}
                >
                  <View style={[styles.radio, !useCustomPhone && styles.radioSelected]} />
                  <Text style={styles.radioLabel}>Client Phone: {invoice.phone || 'None'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setUseCustomPhone(true)}
                >
                  <View style={[styles.radio, useCustomPhone && styles.radioSelected]} />
                  <Text style={styles.radioLabel}>Use Custom Phone Number</Text>
                </TouchableOpacity>

                {useCustomPhone && (
                  <View style={styles.customPhoneContainer}>
                    <Text style={styles.helperText}>Enter a different phone number to send SMS</Text>
                    <TextInput
                      style={styles.input}
                      value={customPhoneNumber}
                      onChangeText={setCustomPhoneNumber}
                      placeholder="e.g., (509) 790-3516"
                      keyboardType="phone-pad"
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Message */}
            <View style={styles.section}>
              <View style={styles.messageHeader}>
                <Text style={styles.sectionTitle}>Message</Text>
                <Text style={[styles.charCount, characterCount > 140 && styles.charCountWarning]}>
                  {characterCount}/{maxCharacters}
                </Text>
              </View>
              <TextInput
                style={styles.textArea}
                value={message}
                onChangeText={setMessage}
                placeholder="Add a personal message..."
                multiline
                numberOfLines={4}
                maxLength={maxCharacters}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>
                SMS messages are limited to {maxCharacters} characters
              </Text>
            </View>

            {/* Preview */}
            {message.trim() && (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>📱 Message Preview:</Text>
                <View style={styles.previewBubble}>
                  <Text style={styles.previewText}>{message}</Text>
                  <Text style={styles.previewLink}>View invoice: [Link will be inserted]</Text>
                </View>
              </View>
            )}

            {/* Warning if no phone */}
            {!invoice.phone && !useCustomPhone && (
              <View style={styles.warningCard}>
                <Text style={styles.warningTitle}>⚠️ No Phone Number</Text>
                <Text style={styles.warningText}>
                  This client has no phone number on file. Please select "Use Custom Phone Number" to send SMS.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onClose}
              disabled={sending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.sendButton]}
              onPress={handleSend}
              disabled={sending || (!invoice.phone && !useCustomPhone) || (useCustomPhone && !customPhoneNumber.trim())}
            >
              {sending ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.sendButtonText}>📤 Send SMS</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.textLight,
  },
  modalContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  phoneCard: {
    backgroundColor: COLORS.warning + '10',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  customPhoneContainer: {
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  charCountWarning: {
    color: COLORS.error,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  previewBubble: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  previewLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: COLORS.warning + '20',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.text,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: COLORS.primary,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SMSSendModal;
