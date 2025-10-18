import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';

const TestimonialsScreen = () => {
  const [testimonials, setTestimonials] = useState([
    {
      id: 1,
      name: 'John Smith',
      location: 'San Francisco, CA',
      rating: 5,
      text: 'Amazing work! The team transformed our kitchen into a modern masterpiece. Highly recommended!',
      featured: true,
      approved: true,
      date: '2024-03-10',
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      location: 'Los Angeles, CA',
      rating: 5,
      text: 'Professional, on-time, and within budget. Our new cabinets look stunning!',
      featured: true,
      approved: true,
      date: '2024-03-08',
    },
    {
      id: 3,
      name: 'Mike Davis',
      location: 'San Diego, CA',
      rating: 4,
      text: 'Great quality work. Minor delays but the final result was worth the wait.',
      featured: false,
      approved: true,
      date: '2024-03-05',
    },
    {
      id: 4,
      name: 'Emily Brown',
      location: 'Sacramento, CA',
      rating: 5,
      text: 'Best cabinet makers in the area! Attention to detail is outstanding.',
      featured: false,
      approved: false,
      date: '2024-03-02',
    },
  ]);

  const toggleFeatured = (id) => {
    setTestimonials(prev =>
      prev.map(item =>
        item.id === id ? { ...item, featured: !item.featured } : item
      )
    );
  };

  const toggleApproved = (id) => {
    setTestimonials(prev =>
      prev.map(item =>
        item.id === id ? { ...item, approved: !item.approved } : item
      )
    );
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <ContentGlass style={styles.infoCard}>
          <Text style={styles.infoTitle}>Testimonials & Reviews</Text>
          <Text style={styles.infoText}>
            Manage customer reviews. Approve testimonials to display them on your website and mark the best ones as featured.
          </Text>
        </ContentGlass>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>{testimonials.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </ContentGlass>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>
              {testimonials.filter(t => t.approved).length}
            </Text>
            <Text style={styles.statLabel}>Approved</Text>
          </ContentGlass>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>
              {testimonials.filter(t => t.featured).length}
            </Text>
            <Text style={styles.statLabel}>Featured</Text>
          </ContentGlass>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>
              {(testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </ContentGlass>
        </View>

        {/* Testimonials List */}
        {testimonials.map((testimonial) => (
          <ContentGlass key={testimonial.id} style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{testimonial.name}</Text>
                <Text style={styles.customerLocation}>{testimonial.location}</Text>
              </View>
              <View style={styles.badges}>
                {testimonial.featured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.badgeText}>Featured</Text>
                  </View>
                )}
                {!testimonial.approved && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.badgeText}>Pending</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.ratingContainer}>
              <Text style={styles.stars}>{renderStars(testimonial.rating)}</Text>
              <Text style={styles.dateText}>{formatDate(testimonial.date)}</Text>
            </View>

            <Text style={styles.testimonialText}>{testimonial.text}</Text>

            <View style={styles.controls}>
              <View style={styles.toggle}>
                <Text style={styles.toggleLabel}>Approved</Text>
                <Switch
                  value={testimonial.approved}
                  onValueChange={() => toggleApproved(testimonial.id)}
                  trackColor={{ false: COLORS.gray300, true: COLORS.success }}
                  thumbColor={COLORS.white}
                />
              </View>
              <View style={styles.toggle}>
                <Text style={styles.toggleLabel}>Featured</Text>
                <Switch
                  value={testimonial.featured}
                  onValueChange={() => toggleFeatured(testimonial.id)}
                  trackColor={{ false: COLORS.gray300, true: COLORS.accent }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </ContentGlass>
        ))}

        {/* Add New Button */}
        <TouchableOpacity style={styles.addButton}>
          <ContentGlass style={styles.addButtonInner}>
            <Text style={styles.addButtonText}>+ Add Testimonial</Text>
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
  statsRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  statCard: {
    flex: 1,
    padding: SPACING[3],
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    marginBottom: SPACING[1],
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  testimonialCard: {
    padding: SPACING[4],
    marginBottom: SPACING[3],
    borderRadius: RADIUS.xl,
  },
  testimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[2],
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  customerLocation: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  badges: {
    gap: SPACING[1],
  },
  featuredBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.accent,
  },
  pendingBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.warning,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  stars: {
    fontSize: TYPOGRAPHY.base,
  },
  dateText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  testimonialText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed * TYPOGRAPHY.sm,
    marginBottom: SPACING[3],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING[3],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  toggleLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  editButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  deleteButton: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.sm,
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

export default TestimonialsScreen;
