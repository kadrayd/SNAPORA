import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const captureScale = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashEnabled((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleTorch = useCallback(() => {
    setTorchEnabled((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(captureScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(captureScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo) {
        router.push({
          pathname: '/(main)/preview',
          params: { uri: photo.uri },
        });
      }
    } catch {
      // Camera capture failed silently
    }
  }, [captureScale, flashOpacity, router]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar style="light" backgroundColor="#000000" />
        <Ionicons name="camera-outline" size={64} color="#FFFC00" />
        <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
        <Text style={styles.permissionText}>
          Fotoğraf çekebilmek için kamera iznine ihtiyacımız var.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flashEnabled ? 'on' : 'off'}
        enableTorch={torchEnabled}
      >
        {/* Flash effect overlay */}
        <Animated.View
          style={[styles.flashOverlay, { opacity: flashOpacity }]}
          pointerEvents="none"
        />

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.push('/(main)/profile')}
          >
            <Ionicons name="person-circle-outline" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.topTitle}>SNAPORA</Text>

          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.push('/(main)/chats')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Right side panel */}
        <View style={styles.rightPanel}>
          <TouchableOpacity
            style={[styles.sideButton, flashEnabled && styles.sideButtonActive]}
            onPress={toggleFlash}
          >
            <Ionicons
              name={flashEnabled ? 'flash' : 'flash-off'}
              size={22}
              color={flashEnabled ? '#000000' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sideButton, torchEnabled && styles.sideButtonActive]}
            onPress={toggleTorch}
          >
            <Ionicons
              name={torchEnabled ? 'sunny' : 'sunny-outline'}
              size={22}
              color={torchEnabled ? '#000000' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} onPress={toggleFacing}>
            <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomSideButton}>
            <Ionicons name="images-outline" size={28} color="#FFFFFF" />
            <Text style={styles.bottomLabel}>Galeri</Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: captureScale }] }}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              activeOpacity={0.7}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.bottomSideButton}>
            <Ionicons name="videocam-outline" size={28} color="#FFFFFF" />
            <Text style={styles.bottomLabel}>Video</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rightPanel: {
    position: 'absolute',
    right: 16,
    top: '40%',
    gap: 16,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonActive: {
    backgroundColor: '#FFFC00',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  bottomSideButton: {
    alignItems: 'center',
    gap: 4,
  },
  bottomLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#FFFC00',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  permissionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
});
