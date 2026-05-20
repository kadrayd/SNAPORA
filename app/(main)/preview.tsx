import { useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PreviewScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const retakeScale = useRef(new Animated.Value(1)).current;
  const sendScale = useRef(new Animated.Value(1)).current;

  const animateButton = (scaleRef: Animated.Value) => {
    Animated.sequence([
      Animated.timing(scaleRef, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleRef, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateButton(retakeScale);
    setTimeout(() => {
      router.replace('/(main)/camera');
    }, 150);
  };

  const handleSend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateButton(sendScale);
    setTimeout(() => {
      router.replace('/(main)/camera');
    }, 150);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />

      {uri ? (
        <Image
          source={{ uri }}
          style={styles.preview}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noImage}>
          <Ionicons name="image-outline" size={64} color="#333333" />
          <Text style={styles.noImageText}>Fotoğraf yüklenemedi</Text>
        </View>
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeButton} onPress={handleRetake}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Animated.View style={{ transform: [{ scale: retakeScale }] }}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetake}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
            <Text style={styles.retakeText}>Tekrar Çek</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Text style={styles.sendText}>Gönder</Text>
            <Ionicons name="send" size={20} color="#000000" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  preview: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noImageText: {
    color: '#666666',
    fontSize: 16,
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
  },
  retakeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFC00',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
  },
  sendText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
});
