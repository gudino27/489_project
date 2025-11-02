import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Settings, Plus, Edit2, Trash2, Check, X } from 'lucide-react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants';
import { ContentGlass } from '../../components/GlassView';
import SectionSaveButton from './SectionSaveButton';

const MaterialMultipliers = ({
  materialMultipliers,
  setMaterialMultipliers,
  markSectionChanged,
  updateSharedMaterials,
  refreshPricing,
  sectionChanges,
  saveStatus,
  onSave,
}) => {
  const { t } = useLanguage();
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    nameEn: '',
    nameEs: '',
    multiplier: '1.0'
  });
  const [editingMaterial, setEditingMaterial] = useState(null);

  const handleAddMaterial = () => {
    if (!newMaterial.nameEn || !newMaterial.nameEs || parseFloat(newMaterial.multiplier) <= 0) {
      Alert.alert(t('pricing.materials.invalidInput'), t('pricing.materials.namesRequired'));
      return;
    }

    const tempId = Date.now() + Math.random();
    const newMaterialObj = {
      id: tempId,
      nameEn: newMaterial.nameEn,
      nameEs: newMaterial.nameEs,
      multiplier: parseFloat(newMaterial.multiplier),
      isTemporary: true
    };

    const updatedMaterials = [...materialMultipliers, newMaterialObj];
    setMaterialMultipliers(updatedMaterials);
    setNewMaterial({ nameEn: '', nameEs: '', multiplier: '1.0' });
    setShowMaterialForm(false);
    markSectionChanged('materials');

    updateSharedMaterials(updatedMaterials);
    refreshPricing();
  };

  const handleUpdateMaterial = () => {
    if (!editingMaterial || !editingMaterial.nameEn || !editingMaterial.nameEs || parseFloat(editingMaterial.multiplier) <= 0) {
      Alert.alert(t('pricing.materials.invalidInput'), t('pricing.materials.validValuesRequired'));
      return;
    }

    const updated = materialMultipliers.map(material =>
      material.id === editingMaterial.id
        ? {
            ...material,
            nameEn: editingMaterial.nameEn,
            nameEs: editingMaterial.nameEs,
            multiplier: parseFloat(editingMaterial.multiplier)
          }
        : material
    );

    setMaterialMultipliers(updated);
    setEditingMaterial(null);
    markSectionChanged('materials');

    updateSharedMaterials(updated);
    refreshPricing();
  };

  const handleDeleteMaterial = (materialId, materialName) => {
    Alert.alert(
      t('pricing.materials.deleteTitle'),
      t('pricing.materials.deleteConfirm').replace('{materialName}', materialName),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const updated = materialMultipliers.filter(material => material.id !== materialId);
            setMaterialMultipliers(updated);
            markSectionChanged('materials');
            updateSharedMaterials(updated);
            refreshPricing();
          }
        }
      ]
    );
  };

  return (
    <ContentGlass style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          <Settings color={COLORS.success} size={20} />
          <Text style={styles.headerTitle}>{t('pricing.materials.title')}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowMaterialForm(!showMaterialForm)}
        >
          <Plus color={COLORS.white} size={16} />
          <Text style={styles.addButtonText}>{t('pricing.materials.addMaterial')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        {t('pricing.materials.description')}
      </Text>

      {/* Add Material Form */}
      {showMaterialForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{t('pricing.materials.addNewBilingual')}</Text>
          <TextInput
            style={styles.formInput}
            placeholder={t('pricing.materials.englishName')}
            value={newMaterial.nameEn}
            onChangeText={(value) => setNewMaterial({ ...newMaterial, nameEn: value })}
            placeholderTextColor={COLORS.textSecondary}
          />
          <TextInput
            style={styles.formInput}
            placeholder={t('pricing.materials.spanishName')}
            value={newMaterial.nameEs}
            onChangeText={(value) => setNewMaterial({ ...newMaterial, nameEs: value })}
            placeholderTextColor={COLORS.textSecondary}
          />
          <TextInput
            style={styles.formInput}
            placeholder={t('pricing.materials.priceMultiplier')}
            value={newMaterial.multiplier}
            onChangeText={(value) => setNewMaterial({ ...newMaterial, multiplier: value })}
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textSecondary}
          />
          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.formButton, styles.formButtonPrimary]}
              onPress={handleAddMaterial}
            >
              <Text style={styles.formButtonText}>{t('pricing.materials.addMaterial')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.formButtonSecondary]}
              onPress={() => {
                setShowMaterialForm(false);
                setNewMaterial({ nameEn: '', nameEs: '', multiplier: '1.0' });
              }}
            >
              <Text style={styles.formButtonTextSecondary}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Materials List */}
      <ScrollView style={styles.materialsList} showsVerticalScrollIndicator={false}>
        {Array.isArray(materialMultipliers) && materialMultipliers.length > 0 ? (
          materialMultipliers.map((material) => (
            <View key={material.id || `${material.nameEn}-${material.nameEs}`} style={styles.materialItem}>
              {editingMaterial?.id === material.id ? (
                // Edit Mode
                <View style={styles.editContainer}>
                  <View style={styles.editInputsContainer}>
                    <TextInput
                      style={styles.editInput}
                      placeholder={t('pricing.materials.englishNamePlaceholder')}
                      value={editingMaterial.nameEn}
                      onChangeText={(value) =>
                        setEditingMaterial({ ...editingMaterial, nameEn: value })
                      }
                      placeholderTextColor={COLORS.textSecondary}
                    />
                    <TextInput
                      style={styles.editInput}
                      placeholder={t('pricing.materials.spanishNamePlaceholder')}
                      value={editingMaterial.nameEs}
                      onChangeText={(value) =>
                        setEditingMaterial({ ...editingMaterial, nameEs: value })
                      }
                      placeholderTextColor={COLORS.textSecondary}
                    />
                    <TextInput
                      style={styles.editInputSmall}
                      placeholder={t('pricing.materials.multiplierPlaceholder')}
                      value={editingMaterial.multiplier?.toString()}
                      onChangeText={(value) =>
                        setEditingMaterial({ ...editingMaterial, multiplier: value })
                      }
                      keyboardType="decimal-pad"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleUpdateMaterial}
                    >
                      <Check color={COLORS.success} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setEditingMaterial(null)}
                    >
                      <X color={COLORS.textSecondary} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Display Mode
                <>
                  <View style={styles.materialInfo}>
                    <View style={styles.materialNameRow}>
                      <Text style={styles.materialNameEn}>{material.nameEn}</Text>
                      {material.isTemporary && (
                        <View style={styles.unsavedBadge}>
                          <Text style={styles.unsavedText}>{t('pricing.materials.unsaved')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.materialNameEs}>{material.nameEs}</Text>
                  </View>
                  <Text style={styles.multiplier}>×{material.multiplier}</Text>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setEditingMaterial({ ...material, multiplier: material.multiplier.toString() })}
                  >
                    <Edit2 color={COLORS.info} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDeleteMaterial(material.id, material.nameEn)}
                  >
                    <Trash2 color={COLORS.error} size={20} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('pricing.materials.noMaterials')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Section Save Button */}
      <SectionSaveButton
        sectionKey="materials"
        sectionChanges={sectionChanges}
        saveStatus={saveStatus}
        onSave={onSave}
      />
    </ContentGlass>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: SPACING[4],
    padding: SPACING[5],
    borderRadius: RADIUS.lg,
  },
  headerContainer: {
    marginBottom: SPACING[4],
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.sm,
    gap: SPACING[1],
    minHeight: 44,
  },
  addButtonText: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.white,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING[4],
  },
  formContainer: {
    backgroundColor: '#ECFDF5', // green-50
    borderWidth: 1,
    borderColor: '#A7F3D0', // green-200
    borderRadius: RADIUS.md,
    padding: SPACING[4],
    marginBottom: SPACING[5],
  },
  formTitle: {
    ...TYPOGRAPHY.h4,
    color: '#065F46', // green-800
    marginBottom: SPACING[4],
  },
  formInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    marginBottom: SPACING[2],
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    minHeight: 44,
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginTop: SPACING[2],
  },
  formButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  formButtonPrimary: {
    backgroundColor: COLORS.success,
  },
  formButtonSecondary: {
    backgroundColor: COLORS.textSecondary,
  },
  formButtonText: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.white,
  },
  formButtonTextSecondary: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.white,
  },
  materialsList: {
    maxHeight: 400,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING[4],
    borderRadius: RADIUS.sm,
    marginBottom: SPACING[2],
    gap: SPACING[2],
  },
  materialInfo: {
    flex: 1,
  },
  materialNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  materialNameEn: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
  },
  materialNameEs: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  unsavedBadge: {
    backgroundColor: '#FEF3C7', // yellow-100
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  unsavedText: {
    ...TYPOGRAPHY.caption,
    color: '#92400E', // yellow-800
  },
  multiplier: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginRight: SPACING[2],
  },
  iconButton: {
    padding: SPACING[2],
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editContainer: {
    flex: 1,
  },
  editInputsContainer: {
    marginBottom: SPACING[2],
  },
  editInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    marginBottom: SPACING[2],
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    minHeight: 44,
  },
  editInputSmall: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    width: 100,
    minHeight: 44,
  },
  editActions: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  emptyState: {
    padding: SPACING[8],
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});

export default MaterialMultipliers;
