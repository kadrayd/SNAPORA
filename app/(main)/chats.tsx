import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageAt: Date | null;
  participants: string[];
  createdBy: string;
}

export default function ChatsScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const modalSlide = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList: Chat[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name ?? '',
          lastMessage: data.lastMessage ?? '',
          lastMessageAt: data.lastMessageAt?.toDate?.() ?? null,
          participants: data.participants ?? [],
          createdBy: data.createdBy ?? '',
        };
      });
      setChats(chatList);
    });

    return unsubscribe;
  }, []);

  const openModal = useCallback(() => {
    setModalVisible(true);
    Animated.spring(modalSlide, {
      toValue: 0,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [modalSlide]);

  const closeModal = useCallback(() => {
    Animated.timing(modalSlide, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setNewChatName('');
    });
  }, [modalSlide]);

  const createChat = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !newChatName.trim()) return;

    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        name: newChatName.trim(),
        participants: [user.uid],
        createdBy: user.uid,
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
      });

      closeModal();
      router.push({
        pathname: '/(main)/chat/[id]',
        params: { id: chatRef.id, name: newChatName.trim() },
      });
    } catch {
      // Chat creation failed
    }
  }, [newChatName, closeModal, router]);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes}dk`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}sa`;
    return `${Math.floor(hours / 24)}g`;
  };

  const renderChat = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() =>
        router.push({
          pathname: '/(main)/chat/[id]',
          params: { id: item.id, name: item.name },
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.chatLastMsg} numberOfLines={1}>
          {item.lastMessage || 'Henüz mesaj yok'}
        </Text>
      </View>
      <Text style={styles.chatTime}>{formatTime(item.lastMessageAt)}</Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Sohbetler</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={openModal}>
          <Ionicons name="create-outline" size={24} color="#FFFC00" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Sohbet ara..."
          placeholderTextColor="#666666"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Chat list */}
      {filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#333333" />
          <Text style={styles.emptyTitle}>Sohbete Başla</Text>
          <Text style={styles.emptyText}>
            Sağ üstteki kalem ikonuna tıklayarak yeni bir sohbet başlatabilirsin.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* New Chat Modal */}
      <Modal visible={modalVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Animated.View
              style={[
                styles.modalContent,
                { transform: [{ translateY: modalSlide }] },
              ]}
            >
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Yeni Sohbet</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Sohbet adı girin..."
                  placeholderTextColor="#666666"
                  value={newChatName}
                  onChangeText={setNewChatName}
                  autoFocus
                />
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    !newChatName.trim() && styles.modalButtonDisabled,
                  ]}
                  onPress={createChat}
                  disabled={!newChatName.trim()}
                >
                  <Text style={styles.modalButtonText}>Oluştur</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
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
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
  chatList: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#A855F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 14,
  },
  chatName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  chatLastMsg: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 3,
  },
  chatTime: {
    color: '#666666',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 22,
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
  modalInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#FFFC00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.4,
  },
  modalButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
  },
});
