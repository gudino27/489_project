import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Phone, Send } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const SmsRoutingScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');

  const handleTestSms = () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      Alert.alert('Error', 'Please enter both phone number and message');
      return;
    }
    Alert.alert('Test SMS', 'SMS test functionality will be implemented');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text }}>
          SMS Routing Manager
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
          Configure SMS routing and testing
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={COLORS.blue} />
        }
      >
        {/* Test SMS Section */}
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <MessageCircle size={24} color={COLORS.blue} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginLeft: 8 }}>
              Test SMS
            </Text>
          </View>

          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
            Phone Number
          </Text>
          <TextInput
            style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text, marginBottom: 16 }}
            value={testPhone}
            onChangeText={setTestPhone}
            placeholder="(555) 555-5555"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="phone-pad"
          />

          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
            Message
          </Text>
          <TextInput
            style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text, minHeight: 100, marginBottom: 16 }}
            value={testMessage}
            onChangeText={setTestMessage}
            placeholder="Enter test message..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            onPress={handleTestSms}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.blue, padding: 14, borderRadius: 8 }}
          >
            <Send size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>
              Send Test SMS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Routing Config */}
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Phone size={24} color={COLORS.primary} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginLeft: 8 }}>
              Routing Configuration
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>
            SMS routing settings will appear here
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SmsRoutingScreen;
