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

const EmailSendModal = ({
  visible,
  invoice,
  onClose,
  onSend,
  sending,
}) => {
  const [selectedLanguage, setSelectedLanguage] = React.useState('english');
  const [sendToSelf, setSendToSelf] = React.useState(false);
  const [selfEmail, setSelfEmail] = React.useState('');
  const [useCustomClientEmail, setUseCustomClientEmail] = React.useState(false);
  const [customClientEmail, setCustomClientEmail] = React.useState('');
  const [additionalEmails, setAdditionalEmails] = React.useState(['']);
  const [message, setMessage] = React.useState('');

  if (!invoice) return null;

  const clientName = invoice.is_business
    ? invoice.company_name
    : `${invoice.first_name} ${invoice.last_name}`;

  const handleSend = () => {
    const emailData = {
      language: selectedLanguage,
      message,
      sendToSelf,
      selfEmail: sendToSelf ? selfEmail : '',
      additionalEmails: additionalEmails.filter(email => email.trim() !== ''),
      useCustomClientEmail,
      customClientEmail: useCustomClientEmail ? customClientEmail : '',
    };
    onSend(emailData);
  };

  const addAdditionalEmail = () => {
    if (additionalEmails.length < 5) {
      setAdditionalEmails([...additionalEmails, '']);
    }
  };

  const updateAdditionalEmail = (index, value) => {
    const newEmails = [...additionalEmails];
    newEmails[index] = value;
    setAdditionalEmails(newEmails);
  };

  const removeAdditionalEmail = (index) => {
    const newEmails = additionalEmails.filter((_, i) => i !== index);
    setAdditionalEmails(newEmails.length === 0 ? [''] : newEmails);
  };

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
            <Text style={styles.modalTitle}>Send Invoice via Email</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Invoice Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Invoice: <Text style={styles.infoValue}>{invoice.invoice_number}</Text></Text>
              <Text style={styles.infoLabel}>Client: <Text style={styles.infoValue}>{clientName}</Text></Text>
              <Text style={styles.infoLabel}>Email: <Text style={styles.infoValue}>{invoice.email}</Text></Text>
            </View>

            {/* Primary Recipient */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Primary Recipient (Client)</Text>
              <View style={styles.recipientCard}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setUseCustomClientEmail(false)}
                >
                  <View style={[styles.radio, !useCustomClientEmail && styles.radioSelected]} />
                  <Text style={styles.radioLabel}>Client Email: {invoice.email}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setUseCustomClientEmail(true)}
                >
                  <View style={[styles.radio, useCustomClientEmail && styles.radioSelected]} />
                  <Text style={styles.radioLabel}>Use Custom Email</Text>
                </TouchableOpacity>

                {useCustomClientEmail && (
                  <TextInput
                    style={styles.input}
                    value={customClientEmail}
                    onChangeText={setCustomClientEmail}
                    placeholder="Enter custom email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              </View>
            </View>

            {/* Send to Self */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => setSendToSelf(!sendToSelf)}
              >
                <View style={[styles.checkbox, sendToSelf && styles.checkboxSelected]}>
                  {sendToSelf && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Send copy to myself</Text>
              </TouchableOpacity>

              {sendToSelf && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={selfEmail}
                  onChangeText={setSelfEmail}
                  placeholder="Your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            </View>

            {/* Additional Recipients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Recipients</Text>
              {additionalEmails.map((email, index) => (
                <View key={index} style={styles.additionalEmailRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={email}
                    onChangeText={(text) => updateAdditionalEmail(index, text)}
                    placeholder="Additional email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {additionalEmails.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeAdditionalEmail(index)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {additionalEmails.length < 5 && (
                <TouchableOpacity
                  onPress={addAdditionalEmail}
                  style={styles.addButton}
                >
                  <Text style={styles.addButtonText}>+ Add Email</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Language Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌐 Language</Text>
              <View style={styles.languageButtons}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    selectedLanguage === 'english' && styles.languageButtonSelected,
                  ]}
                  onPress={() => setSelectedLanguage('english')}
                >
                  <Text
                    style={[
                      styles.languageButtonText,
                      selectedLanguage === 'english' && styles.languageButtonTextSelected,
                    ]}
                  >
                    English
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    selectedLanguage === 'spanish' && styles.languageButtonSelected,
                  ]}
                  onPress={() => setSelectedLanguage('spanish')}
                >
                  <Text
                    style={[
                      styles.languageButtonText,
                      selectedLanguage === 'spanish' && styles.languageButtonTextSelected,
                    ]}
                  >
                    Español
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Message */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Message (Optional)</Text>
              <TextInput
                style={styles.textArea}
                value={message}
                onChangeText={setMessage}
                placeholder={
                  selectedLanguage === 'spanish'
                    ? 'Agregue un mensaje personal para incluir con la factura...'
                    : 'Add a personal message to include with the invoice...'
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
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
              disabled={sending || (sendToSelf && !selfEmail.trim()) || (useCustomClientEmail && !customClientEmail.trim())}
            >
              {sending ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.sendButtonText}>📧 Send Email</Text>
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
  recipientCard: {
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
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
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  additionalEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  removeButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: COLORS.error + '20',
    borderRadius: 6,
  },
  removeButtonText: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  languageButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  languageButtonTextSelected: {
    color: COLORS.white,
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

export default EmailSendModal;
