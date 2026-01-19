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
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import {
  Instagram, Settings, Eye, EyeOff, Trash2,
  RefreshCw, Save, Key, Image as ImageIcon,
} from 'lucide-react-native';
import { ContentGlass } from '../components/GlassView';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getInstagramPosts,
  fetchInstagramPosts,
  getInstagramSettings,
  updateInstagramSettings,
  toggleInstagramPost,
  deleteInstagramPost,
} from '../api/instagram';

const TABS = [
  { id: 'posts', label: 'Posts', IconComponent: ImageIcon },
  { id: 'settings', label: 'Settings', IconComponent: Settings },
];

const { width } = Dimensions.get('window');
const CARD_MARGIN = SPACING[2];
const CARD_WIDTH = (width - SPACING[4] * 2 - CARD_MARGIN * 4) / 2;

const InstagramManagerScreen = () => {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState({
    access_token: '',
    is_enabled: true,
    last_fetched_at: null,
  });

  // Form states
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab, token]);

  const fetchData = async () => {
    if (!token) return;
    await Promise.all([fetchPosts(), fetchSettings()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchPosts = async () => {
    if (!token) return;
    try {
      const data = await getInstagramPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      Alert.alert('Error', 'Failed to fetch Instagram posts');
    }
  };

  const fetchSettings = async () => {
    if (!token) return;
    try {
      const data = await getInstagramSettings();
      setSettings(data);
      setAccessToken(data.access_token || '');
    } catch (error) {
      console.error('Error fetching Instagram settings:', error);
      Alert.alert('Error', 'Failed to fetch Instagram settings');
    }
  };

  const handleFetchNewPosts = async () => {
    if (!settings.access_token) {
      Alert.alert('Error', 'Please configure access token in Settings first');
      setActiveTab('settings');
      return;
    }

    Alert.alert(
      'Fetch New Posts',
      'Fetch latest posts from Instagram?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fetch',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await fetchInstagramPosts();
              Alert.alert('Success', `Fetched ${result.newPosts} new post(s)`);
              fetchPosts();
            } catch (error) {
              console.error('Error fetching new posts:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to fetch new posts');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleVisibility = async (postId) => {
    try {
      await toggleInstagramPost(postId);
      fetchPosts();
    } catch (error) {
      console.error('Error toggling post visibility:', error);
      Alert.alert('Error', 'Failed to toggle post visibility');
    }
  };

  const handleDeletePost = async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post from the database?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteInstagramPost(postId);
              Alert.alert('Success', 'Post deleted successfully');
              fetchPosts();
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveSettings = async () => {
    if (!accessToken.trim()) {
      Alert.alert('Error', 'Access token is required');
      return;
    }

    setLoading(true);
    try {
      await updateInstagramSettings({
        access_token: accessToken,
        is_enabled: settings.is_enabled,
      });
      Alert.alert('Success', 'Settings saved successfully');
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderPostsTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Fetch Button */}
      <View style={styles.fetchButtonContainer}>
        <TouchableOpacity
          style={[styles.fetchButton, loading && styles.fetchButtonDisabled]}
          onPress={handleFetchNewPosts}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <RefreshCw size={16} color={COLORS.white} />
              <Text style={styles.fetchButtonText}>Fetch New Posts</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Posts Grid */}
      <View style={styles.postsGrid}>
        {posts.map((post) => (
          <ContentGlass key={post.id} style={styles.postCard}>
            <Image
              source={{ uri: post.media_url }}
              style={styles.postImage}
              resizeMode="cover"
            />
            <View style={styles.postOverlay}>
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={[styles.postActionButton, post.is_visible ? styles.visibleButton : styles.hiddenButton]}
                  onPress={() => handleToggleVisibility(post.id)}
                >
                  {post.is_visible ? (
                    <Eye size={16} color={COLORS.white} />
                  ) : (
                    <EyeOff size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.postActionButton, styles.deleteButton]}
                  onPress={() => handleDeletePost(post.id)}
                >
                  <Trash2 size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
            {post.caption && (
              <Text style={styles.postCaption} numberOfLines={2}>
                {post.caption}
              </Text>
            )}
            <Text style={styles.postDate}>{formatDate(post.timestamp)}</Text>
          </ContentGlass>
        ))}
      </View>

      {posts.length === 0 && (
        <View style={styles.emptyState}>
          <Instagram size={64} color={COLORS.textLight} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>No Instagram posts found</Text>
          <Text style={styles.emptySubtext}>Fetch posts from Instagram to get started</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      <ContentGlass style={styles.settingsCard}>
        <View style={styles.settingsHeader}>
          <Key size={20} color={COLORS.primary} />
          <Text style={styles.settingsTitle}>Instagram API Configuration</Text>
        </View>

        <Text style={styles.label}>Access Token *</Text>
        <TextInput
          style={styles.input}
          value={accessToken}
          onChangeText={setAccessToken}
          placeholder="Enter Instagram access token"
          placeholderTextColor={COLORS.textLight}
          secureTextEntry
          autoCapitalize="none"
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            To get an Instagram access token:
            {'\n'}1. Go to Facebook Developers Console
            {'\n'}2. Create an app with Instagram Basic Display
            {'\n'}3. Generate a long-lived access token
            {'\n'}4. Paste it above
          </Text>
        </View>

        {settings.last_fetched_at && (
          <View style={styles.lastFetchedContainer}>
            <RefreshCw size={14} color={COLORS.textLight} />
            <Text style={styles.lastFetchedText}>
              Last fetched: {formatDate(settings.last_fetched_at)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveSettings}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Save size={16} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </ContentGlass>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return renderPostsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Instagram size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Instagram Manager</Text>
        </View>
        <Text style={styles.headerSubtitle}>Manage Instagram posts and settings</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab) => {
          const IconComponent = tab.IconComponent;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <IconComponent size={16} color={activeTab === tab.id ? COLORS.primary : COLORS.textLight} />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING[4],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  headerTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 60,
  },
  tab: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    marginHorizontal: SPACING[1],
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  tabActive: {
    backgroundColor: COLORS.primary + '20',
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.medium,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.bold,
  },
  tabContent: {
    flex: 1,
    padding: SPACING[4],
  },
  fetchButtonContainer: {
    marginBottom: SPACING[4],
  },
  fetchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
  },
  fetchButtonDisabled: {
    opacity: 0.5,
  },
  fetchButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -CARD_MARGIN,
  },
  postCard: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: COLORS.lightGray,
  },
  postOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: SPACING[2],
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING[2],
  },
  postActionButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibleButton: {
    backgroundColor: COLORS.success + 'CC',
  },
  hiddenButton: {
    backgroundColor: COLORS.textLight + 'CC',
  },
  deleteButton: {
    backgroundColor: COLORS.error + 'CC',
  },
  postCaption: {
    padding: SPACING[2],
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.text,
  },
  postDate: {
    paddingHorizontal: SPACING[2],
    paddingBottom: SPACING[2],
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.textLight,
  },
  settingsCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  settingsTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING[3],
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  infoBox: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: RADIUS.md,
    padding: SPACING[3],
    marginBottom: SPACING[3],
  },
  infoText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.text,
    lineHeight: 20,
  },
  lastFetchedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    marginBottom: SPACING[3],
  },
  lastFetchedText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
  },
  emptyState: {
    padding: SPACING[12],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: SPACING[4],
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
});

export default InstagramManagerScreen;
