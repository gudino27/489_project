import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { DollarSign, Save, Check } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePricing } from '../../contexts/PricingContext';
import { pricesApi } from '../../api/prices';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants';
import { ContentGlass, TabGlass } from '../../components/GlassView';

// Import sub-components (we'll create these next)
import CabinetPricing from './CabinetPricing';
import MaterialMultipliers from './MaterialMultipliers';
import ColorPricing from './ColorPricing';
import WallPricing from './WallPricing';
import WallAvailability from './WallAvailability';

const PriceManagementScreen = () => {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const { refreshPricing, setMaterialMultipliers: setSharedMaterialMultipliers } = usePricing();

  // Active tab state for mobile navigation
  const [activeTab, setActiveTab] = useState('cabinets');

  // State for all pricing data
  const [basePrices, setBasePrices] = useState({});
  const [materialMultipliers, setMaterialMultipliers] = useState([]);
  const [colorPricing, setColorPricing] = useState({
    1: 0,
    2: 100,
    3: 200,
    'custom': 500
  });
  const [wallPricing, setWallPricing] = useState({
    addWall: 1500,
    removeWall: 2000
  });
  const [wallAvailability, setWallAvailability] = useState({
    addWallEnabled: true,
    removeWallEnabled: true
  });

  // Section-specific unsaved changes tracking
  const [sectionChanges, setSectionChanges] = useState({
    cabinets: false,
    materials: false,
    colors: false,
    walls: false,
    wallAvailability: false
  });

  // Global state for save functionality
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loadingPrices, setLoadingPrices] = useState(true);

  // Helper functions
  const markSectionChanged = (section) => {
    setSectionChanges(prev => {
      const newChanges = { ...prev, [section]: true };
      const hasAnyChanges = Object.values(newChanges).some(changed => changed);
      setHasUnsavedChanges(hasAnyChanges);
      return newChanges;
    });
  };

  const clearAllSectionChanges = () => {
    setSectionChanges({
      cabinets: false,
      materials: false,
      colors: false,
      walls: false,
      wallAvailability: false
    });
    setHasUnsavedChanges(false);
  };

  const updateSharedMaterials = (materialsArray) => {
    const materialObject = {};
    materialsArray.forEach(material => {
      materialObject[material.nameEn.toLowerCase()] = material.multiplier;
    });
    setSharedMaterialMultipliers(materialObject);
  };

  // Load prices on component mount
  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      const [cabinetRes, materialRes, colorRes, wallRes, wallAvailRes] = await Promise.all([
        pricesApi.getCabinetPrices(token),
        pricesApi.getMaterialMultipliers(token),
        pricesApi.getColorPricing(token),
        pricesApi.getWallPricing(token),
        pricesApi.getWallAvailability(token)
      ]);

      if (cabinetRes && Object.keys(cabinetRes).length > 0) {
        setBasePrices(cabinetRes);
      }

      if (materialRes) {
        if (Array.isArray(materialRes)) {
          setMaterialMultipliers(materialRes);
        } else if (typeof materialRes === 'object' && Object.keys(materialRes).length > 0) {
          // Convert old format to new format
          const converted = Object.entries(materialRes).map(([key, multiplier], index) => ({
            id: index + 1,
            nameEn: key.charAt(0).toUpperCase() + key.slice(1),
            nameEs: key === 'laminate' ? 'Laminado' :
                    key === 'wood' ? 'Madera' :
                    key === 'plywood' ? 'Madera Contrachapada' :
                    key === 'maple' ? 'Arce' : key,
            multiplier: parseFloat(multiplier)
          }));
          setMaterialMultipliers(converted);
        }
      }

      if (colorRes && Object.keys(colorRes).length > 0) {
        setColorPricing(colorRes);
      }

      if (wallRes && Object.keys(wallRes).length > 0) {
        setWallPricing(wallRes);
      }

      if (wallAvailRes) {
        setWallAvailability(wallAvailRes);
      }
    } catch (error) {
      console.error('Error loading prices:', error);
      Alert.alert('Error', 'Failed to load prices');
    } finally {
      setLoadingPrices(false);
    }
  };

  // Save all price changes
  const savePriceChanges = async () => {
    setSaveStatus('saving');

    try {
      await pricesApi.saveAllPrices(token, {
        cabinets: basePrices,
        materials: materialMultipliers,
        colors: colorPricing,
        walls: wallPricing,
        wallAvailability: wallAvailability
      });

      setSaveStatus('saved');
      clearAllSectionChanges();

      // Remove "Unsaved" status from all materials after successful save
      setMaterialMultipliers(prev => prev.map(material => ({
        ...material,
        isTemporary: false
      })));

      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving prices:', error);
      Alert.alert('Error', 'Failed to save prices: ' + error.message);
      setSaveStatus('error');
    }
  };

  if (loadingPrices) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('priceManagement.loading') || 'Loading prices...'}</Text>
      </View>
    );
  }

  const tabs = [
    { id: 'cabinets', label: t('priceManagement.cabinets') || 'Cabinets' },
    { id: 'materials', label: t('priceManagement.materials') || 'Materials' },
    { id: 'colors', label: t('priceManagement.colors') || 'Colors' },
    { id: 'walls', label: t('priceManagement.walls') || 'Walls' },
    ...(user?.role === 'super_admin' ? [{ id: 'availability', label: t('priceManagement.availability') || 'Availability' }] : [])
  ];

  console.log('Current activeTab:', activeTab);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <DollarSign color={COLORS.primary} size={24} />
          <Text style={styles.headerTitle}>{t('priceManagement.title') || 'Price Management'}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollView}
        contentContainerStyle={styles.tabContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => {
              console.log('Tab pressed:', tab.id);
              setActiveTab(tab.id);
            }}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Save Status Banner */}
      {saveStatus && (
        <View style={[
          styles.statusBanner,
          saveStatus === 'saved' && styles.statusBannerSuccess,
          saveStatus === 'saving' && styles.statusBannerInfo,
          saveStatus === 'error' && styles.statusBannerError
        ]}>
          {saveStatus === 'saved' && <Check color={COLORS.white} size={18} />}
          <Text style={styles.statusText}>
            {saveStatus === 'saved' ? (t('priceManagement.saved') || 'Saved successfully!') :
              saveStatus === 'saving' ? (t('priceManagement.saving') || 'Saving...') :
              (t('priceManagement.error') || 'Error saving')}
          </Text>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content}>
        {(() => {
          console.log('Rendering tab content for:', activeTab);
          switch (activeTab) {
            case 'cabinets':
              return (
                <CabinetPricing
                  basePrices={basePrices}
                  setBasePrices={setBasePrices}
                  markSectionChanged={markSectionChanged}
                  sectionChanges={sectionChanges}
                  saveStatus={saveStatus}
                  onSave={savePriceChanges}
                />
              );
            case 'materials':
              return (
                <MaterialMultipliers
                  materialMultipliers={materialMultipliers}
                  setMaterialMultipliers={setMaterialMultipliers}
                  markSectionChanged={markSectionChanged}
                  updateSharedMaterials={updateSharedMaterials}
                  refreshPricing={refreshPricing}
                  sectionChanges={sectionChanges}
                  saveStatus={saveStatus}
                  onSave={savePriceChanges}
                />
              );
            case 'colors':
              return (
                <ColorPricing
                  colorPricing={colorPricing}
                  setColorPricing={setColorPricing}
                  markSectionChanged={markSectionChanged}
                  sectionChanges={sectionChanges}
                  saveStatus={saveStatus}
                  onSave={savePriceChanges}
                />
              );
            case 'walls':
              return (
                <WallPricing
                  wallPricing={wallPricing}
                  setWallPricing={setWallPricing}
                  markSectionChanged={markSectionChanged}
                  sectionChanges={sectionChanges}
                  saveStatus={saveStatus}
                  onSave={savePriceChanges}
                />
              );
            case 'availability':
              if (user?.role === 'super_admin') {
                return (
                  <WallAvailability
                    wallAvailability={wallAvailability}
                    setWallAvailability={setWallAvailability}
                    markSectionChanged={markSectionChanged}
                    userRole={user?.role}
                    sectionChanges={sectionChanges}
                    saveStatus={saveStatus}
                    onSave={savePriceChanges}
                  />
                );
              }
              return null;
            default:
              return null;
          }
        })()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Global Save Button */}
      {hasUnsavedChanges && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!hasUnsavedChanges || saveStatus === 'saving') && styles.saveButtonDisabled
            ]}
            onPress={savePriceChanges}
            disabled={!hasUnsavedChanges || saveStatus === 'saving'}
          >
            <Save color={COLORS.white} size={18} />
            <Text style={styles.saveButtonText}>
              {saveStatus === 'saving'
                ? (t('priceManagement.saving') || 'Saving...')
                : (t('priceManagement.saveChanges') || 'Save All Changes')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  tabScrollView: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  tab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundLight,
    marginRight: SPACING.xs,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  statusBannerSuccess: {
    backgroundColor: COLORS.success,
  },
  statusBannerInfo: {
    backgroundColor: COLORS.info,
  },
  statusBannerError: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  saveButtonText: {
    ...TYPOGRAPHY.buttonLarge,
    color: COLORS.white,
  },
});

export default PriceManagementScreen;
