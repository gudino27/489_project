import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants';
import { ContentGlass } from '../../components/GlassView';
import { useLanguage } from '../../contexts/LanguageContext';

const WallsPricingScreen = () => {
  const { t } = useLanguage();
  const [wallTypes, setWallTypes] = useState([
    { id: 1, type: t('priceManagement.wallTypes.standardDrywall'), price: '45', unit: 'per sq ft', description: t('priceManagement.wallTypes.standardDrywallDesc') },
    { id: 2, type: t('priceManagement.wallTypes.backsplashTile'), price: '85', unit: 'per sq ft', description: t('priceManagement.wallTypes.backsplashTileDesc') },
    { id: 3, type: t('priceManagement.wallTypes.glassBacksplash'), price: '120', unit: 'per sq ft', description: t('priceManagement.wallTypes.glassBacksplashDesc') },
    { id: 4, type: t('priceManagement.wallTypes.stoneBacksplash'), price: '150', unit: 'per sq ft', description: t('priceManagement.wallTypes.stoneBacksplashDesc') },
    { id: 5, type: t('priceManagement.wallTypes.accentWall'), price: '65', unit: 'per sq ft', description: t('priceManagement.wallTypes.accentWallDesc') },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditPrice(item.price);
  };

  const handleSave = (id) => {
    setWallTypes(prevData =>
      prevData.map(item =>
        item.id === id ? { ...item, price: editPrice } : item
      )
    );
    setEditingId(null);
    setEditPrice('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditPrice('');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <ContentGlass style={styles.infoCard}>
          <Text style={styles.infoTitle}>Wall & Backsplash Pricing</Text>
          <Text style={styles.infoText}>
            Set prices for different wall finishes and backsplash options. Prices are per square foot installed.
          </Text>
        </ContentGlass>

        {/* Wall Type List */}
        {wallTypes.map((item) => (
          <ContentGlass key={item.id} style={styles.wallCard}>
            <View style={styles.wallHeader}>
              <View style={styles.wallInfo}>
                <Text style={styles.wallType}>{item.type}</Text>
                <Text style={styles.wallDescription}>{item.description}</Text>
              </View>
              {editingId !== item.id && (
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {editingId === item.id ? (
              <View style={styles.editContainer}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={editPrice}
                    onChangeText={setEditPrice}
                    keyboardType="decimal-pad"
                    placeholder={t('priceManagement.placeholders.price')}
                    autoFocus
                  />
                  <Text style={styles.unitText}>/ {item.unit}</Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleSave(item.id)} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.priceDisplay}>
                <Text style={styles.priceValue}>${item.price}</Text>
                <Text style={styles.priceUnit}>/ {item.unit}</Text>
              </View>
            )}
          </ContentGlass>
        ))}

        {/* Add New Button */}
        <TouchableOpacity style={styles.addButton}>
          <ContentGlass style={styles.addButtonInner}>
            <Text style={styles.addButtonText}>+ Add Wall Type</Text>
          </ContentGlass>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING[4],
    paddingBottom: SPACING[8],
  },
  infoCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
    borderRadius: RADIUS.xl,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  infoText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed * TYPOGRAPHY.sm,
  },
  wallCard: {
    padding: SPACING[4],
    marginBottom: SPACING[3],
    borderRadius: RADIUS.xl,
  },
  wallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
  },
  wallInfo: {
    flex: 1,
  },
  wallType: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  wallDescription: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  editButton: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    marginRight: SPACING[2],
  },
  priceUnit: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  editContainer: {
    gap: SPACING[3],
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
  },
  dollarSign: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginRight: SPACING[1],
  },
  priceInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    padding: 0,
  },
  unitText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginLeft: SPACING[2],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  addButton: {
    marginTop: SPACING[2],
  },
  addButtonInner: {
    padding: SPACING[4],
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.primary,
  },
});

export default WallsPricingScreen;
