import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const ghostFade = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(ghostFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(ghostScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timeout = setTimeout(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          router.replace('/(main)/camera');
        } else {
          router.replace('/(auth)/login');
        }
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [fadeAnim, scaleAnim, ghostFade, ghostScale, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />
      <Animated.Text
        style={[
          styles.ghost,
          {
            opacity: ghostFade,
            transform: [{ scale: ghostScale }],
          },
        ]}
      >
        👻
      </Animated.Text>
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        SNAPORA
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          { opacity: fadeAnim },
        ]}
      >
        Anı Yakala, Paylaş
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFC00',
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 12,
    letterSpacing: 2,
  },
});
