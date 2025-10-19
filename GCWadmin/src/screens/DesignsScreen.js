import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import {
  FileText,
  Eye,
  Mail,
  Phone,
  Trash2,
  Download,
  X,
  AlertCircle,
  CheckCircle,
  Home,
  Bath,
  MessageSquare,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { designsApi } from '../api/designs';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';
import DesignPreview from '../components/DesignPreview';

const DesignsScreen = () => {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [designs, setDesigns] = useState([]);
  const [stats, setStats] = useState({
    totalDesigns: 0,
    statusBreakdown: { pending: 0, new: 0, viewed: 0 },
  });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDesigns, setSelectedDesigns] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadDesigns();
    loadStats();
  }, [filter]);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      const filterStatus = filter === 'all' ? null : filter;
      const data = await designsApi.getDesigns(token, filterStatus);
      setDesigns(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await designsApi.getStats(token);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const viewDesign = async (designId) => {
    try {
      const designDetails = await designsApi.getDesignById(token, designId);
      setSelectedDesign(designDetails);
      setShowDetailModal(true);
      // Reload to update status
      loadDesigns();
      loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to load design details');
    }
  };

  const deleteDesign = (designId) => {
    Alert.alert('Delete Design', 'Are you sure you want to delete this design?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await designsApi.deleteDesign(token, designId);
            setDesigns(designs.filter((d) => d.id !== designId));
            loadStats();
            if (selectedDesign && selectedDesign.id === designId) {
              setShowDetailModal(false);
              setSelectedDesign(null);
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete design');
          }
        },
      },
    ]);
  };

  const downloadPDF = (designId, clientName) => {
    const pdfUrl = designsApi.getDesignPdfUrl(designId);
    Linking.openURL(pdfUrl).catch(() => Alert.alert('Error', 'Failed to open PDF'));
  };

  const toggleDesignSelection = (designId) => {
    const newSelected = new Set(selectedDesigns);
    if (newSelected.has(designId)) {
      newSelected.delete(designId);
    } else {
      newSelected.add(designId);
    }
    setSelectedDesigns(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDesigns.size === designs.length) {
      setSelectedDesigns(new Set());
    } else {
      setSelectedDesigns(new Set(designs.map((d) => d.id)));
    }
  };

  const bulkDeleteDesigns = async () => {
    if (selectedDesigns.size === 0) return;

    Alert.alert(
      'Delete Designs',
      `Are you sure you want to delete ${selectedDesigns.size} design(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBulkActionLoading(true);
            try {
              const deletePromises = Array.from(selectedDesigns).map((designId) =>
                designsApi.deleteDesign(token, designId)
              );

              await Promise.all(deletePromises);

              setDesigns(designs.filter((d) => !selectedDesigns.has(d.id)));
              setSelectedDesigns(new Set());
              loadStats();

              if (selectedDesign && selectedDesigns.has(selectedDesign.id)) {
                setSelectedDesign(null);
              }
            } catch (error) {
              Alert.alert('Error', 'Error deleting some designs');
            } finally {
              setBulkActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)})-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phoneNumber;
  };

  const getContactIcon = (preference) => {
    switch (preference) {
      case 'email':
        return <Mail size={16} color={COLORS.primary} />;
      case 'phone':
        return <Phone size={16} color={COLORS.primary} />;
      case 'text':
        return <MessageSquare size={16} color={COLORS.primary} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        <ContentGlass style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>Total Designs</Text>
              <Text style={styles.statValue}>{stats.totalDesigns || 0}</Text>
            </View>
            <FileText size={32} color={COLORS.textSecondary} />
          </View>
        </ContentGlass>

        <ContentGlass style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>New Designs</Text>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>
                {(stats.statusBreakdown?.pending || 0) + (stats.statusBreakdown?.new || 0)}
              </Text>
            </View>
            <AlertCircle size={32} color={COLORS.primary} />
          </View>
        </ContentGlass>

        <ContentGlass style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>Viewed</Text>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {stats.statusBreakdown?.viewed || 0}
              </Text>
            </View>
            <CheckCircle size={32} color={COLORS.success} />
          </View>
        </ContentGlass>
      </ScrollView>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <View style={styles.filterTabsInner}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'all' && styles.filterTabTextActive,
              ]}
            >
              All Designs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('new')}
            style={[
              styles.filterTab,
              filter === 'new' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'new' && styles.filterTabTextActive,
              ]}
            >
              New{' '}
              {stats.statusBreakdown &&
              (stats.statusBreakdown.pending || 0) + (stats.statusBreakdown.new || 0) > 0
                ? `(${(stats.statusBreakdown.pending || 0) + (stats.statusBreakdown.new || 0)})`
                : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('viewed')}
            style={[
              styles.filterTab,
              filter === 'viewed' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'viewed' && styles.filterTabTextActive,
              ]}
            >
              Viewed{' '}
              {stats.statusBreakdown && (stats.statusBreakdown.viewed || 0) > 0
                ? `(${stats.statusBreakdown.viewed})`
                : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bulk Actions */}
      {selectedDesigns.size > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkActionsText}>
            {selectedDesigns.size} design(s) selected
          </Text>
          <TouchableOpacity
            onPress={bulkDeleteDesigns}
            disabled={bulkActionLoading}
            style={[
              styles.bulkDeleteButton,
              bulkActionLoading && styles.bulkDeleteButtonDisabled,
            ]}
          >
            {bulkActionLoading ? (
              <>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.bulkDeleteText}>Deleting...</Text>
              </>
            ) : (
              <>
                <Trash2 size={16} color={COLORS.white} />
                <Text style={styles.bulkDeleteText}>Delete Selected</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Designs List */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading designs...</Text>
          </View>
        ) : (
          <View style={styles.designsList}>
            {designs.map((design) => (
              <View key={design.id} style={styles.designCard}>
                <View style={styles.designCardHeader}>
                  <View style={styles.designCardHeaderLeft}>
                    <TouchableOpacity
                      onPress={() => toggleDesignSelection(design.id)}
                      style={styles.checkbox}
                    >
                      <View
                        style={[
                          styles.checkboxInner,
                          selectedDesigns.has(design.id) && styles.checkboxChecked,
                        ]}
                      />
                    </TouchableOpacity>
                    <View>
                      <Text style={styles.clientName}>{design.client_name}</Text>
                      <Text style={styles.price}>${parseFloat(design.total_price).toFixed(2)}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      design.status === 'new'
                        ? styles.statusBadgeNew
                        : styles.statusBadgeViewed,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {design.status === 'new' ? 'NEW' : 'VIEWED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.designCardContact}>
                  <View style={styles.contactRow}>
                    <Phone size={12} color={COLORS.textSecondary} />
                    {design.phone ? (
                      <TouchableOpacity onPress={() => Linking.openURL(`tel:${design.phone}`)}>
                        <Text style={styles.contactLink}>{formatPhone(design.phone)}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.contactText}>Open to see number</Text>
                    )}
                  </View>
                  <View style={styles.contactRow}>
                    <Mail size={12} color={COLORS.textSecondary} />
                    <TouchableOpacity onPress={() => Linking.openURL(`mailto:${design.email}`)}>
                      <Text style={styles.contactLink}>{design.email}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.designCardFooter}>
                  <Text style={styles.designDate}>{formatDate(design.created_at)}</Text>
                  <View style={styles.designActions}>
                    <TouchableOpacity
                      onPress={() => viewDesign(design.id)}
                      style={styles.actionButton}
                    >
                      <Eye size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => downloadPDF(design.id, design.client_name)}
                      style={styles.actionButton}
                    >
                      <Download size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteDesign(design.id)}
                      style={styles.actionButton}
                    >
                      <Trash2 size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Design Detail Modal */}
      {selectedDesign && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDesign.client_name}</Text>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.modalClose}
              >
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Client Info */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Client Information</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Name</Text>
                    <Text style={styles.infoGridValue}>{selectedDesign.client_name}</Text>
                  </View>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Contact Preference</Text>
                    <View style={styles.preferenceRow}>
                      {getContactIcon(selectedDesign.contact_preference)}
                      <Text style={styles.infoGridValue}>{selectedDesign.contact_preference}</Text>
                    </View>
                  </View>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Contact Information</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(`mailto:${selectedDesign.client_email}`)}>
                      <Text style={styles.infoGridValue}>email: {selectedDesign.client_email}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${selectedDesign.client_phone}`)}>
                      <Text style={styles.infoGridValue}>phone: {formatPhone(selectedDesign.client_phone)}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Submitted</Text>
                    <Text style={styles.infoGridValue}>{formatDate(selectedDesign.created_at)}</Text>
                  </View>
                </View>
              </View>

              {/* Design Summary */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Design Summary</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Total Estimate</Text>
                    <Text style={styles.totalEstimate}>
                      ${parseFloat(selectedDesign.total_price).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Rooms Included</Text>
                    <View style={styles.roomBadges}>
                      {selectedDesign.include_kitchen && (
                        <View style={styles.roomBadgeKitchen}>
                          <Home size={12} color={COLORS.primary} />
                          <Text style={styles.roomBadgeTextKitchen}>Kitchen</Text>
                        </View>
                      )}
                      {selectedDesign.include_bathroom && (
                        <View style={styles.roomBadgeBathroom}>
                          <Bath size={12} color="#9333EA" />
                          <Text style={styles.roomBadgeTextBathroom}>Bathroom</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Design Preview */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Design Visualization</Text>
                <DesignPreview
                  designData={selectedDesign}
                  hasKitchen={selectedDesign.include_kitchen && selectedDesign.kitchen_data}
                  hasBathroom={selectedDesign.include_bathroom && selectedDesign.bathroom_data}
                />
              </View>

              {/* Kitchen Details */}
              {selectedDesign.kitchen_data && selectedDesign.include_kitchen && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Kitchen Details</Text>
                  <Text style={styles.roomDetailText}>
                    Room Dimensions: {selectedDesign.kitchen_data.dimensions.width}' × {selectedDesign.kitchen_data.dimensions.height}' × {selectedDesign.kitchen_data.dimensions.wallHeight}" height
                  </Text>
                  <Text style={styles.roomDetailText}>
                    Total Items: {selectedDesign.kitchen_data.elements.length}
                  </Text>
                  <View style={styles.cabinetSummary}>
                    <Text style={styles.cabinetSummaryTitle}>Cabinet Summary:</Text>
                    {selectedDesign.kitchen_data.elements
                      .filter(el => el.category === 'cabinet')
                      .map((cabinet, idx) => (
                        <Text key={idx} style={styles.cabinetItem}>
                          • {cabinet.type} ({cabinet.width}" × {cabinet.depth}") - Material: {selectedDesign.kitchen_data.materials?.[cabinet.id] || 'laminate'}
                        </Text>
                      ))
                    }
                  </View>
                </View>
              )}

              {/* Bathroom Details */}
              {selectedDesign.bathroom_data && selectedDesign.include_bathroom && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Bathroom Details</Text>
                  <Text style={styles.roomDetailText}>
                    Room Dimensions: {selectedDesign.bathroom_data.dimensions.width}' × {selectedDesign.bathroom_data.dimensions.height}' × {selectedDesign.bathroom_data.dimensions.wallHeight}" height
                  </Text>
                  <Text style={styles.roomDetailText}>
                    Total Items: {selectedDesign.bathroom_data.elements.length}
                  </Text>
                  <View style={styles.cabinetSummary}>
                    <Text style={styles.cabinetSummaryTitle}>Cabinet Summary:</Text>
                    {selectedDesign.bathroom_data.elements
                      .filter(el => el.category === 'cabinet')
                      .map((cabinet, idx) => (
                        <Text key={idx} style={styles.cabinetItem}>
                          • {cabinet.type} ({cabinet.width}" × {cabinet.depth}") - Material: {selectedDesign.bathroom_data.materials?.[cabinet.id] || 'laminate'}
                        </Text>
                      ))
                    }
                  </View>
                </View>
              )}

              {/* Customer Comments */}
              {selectedDesign.comments && (
                <View style={styles.commentsSection}>
                  <Text style={styles.modalSectionTitle}>Customer Notes</Text>
                  <Text style={styles.commentsText}>{selectedDesign.comments}</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => downloadPDF(selectedDesign.id, selectedDesign.client_name)}
                >
                  <Download size={20} color={COLORS.white} />
                  <Text style={styles.modalActionText}>Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.modalActionButtonDanger]}
                  onPress={() => {
                    setShowDetailModal(false);
                    deleteDesign(selectedDesign.id);
                  }}
                >
                  <Trash2 size={20} color={COLORS.white} />
                  <Text style={styles.modalActionText}>Delete Design</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statsContainer: {
    flexGrow: 0,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsContent: {
    flexDirection: 'row',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[4],
    gap: SPACING[4],
  },
  statCard: {
    padding: SPACING[4],
    borderRadius: RADIUS.lg,
    minWidth: 160,
    alignSelf: 'flex-start',
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING[1],
  },
  statValue: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  filterTabs: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTabsInner: {
    flexDirection: 'row',
    paddingHorizontal: SPACING[4],
  },
  filterTab: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[1],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: COLORS.primary,
  },
  filterTabText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[4],
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginHorizontal: SPACING[4],
    marginTop: SPACING[4],
    borderRadius: RADIUS.md,
  },
  bulkActionsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.md,
  },
  bulkDeleteButtonDisabled: {
    opacity: 0.5,
  },
  bulkDeleteText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING[8],
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING[4],
  },
  designsList: {
    padding: SPACING[4],
  },
  designCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING[4],
    marginBottom: SPACING[4],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  designCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[2],
  },
  designCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  clientName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  price: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: 9999,
  },
  statusBadgeNew: {
    backgroundColor: COLORS.primary + '20',
  },
  statusBadgeViewed: {
    backgroundColor: COLORS.textSecondary + '20',
  },
  statusBadgeText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
  designCardContact: {
    marginBottom: SPACING[2],
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    marginBottom: SPACING[1],
  },
  contactText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  contactLink: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
  },
  designCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  designDate: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  designActions: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  actionButton: {
    padding: SPACING[1],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[5],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  modalClose: {
    padding: SPACING[2],
  },
  modalBody: {
    flex: 1,
    padding: SPACING[5],
  },
  modalSection: {
    marginBottom: SPACING[5],
    padding: SPACING[4],
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.lg,
  },
  modalSectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING[3],
    fontWeight: '600',
  },
  infoGrid: {
    gap: SPACING[4],
  },
  infoGridItem: {
    marginBottom: SPACING[2],
  },
  infoGridLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING[1],
  },
  infoGridValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  totalEstimate: {
    ...TYPOGRAPHY.h1,
    color: COLORS.success,
    fontWeight: '700',
  },
  roomBadges: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginTop: SPACING[1],
  },
  roomBadgeKitchen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 9999,
  },
  roomBadgeTextKitchen: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  roomBadgeBathroom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    backgroundColor: '#9333EA20',
    borderRadius: 9999,
  },
  roomBadgeTextBathroom: {
    ...TYPOGRAPHY.small,
    color: '#9333EA',
    fontWeight: '600',
  },
  roomDetailText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING[2],
  },
  cabinetSummary: {
    marginTop: SPACING[3],
  },
  cabinetSummaryTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING[2],
  },
  cabinetItem: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING[1],
  },
  commentsSection: {
    marginBottom: SPACING[5],
    padding: SPACING[4],
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.lg,
  },
  commentsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  modalActions: {
    gap: SPACING[4],
    marginTop: SPACING[5],
    marginBottom: SPACING[8],
    paddingHorizontal: SPACING[4],
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[4],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  modalActionButtonDanger: {
    backgroundColor: COLORS.error,
  },
  modalActionText: {
    ...TYPOGRAPHY.buttonLarge,
    color: COLORS.white,
  },
});

export default DesignsScreen;
