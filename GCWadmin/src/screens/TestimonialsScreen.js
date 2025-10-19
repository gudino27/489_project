import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Clipboard,
} from 'react-native';
import {
  MessageSquare,
  Star,
  Trash2,
  Send,
  Copy,
  Check,
  Eye,
  EyeOff,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { testimonialsApi } from '../api/testimonials';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';
import { API_URL } from '../constants/config';

const TestimonialsScreen = () => {
  const { token, user } = useAuth();

  const [testimonials, setTestimonials] = useState([]);
  const [generatedTokens, setGeneratedTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [copiedToken, setCopiedToken] = useState('');
  const [selectedTestimonials, setSelectedTestimonials] = useState(new Set());
  const [modalImage, setModalImage] = useState(null);
  const [modalImages, setModalImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedToken, setExpandedToken] = useState(null);
  const [trackingData, setTrackingData] = useState({});
  const [loadingTracking, setLoadingTracking] = useState({});

  const [sendLinkForm, setSendLinkForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    project_type: '',
    custom_project_type: '',
    send_via: 'email',
  });

  const projectTypes = [
    'Kitchen Remodeling',
    'Bathroom Renovation',
    'Custom Carpentry',
    'Cabinet Installation',
    'Home Remodeling',
    'Commercial Project',
    'Other',
  ];

  useEffect(() => {
    loadTestimonials();
    loadGeneratedTokens();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await testimonialsApi.getTestimonials(token);
      setTestimonials(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const loadGeneratedTokens = async () => {
    try {
      const data = await testimonialsApi.getGeneratedTokens(token);
      setGeneratedTokens(data);
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  };

  const sendTestimonialLink = async () => {
    if (!sendLinkForm.client_name || !sendLinkForm.project_type) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (
      (sendLinkForm.send_via === 'email' || sendLinkForm.send_via === 'both') &&
      !sendLinkForm.client_email
    ) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    if (
      (sendLinkForm.send_via === 'sms' || sendLinkForm.send_via === 'both') &&
      !sendLinkForm.client_phone
    ) {
      Alert.alert('Error', 'Phone is required');
      return;
    }

    setSendingLink(true);

    try {
      const formData = {
        ...sendLinkForm,
        project_type:
          sendLinkForm.project_type === 'Other'
            ? sendLinkForm.custom_project_type
            : sendLinkForm.project_type,
      };

      const data = await testimonialsApi.sendTestimonialLink(token, formData);
      setLinkSent(true);
      setSendLinkForm({
        client_name: '',
        client_email: '',
        client_phone: '',
        project_type: '',
        custom_project_type: '',
        send_via: 'email',
      });
      loadGeneratedTokens();

      let message = 'Testimonial link sent successfully!';
      if (data.results) {
        if (data.results.email?.success) message += '\n✓ Email sent';
        if (data.results.sms?.success) message += '\n✓ SMS sent';
        if (data.results.email?.success === false) message += '\n✗ Email failed';
        if (data.results.sms?.success === false) message += '\n✗ SMS failed';
      }
      Alert.alert('Success', message);

      setTimeout(() => setLinkSent(false), 5000);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send testimonial link');
    } finally {
      setSendingLink(false);
    }
  };

  const copyTestimonialLink = async (tokenValue) => {
    const link = `https://gudinocustom.com/testimonial/${tokenValue}`;
    Clipboard.setString(link);
    setCopiedToken(tokenValue);
    setTimeout(() => setCopiedToken(''), 2000);
  };

  const deleteTestimonialToken = async (tokenValue) => {
    Alert.alert('Delete Link', 'Are you sure you want to delete this testimonial link?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await testimonialsApi.deleteToken(token, tokenValue);
            setGeneratedTokens(generatedTokens.filter((t) => t.token !== tokenValue));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete testimonial link');
          }
        },
      },
    ]);
  };

  const deleteTestimonial = async (testimonialId) => {
    Alert.alert('Delete Testimonial', 'Are you sure you want to delete this testimonial?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await testimonialsApi.deleteTestimonial(token, testimonialId);
            setTestimonials(testimonials.filter((t) => t.id !== testimonialId));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete testimonial');
          }
        },
      },
    ]);
  };

  const toggleTestimonialVisibility = async (testimonialId, currentStatus) => {
    try {
      await testimonialsApi.updateTestimonial(token, testimonialId, {
        is_visible: !currentStatus,
      });
      setTestimonials(
        testimonials.map((t) =>
          t.id === testimonialId ? { ...t, is_visible: !currentStatus } : t
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update visibility');
    }
  };

  const bulkDeleteTestimonials = async () => {
    if (selectedTestimonials.size === 0) return;

    Alert.alert(
      'Delete Testimonials',
      `Are you sure you want to delete ${selectedTestimonials.size} testimonial(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletePromises = Array.from(selectedTestimonials).map((id) =>
                testimonialsApi.deleteTestimonial(token, id)
              );

              await Promise.all(deletePromises);
              setTestimonials(testimonials.filter((t) => !selectedTestimonials.has(t.id)));
              setSelectedTestimonials(new Set());
            } catch (error) {
              Alert.alert('Error', 'Error deleting some testimonials');
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

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'submitted':
        return { bg: COLORS.success + '20', color: COLORS.success, text: 'Submitted' };
      case 'opened':
        return { bg: COLORS.warning + '20', color: COLORS.warning, text: 'Opened' };
      case 'sent':
      default:
        return { bg: COLORS.gray200, color: COLORS.textSecondary, text: 'Sent' };
    }
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '';
    return String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) return 'Mobile';
    return 'Desktop';
  };

  const loadTokenTracking = async (tokenValue, offset = 0) => {
    try {
      setLoadingTracking({ ...loadingTracking, [tokenValue]: true });
      const data = await testimonialsApi.getTokenTracking(token, tokenValue, 20, offset);

      setTrackingData({
        ...trackingData,
        [tokenValue]: {
          records: offset === 0 ? data.records : [...(trackingData[tokenValue]?.records || []), ...data.records],
          total: data.total,
          offset: offset + data.records.length,
          hasMore: data.hasMore
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load tracking data');
    } finally {
      setLoadingTracking({ ...loadingTracking, [tokenValue]: false });
    }
  };

  const toggleTokenExpand = async (tokenValue) => {
    if (expandedToken === tokenValue) {
      setExpandedToken(null);
    } else {
      setExpandedToken(tokenValue);
      if (!trackingData[tokenValue]) {
        await loadTokenTracking(tokenValue, 0);
      }
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        color={i < rating ? '#FCD34D' : '#D1D5DB'}
        fill={i < rating ? '#FCD34D' : 'none'}
      />
    ));
  };

  const openImageModal = (photos, index) => {
    setModalImages(photos);
    setCurrentImageIndex(index);
    setModalImage(photos[index]);
  };

  const closeModal = () => {
    setModalImage(null);
    setModalImages([]);
    setCurrentImageIndex(0);
  };

  const navigateImage = (direction) => {
    const newIndex =
      direction === 'next'
        ? (currentImageIndex + 1) % modalImages.length
        : (currentImageIndex - 1 + modalImages.length) % modalImages.length;
    setCurrentImageIndex(newIndex);
    setModalImage(modalImages[newIndex]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Testimonials & Reviews</Text>
          <Text style={styles.headerDescription}>
            Manage customer reviews and send testimonial requests to clients.
          </Text>
        </View>

        {/* Send Testimonial Link Form */}
        <ContentGlass style={styles.formCard}>
          <View style={styles.formHeader}>
            <Send size={20} color={COLORS.primary} />
            <Text style={styles.formHeaderText}>Send Testimonial Link</Text>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Client Name *</Text>
              <TextInput
                style={styles.formInput}
                value={sendLinkForm.client_name}
                onChangeText={(text) =>
                  setSendLinkForm({ ...sendLinkForm, client_name: text })
                }
                placeholder="Enter name"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Project Type *</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {projectTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() =>
                        setSendLinkForm({
                          ...sendLinkForm,
                          project_type: type,
                          custom_project_type: '',
                        })
                      }
                      style={[
                        styles.projectTypeChip,
                        sendLinkForm.project_type === type && styles.projectTypeChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.projectTypeChipText,
                          sendLinkForm.project_type === type &&
                            styles.projectTypeChipTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {sendLinkForm.project_type === 'Other' && (
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <TextInput
                  style={styles.formInput}
                  value={sendLinkForm.custom_project_type}
                  onChangeText={(text) =>
                    setSendLinkForm({ ...sendLinkForm, custom_project_type: text })
                  }
                  placeholder="Specify project type"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>
          )}

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>
                Email{' '}
                {(sendLinkForm.send_via === 'email' || sendLinkForm.send_via === 'both') && '*'}
              </Text>
              <TextInput
                style={styles.formInput}
                value={sendLinkForm.client_email}
                onChangeText={(text) =>
                  setSendLinkForm({ ...sendLinkForm, client_email: text })
                }
                placeholder="Enter email"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>
                Phone{' '}
                {(sendLinkForm.send_via === 'sms' || sendLinkForm.send_via === 'both') && '*'}
              </Text>
              <TextInput
                style={styles.formInput}
                value={sendLinkForm.client_phone}
                onChangeText={(text) =>
                  setSendLinkForm({ ...sendLinkForm, client_phone: text })
                }
                placeholder="Enter phone"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Send Via *</Text>
            <View style={styles.radioGroup}>
              {[
                { label: 'Email Only', value: 'email' },
                { label: 'SMS Only', value: 'sms' },
                { label: 'Both', value: 'both' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSendLinkForm({ ...sendLinkForm, send_via: option.value })}
                  style={styles.radioOption}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      sendLinkForm.send_via === option.value && styles.radioCircleActive,
                    ]}
                  >
                    {sendLinkForm.send_via === option.value && (
                      <View style={styles.radioCircleInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, sendingLink && styles.sendButtonDisabled]}
            onPress={sendTestimonialLink}
            disabled={sendingLink}
          >
            {sendingLink ? (
              <>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.sendButtonText}>Sending...</Text>
              </>
            ) : (
              <>
                <Send size={16} color={COLORS.white} />
                <Text style={styles.sendButtonText}>Send Link</Text>
              </>
            )}
          </TouchableOpacity>

          {linkSent && (
            <View style={styles.successMessage}>
              <Check size={16} color={COLORS.success} />
              <Text style={styles.successMessageText}>Link sent successfully!</Text>
            </View>
          )}
        </ContentGlass>

        {/* Generated Tokens */}
        {generatedTokens.length > 0 && (
          <ContentGlass style={styles.tokensCard}>
            <Text style={styles.sectionTitle}>Generated Links</Text>
            {generatedTokens.map((tokenData) => {
              const statusStyle = getStatusBadgeStyle(tokenData.status);
              return (
                <View key={tokenData.token}>
                <View style={styles.tokenItem}>
                  <View style={styles.tokenInfo}>
                    <View style={styles.tokenNameRow}>
                      <Text style={styles.tokenName}>{tokenData.client_name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
                          {statusStyle.text}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tokenDetails}>
                      {tokenData.client_email} • {tokenData.project_type}
                    </Text>
                    <Text style={styles.tokenDate}>Created: {formatDate(tokenData.created_at)}</Text>

                    {tokenData.status === 'opened' && tokenData.opened_count > 0 && (
                      <View style={styles.tokenOpenedInfo}>
                        <ExternalLink size={12} color={COLORS.warning} />
                        <Text style={styles.tokenOpenedText}>
                          Opened {tokenData.opened_count} time{tokenData.opened_count > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}

                    {tokenData.status === 'submitted' && tokenData.first_opened_at && (
                      <View style={styles.tokenOpenedInfo}>
                        <Check size={12} color={COLORS.success} />
                        <Text style={styles.tokenOpenedText}>
                          Submitted: {formatDate(tokenData.used_at)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.tokenActions}>
                    {tokenData.opened_count > 0 && (
                      <TouchableOpacity
                        onPress={() => toggleTokenExpand(tokenData.token)}
                        style={[styles.tokenActionButton, styles.viewDetailsButton]}
                      >
                        <Eye size={16} color={COLORS.white} />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => copyTestimonialLink(tokenData.token)}
                      style={styles.tokenActionButton}
                    >
                      {copiedToken === tokenData.token ? (
                        <Check size={16} color={COLORS.success} />
                      ) : (
                        <Copy size={16} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => deleteTestimonialToken(tokenData.token)}
                      style={styles.tokenActionButton}
                    >
                      <X size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Expandable Tracking Details */}
                {expandedToken === tokenData.token && trackingData[tokenData.token] && (
                  <View style={styles.trackingSection}>
                    <Text style={styles.trackingTitle}>
                      Link Opening History ({trackingData[tokenData.token].total} total)
                    </Text>

                    <ScrollView style={styles.trackingList}>
                      {trackingData[tokenData.token].records.map((record, idx) => (
                        <View key={idx} style={styles.trackingRecord}>
                          <View style={styles.trackingHeader}>
                            <Text style={styles.trackingLocation}>
                              {getCountryFlag(record.country_code)} {record.city}, {record.region}, {record.country}
                            </Text>
                            <Text style={styles.trackingTime}>
                              {formatDate(record.opened_at)}
                            </Text>
                          </View>
                          <Text style={styles.trackingDetails}>
                            IP: {record.ip_address} • {getDeviceInfo(record.user_agent)}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>

                    {trackingData[tokenData.token].hasMore && (
                      <TouchableOpacity
                        onPress={() => loadTokenTracking(tokenData.token, trackingData[tokenData.token].offset)}
                        disabled={loadingTracking[tokenData.token]}
                        style={styles.loadMoreButton}
                      >
                        {loadingTracking[tokenData.token] ? (
                          <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                          <Text style={styles.loadMoreText}>Load More</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                </View>
              );
            })}
          </ContentGlass>
        )}

        {/* Bulk Actions */}
        {selectedTestimonials.size > 0 && user?.role === 'super_admin' && (
          <View style={styles.bulkActions}>
            <Text style={styles.bulkActionsText}>
              {selectedTestimonials.size} testimonial(s) selected
            </Text>
            <TouchableOpacity
              onPress={bulkDeleteTestimonials}
              style={styles.bulkDeleteButton}
            >
              <Trash2 size={16} color={COLORS.white} />
              <Text style={styles.bulkDeleteText}>Delete Selected</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Testimonials List */}
        <ContentGlass style={styles.testimonialsCard}>
          <View style={styles.testimonialsHeader}>
            <MessageSquare size={20} color={COLORS.primary} />
            <Text style={styles.testimonialsHeaderText}>
              Received Testimonials ({testimonials.length})
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading testimonials...</Text>
            </View>
          ) : testimonials.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageSquare size={48} color={COLORS.gray300} />
              <Text style={styles.emptyText}>No testimonials yet</Text>
              <Text style={styles.emptySubtext}>Send links to clients to start collecting reviews</Text>
            </View>
          ) : (
            <View style={styles.testimonialsList}>
              {testimonials.map((testimonial) => (
                <View key={testimonial.id} style={styles.testimonialItem}>
                  <View style={styles.testimonialHeader}>
                    <View style={styles.testimonialCheckbox}>
                      <TouchableOpacity
                        onPress={() => {
                          const newSelected = new Set(selectedTestimonials);
                          if (newSelected.has(testimonial.id)) {
                            newSelected.delete(testimonial.id);
                          } else {
                            newSelected.add(testimonial.id);
                          }
                          setSelectedTestimonials(newSelected);
                        }}
                        style={styles.checkbox}
                      >
                        <View
                          style={[
                            styles.checkboxInner,
                            selectedTestimonials.has(testimonial.id) && styles.checkboxChecked,
                          ]}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.testimonialContent}>
                      <View style={styles.testimonialNameRow}>
                        <Text style={styles.testimonialName}>{testimonial.client_name}</Text>
                        <View style={styles.testimonialStars}>{renderStars(testimonial.rating)}</View>
                      </View>

                      <Text style={styles.testimonialMessage}>"{testimonial.message}"</Text>

                      {testimonial.photos && testimonial.photos.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.photoScroll}
                        >
                          {testimonial.photos.map((photo, photoIndex) => (
                            <TouchableOpacity
                              key={photoIndex}
                              onPress={() => openImageModal(testimonial.photos, photoIndex)}
                            >
                              <Image
                                source={{
                                  uri: `${API_URL}${photo.thumbnail_path || photo.file_path}`,
                                }}
                                style={styles.testimonialPhoto}
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}

                      <View style={styles.testimonialMeta}>
                        {testimonial.project_type && (
                          <View style={styles.projectTypeBadge}>
                            <Text style={styles.projectTypeBadgeText}>
                              {testimonial.project_type}
                            </Text>
                          </View>
                        )}
                        <View style={styles.testimonialDate}>
                          <Calendar size={12} color={COLORS.textSecondary} />
                          <Text style={styles.testimonialDateText}>
                            {formatDate(testimonial.created_at)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.testimonialActions}>
                      <TouchableOpacity
                        onPress={() =>
                          toggleTestimonialVisibility(testimonial.id, testimonial.is_visible)
                        }
                        style={styles.actionButton}
                      >
                        {testimonial.is_visible ? (
                          <Eye size={18} color={COLORS.success} />
                        ) : (
                          <EyeOff size={18} color={COLORS.textSecondary} />
                        )}
                      </TouchableOpacity>

                      {user?.role === 'super_admin' && (
                        <TouchableOpacity
                          onPress={() => deleteTestimonial(testimonial.id)}
                          style={styles.actionButton}
                        >
                          <Trash2 size={18} color={COLORS.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ContentGlass>
      </ScrollView>

      {/* Image Modal */}
      {modalImage && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
              <X size={32} color={COLORS.white} />
            </TouchableOpacity>

            {modalImages.length > 1 && (
              <>
                <TouchableOpacity
                  style={styles.modalNavLeft}
                  onPress={() => navigateImage('prev')}
                >
                  <ChevronLeft size={32} color={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalNavRight}
                  onPress={() => navigateImage('next')}
                >
                  <ChevronRight size={32} color={COLORS.white} />
                </TouchableOpacity>
              </>
            )}

            <Image
              source={{ uri: `${API_URL}${modalImage.file_path}` }}
              style={styles.modalImage}
              resizeMode="contain"
            />

            {modalImages.length > 1 && (
              <View style={styles.modalCounter}>
                <Text style={styles.modalCounterText}>
                  {currentImageIndex + 1} / {modalImages.length}
                </Text>
              </View>
            )}
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
  content: {
    flex: 1,
  },
  header: {
    padding: SPACING[5],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  headerDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  formCard: {
    margin: SPACING[5],
    padding: SPACING[5],
    borderRadius: RADIUS.lg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  formHeaderText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  formRow: {
    marginBottom: SPACING[3],
  },
  formField: {
    flex: 1,
  },
  formLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: SPACING[2],
  },
  formInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING[3],
  },
  pickerContainer: {
    marginTop: SPACING[2],
  },
  projectTypeChip: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: 9999,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING[2],
  },
  projectTypeChipActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  projectTypeChipText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  projectTypeChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'column',
    gap: SPACING[2],
    marginTop: SPACING[2],
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: COLORS.primary,
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING[3],
    marginTop: SPACING[4],
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.white,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: SPACING[3],
    padding: SPACING[3],
    backgroundColor: COLORS.success + '20',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  successMessageText: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
  },
  tokensCard: {
    marginHorizontal: SPACING[5],
    marginBottom: SPACING[5],
    padding: SPACING[5],
    borderRadius: RADIUS.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING[4],
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[3],
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    marginBottom: SPACING[2],
  },
  tokenInfo: {
    flex: 1,
  },
  tokenNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[1],
  },
  tokenName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeText: {
    ...TYPOGRAPHY.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tokenDetails: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: SPACING[1],
  },
  tokenDate: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING[1],
  },
  tokenOpenedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    marginTop: SPACING[2],
  },
  tokenOpenedText: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  tokenActions: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  tokenActionButton: {
    padding: SPACING[2],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewDetailsButton: {
    backgroundColor: COLORS.gray600,
    borderColor: COLORS.gray600,
  },
  trackingSection: {
    marginTop: SPACING[3],
    padding: SPACING[3],
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
  },
  trackingTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING[3],
  },
  trackingList: {
    maxHeight: 300,
  },
  trackingRecord: {
    padding: SPACING[3],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: SPACING[2],
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[1],
  },
  trackingLocation: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  trackingTime: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  trackingDetails: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textGray,
  },
  loadMoreButton: {
    marginTop: SPACING[3],
    padding: SPACING[3],
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  loadMoreText: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '500',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[4],
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginHorizontal: SPACING[5],
    marginBottom: SPACING[5],
    borderRadius: RADIUS.md,
  },
  bulkActionsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.md,
  },
  bulkDeleteText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
  testimonialsCard: {
    marginHorizontal: SPACING[5],
    marginBottom: SPACING[8],
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  testimonialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[5],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  testimonialsHeaderText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  loadingContainer: {
    padding: SPACING[8],
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING[4],
  },
  emptyContainer: {
    padding: SPACING[8],
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING[4],
  },
  emptySubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: SPACING[2],
    textAlign: 'center',
  },
  testimonialsList: {
    paddingVertical: SPACING[2],
  },
  testimonialItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  testimonialHeader: {
    flexDirection: 'row',
    padding: SPACING[5],
    gap: SPACING[3],
  },
  testimonialCheckbox: {},
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
  testimonialContent: {
    flex: 1,
  },
  testimonialNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[2],
  },
  testimonialName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  photoScroll: {
    marginBottom: SPACING[3],
  },
  testimonialPhoto: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    marginRight: SPACING[2],
  },
  testimonialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  projectTypeBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 9999,
  },
  projectTypeBadgeText: {
    ...TYPOGRAPHY.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  testimonialDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  testimonialDateText: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  testimonialActions: {
    gap: SPACING[2],
  },
  actionButton: {
    padding: SPACING[2],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: SPACING[2],
  },
  modalNavLeft: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: SPACING[2],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 9999,
  },
  modalNavRight: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: SPACING[2],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 9999,
  },
  modalImage: {
    width: '90%',
    height: '80%',
  },
  modalCounter: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: 9999,
  },
  modalCounterText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
  },
});

export default TestimonialsScreen;
