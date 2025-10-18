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

const ColorsPricingScreen = () => {
  const [colors, setColors] = useState([
    { id: 1, name: 'White', hex: '#FFFFFF', multiplier: '1.0', category: 'Standard' },
    { id: 2, name: 'Black', hex: '#000000', multiplier: '1.05', category: 'Standard' },
    { id: 3, name: 'Gray', hex: '#808080', multiplier: '1.0', category: 'Standard' },
    { id: 4, name: 'Navy Blue', hex: '#000080', multiplier: '1.10', category: 'Premium' },
    { id: 5, name: 'Forest Green', hex: '#228B22', multiplier: '1.15', category: 'Premium' },
    { id: 6, name: 'Espresso', hex: '#4B2E2A', multiplier: '1.08', category: 'Standard' },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editMultiplier, setEditMultiplier] = useState('');

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditMultiplier(item.multiplier);
  };

  const handleSave = (id) => {
    setColors(prevData =>
      prevData.map(item =>
        item.id === id ? { ...item, multiplier: editMultiplier } : item
      )
    );
    setEditingId(null);
    setEditMultiplier('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditMultiplier('');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <ContentGlass style={styles.infoCard}>
          <Text style={styles.infoTitle}>Color Multipliers</Text>
          <Text style={styles.infoText}>
            Set price multipliers for different cabinet colors. Premium colors typically have higher multipliers.
          </Text>
        </ContentGlass>

        {/* Color List */}
        {colors.map((item) => (
          <ContentGlass key={item.id} style={styles.colorCard}>
            <View style={styles.colorHeader}>
              <View style={styles.colorInfo}>
                <View style={styles.colorNameRow}>
                  <View style={[styles.colorSwatch, { backgroundColor: item.hex }]} />
                  <View>
                    <Text style={styles.colorName}>{item.name}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {editingId !== item.id && (
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {editingId === item.id ? (
              <View style={styles.editContainer}>
                <View style={styles.multiplierInputContainer}>
                  <Text style={styles.multiplySign}>×</Text>
                  <TextInput
                    style={styles.multiplierInput}
                    value={editMultiplier}
                    onChangeText={setEditMultiplier}
                    keyboardType="decimal-pad"
                    placeholder="1.0"
                    autoFocus
                  />
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
              <View style={styles.multiplierDisplay}>
                <Text style={styles.multiplySymbol}>×</Text>
                <Text style={styles.multiplierValue}>{item.multiplier}</Text>
                <View style={[
                  styles.percentageBadge,
                  { backgroundColor: parseFloat(item.multiplier) > 1.0 ? COLORS.warning : COLORS.success }
                ]}>
                  <Text style={styles.percentageText}>
                    {((parseFloat(item.multiplier) - 1) * 100).toFixed(0) >= 0 ? '+' : ''}
                    {((parseFloat(item.multiplier) - 1) * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            )}
          </ContentGlass>
        ))}

        {/* Add New Button */}
        <TouchableOpacity style={styles.addButton}>
          <ContentGlass style={styles.addButtonInner}>
            <Text style={styles.addButtonText}>+ Add Color</Text>
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
  colorCard: {
    padding: SPACING[4],
    marginBottom: SPACING[3],
    borderRadius: RADIUS.xl,
  },
  colorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
  },
  colorInfo: {
    flex: 1,
  },
  colorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.gray200,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
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
  multiplierDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiplySymbol: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textMuted,
    marginRight: SPACING[2],
  },
  multiplierValue: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    marginRight: SPACING[3],
  },
  percentageBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.lg,
  },
  percentageText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  editContainer: {
    gap: SPACING[3],
  },
  multiplierInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
  },
  multiplySign: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginRight: SPACING[2],
  },
  multiplierInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    padding: 0,
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

export default ColorsPricingScreen;
