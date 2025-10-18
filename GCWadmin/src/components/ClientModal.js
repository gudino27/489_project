import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const ClientModal = ({ visible, onClose, onSave, client = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        street: client.street || '',
        city: client.city || '',
        state: client.state || '',
        zip: client.zip || '',
        notes: client.notes || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        notes: '',
      });
    }
  }, [client, visible]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Client name is required');
      return;
    }

    onSave(formData);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
          <View style={{ backgroundColor: 'white', margin: 20, borderRadius: 16, maxHeight: '90%' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}>
                {client ? 'Edit Client' : 'Add New Client'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView style={{ padding: 20 }}>
              {/* Name */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                  Client Name *
                </Text>
                <TextInput
                  style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text }}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter client name"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              {/* Email */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                  Email
                </Text>
                <TextInput
                  style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text }}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="client@example.com"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                  Phone
                </Text>
                <TextInput
                  style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text }}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="(555) 555-5555"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Address Section */}
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 8, marginBottom: 12 }}>
                Address
              </Text>

              {/* Street */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                  Street Address
                </Text>
                <TextInput
                  style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text }}
                  value={formData.street}
                  onChangeText={(text) => setFormData({ ...formData, street: text })}
                  placeholder="123 Main St"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              {/* City */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                  City
                </Text>
                <TextInput
                  style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text }}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="City"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              {/* State & Zip */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                    State
                  </Text>
                  <TextInput
                    style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text }}
                    value={formData.state}
                    onChangeText={(text) => setFormData({ ...formData, state: text })}
                    placeholder="CA"
                    placeholderTextColor={COLORS.textSecondary}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                    ZIP Code
                  </Text>
                  <TextInput
                    style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text }}
                    value={formData.zip}
                    onChangeText={(text) => setFormData({ ...formData, zip: text })}
                    placeholder="12345"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                  Notes
                </Text>
                <TextInput
                  style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text, minHeight: 80 }}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Additional notes..."
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <TouchableOpacity
                onPress={onClose}
                style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: COLORS.background, alignItems: 'center' }}
              >
                <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: COLORS.blue, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                  {client ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ClientModal;
