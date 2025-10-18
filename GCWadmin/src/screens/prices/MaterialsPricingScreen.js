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

const MaterialsPricingScreen = () => {
  const [materials, setMaterials] = useState([
    { id: 1, name: 'MDF', multiplier: '1.0', description: 'Base material' },
    { id: 2, name: 'Plywood', multiplier: '1.15', description: 'Premium durability' },
    { id: 3, name: 'Solid Wood', multiplier: '1.35', description: 'Highest quality' },
    { id: 4, name: 'Thermofoil', multiplier: '1.05', description: 'Easy maintenance' },
    { id: 5, name: 'Laminate', multiplier: '0.95', description: 'Budget friendly' },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editMultiplier, setEditMultiplier] = useState('');

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditMultiplier(item.multiplier);
  };

  const handleSave = (id) => {
    setMaterials(prevData =>
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
          <Text style={styles.infoTitle}>Material Multipliers</Text>
          <Text style={styles.infoText}>
            Set price multipliers for different cabinet materials. The final price is calculated as: Base Cabinet Price × Material Multiplier × Color Multiplier.
          </Text>
        </ContentGlass>

        {/* Material List */}
        {materials.map((item) => (
          <ContentGlass key={item.id} style={styles.materialCard}>
            <View style={styles.materialHeader}>
              <View style={styles.materialInfo}>
                <Text style={styles.materialName}>{item.name}</Text>
                <Text style={styles.materialDescription}>{item.description}</Text>
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
                <View style={styles.percentageBadge}>
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
            <Text style={styles.addButtonText}>+ Add Material</Text>
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
  materialCard: {
    padding: SPACING[4],
    marginBottom: SPACING[3],
    borderRadius: RADIUS.xl,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  materialDescription: {
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
    backgroundColor: COLORS.success,
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

export default MaterialsPricingScreen;
