import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  photoURL: string;
  snapCount: number;
  storyCount: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    bio: '',
    photoURL: '',
    snapCount: 0,
    storyCount: 0,
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const editSlide = useRef(new Animated.Value(300)).current;
  const photoSlide = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            name: data.name ?? user.displayName ?? 'Kullanıcı',
            email: data.email ?? user.email ?? '',
            bio: data.bio ?? '',
            photoURL: data.photoURL ?? '',
            snapCount: data.snapCount ?? 0,
            storyCount: data.storyCount ?? 0,
          });
        } else {
          setProfile({
            name: user.displayName ?? 'Kullanıcı',
            email: user.email ?? '',
            bio: '',
            photoURL: '',
            snapCount: 0,
            storyCount: 0,
          });
        }
      } catch {
        setProfile({
          name: auth.currentUser?.displayName ?? 'Kullanıcı',
          email: auth.currentUser?.email ?? '',
          bio: '',
          photoURL: '',
          snapCount: 0,
          storyCount: 0,
        });
      }
    };

    loadProfile();
  }, []);

  const openEditModal = useCallback(() => {
    setEditName(profile.name);
    setEditBio(profile.bio);
    setEditModalVisible(true);
    Animated.spring(editSlide, {
      toValue: 0,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [profile, editSlide]);

  const closeEditModal = useCallback(() => {
    Animated.timing(editSlide, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setEditModalVisible(false));
  }, [editSlide]);

  const saveProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName.trim(),
        bio: editBio.trim(),
      });
      setProfile((prev) => ({
        ...prev,
        name: editName.trim(),
        bio: editBio.trim(),
      }));
      closeEditModal();
    } catch {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    }
  }, [editName, editBio, closeEditModal]);

  const openPhotoModal = useCallback(() => {
    setPhotoModalVisible(true);
    Animated.spring(photoSlide, {
      toValue: 0,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [photoSlide]);

  const closePhotoModal = useCallback(() => {
    Animated.timing(photoSlide, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setPhotoModalVisible(false));
  }, [photoSlide]);

  const pickImage = useCallback(
    async (source: 'camera' | 'gallery') => {
      closePhotoModal();

      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Hata', 'Kamera izni gerekli.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Hata', 'Galeri izni gerekli.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setProfile((prev) => ({ ...prev, photoURL: uri }));

        const user = auth.currentUser;
        if (user) {
          try {
            await updateDoc(doc(db, 'users', user.uid), { photoURL: uri });
          } catch {
            // Photo update failed
          }
        }
      }
    },
    [closePhotoModal]
  );

  const handleSignOut = useCallback(async () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace('/(auth)/login');
          } catch {
            Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
          }
        },
      },
    ]);
  }, [router]);

  const menuItems = [
    { icon: 'notifications-outline' as const, label: 'Bildirimler', color: '#FFFC00' },
    { icon: 'lock-closed-outline' as const, label: 'Gizlilik', color: '#A855F7' },
    { icon: 'help-circle-outline' as const, label: 'Yardım', color: '#34D399' },
    { icon: 'information-circle-outline' as const, label: 'Hakkında', color: '#60A5FA' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(main)/camera')}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={openPhotoModal}>
            {profile.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person" size={48} color="#666666" />
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={14} color="#000000" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          {profile.bio ? (
            <Text style={styles.profileBio}>{profile.bio}</Text>
          ) : null}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.snapCount}</Text>
              <Text style={styles.statLabel}>Snap</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.storyCount}</Text>
              <Text style={styles.statLabel}>Hikaye</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
            <Ionicons name="create-outline" size={18} color="#000000" />
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#333333" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.signOutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeEditModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: editSlide }] },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Profili Düzenle</Text>

              <Text style={styles.modalLabel}>İsim</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="İsminizi girin"
                placeholderTextColor="#666666"
              />

              <Text style={styles.modalLabel}>Biyografi</Text>
              <TextInput
                style={[styles.modalInput, styles.bioInput]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Biyografinizi girin"
                placeholderTextColor="#666666"
                multiline
                maxLength={150}
              />

              <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Photo Source Modal */}
      <Modal visible={photoModalVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closePhotoModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: photoSlide }] },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Fotoğraf Seç</Text>

              <TouchableOpacity
                style={styles.photoOption}
                onPress={() => pickImage('camera')}
              >
                <Ionicons name="camera-outline" size={24} color="#FFFC00" />
                <Text style={styles.photoOptionText}>Kamera ile Çek</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoOption}
                onPress={() => pickImage('gallery')}
              >
                <Ionicons name="images-outline" size={24} color="#A855F7" />
                <Text style={styles.photoOptionText}>Galeriden Seç</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFC00',
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#333333',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFC00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 14,
  },
  profileEmail: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 4,
  },
  profileBio: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 40,
    gap: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFC00',
  },
  statLabel: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#333333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFC00',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
    gap: 8,
  },
  editButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  menuSection: {
    marginTop: 30,
    marginHorizontal: 20,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginHorizontal: 20,
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  modalLabel: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FFFC00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  photoOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
