import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const CORRECT_CODE = '1234';

export default function VerificationScreen() {
  const router = useRouter();
  const { completeAuth } = useAuth();
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const isVerifyingRef = useRef(false);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const verifyCode = useCallback(async (fullCode: string) => {
    // Защита от повторных вызовов
    if (isVerifyingRef.current) return;
    
    if (fullCode.length !== 4) return;
    
    isVerifyingRef.current = true;
    
    try {
      if (fullCode === CORRECT_CODE) {
        await completeAuth();
      } else {
        setError('Неверный код');
        setCode(['', '', '', '']);
        inputRefs.current[0]?.focus();

        Animated.sequence([
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } finally {
      isVerifyingRef.current = false;
    }
  }, [completeAuth, shakeAnimation]);

  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 4 && !isVerifyingRef.current) {
      verifyCode(fullCode);
    }
  }, [code, verifyCode]);

  const handleCodeChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    setError('');

    if (text && index < 3) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              testID="back-button"
            >
              <ArrowLeft color="#000000" size={24} strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Введите код</Text>
              <Text style={styles.subtitle}>
                Мы отправили код подтверждения{' \n'}на указанный номер телефона
              </Text>
              <Text style={styles.hint}>Используйте код: 1234</Text>
            </View>

            <View style={styles.codeContainer}>
              <Animated.View
                style={[
                  styles.codeInputRow,
                  { transform: [{ translateX: shakeAnimation }] },
                ]}
              >
                {code.map((digit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.codeInputWrapper,
                      digit && styles.codeInputWrapperFilled,
                      error && styles.codeInputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={styles.codeInput}
                      value={digit}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onBlur={() => {
                        // Для веб-версии: проверяем код при потере фокуса
                        // Используем setTimeout чтобы убедиться, что состояние обновлено
                        if (Platform.OS === 'web') {
                          setTimeout(() => {
                            setCode((currentCode) => {
                              const fullCode = currentCode.join('');
                              if (fullCode.length === 4 && !isVerifyingRef.current) {
                                verifyCode(fullCode);
                              }
                              return currentCode;
                            });
                          }, 0);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      testID={`code-input-${index}`}
                    />
                  </View>
                ))}
              </Animated.View>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity testID="resend-button">
                <Text style={styles.resendText}>Отправить код повторно</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  codeContainer: {
    alignItems: 'center',
  },
  codeInputRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  codeInputWrapper: {
    width: 56,
    height: 64,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  codeInputWrapperFilled: {
    borderColor: '#EF3124',
    backgroundColor: '#FFFFFF',
  },
  codeInputWrapperError: {
    borderColor: '#EF3124',
    backgroundColor: '#FEF2F2',
  },
  codeInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: '#EF3124',
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF3124',
  },
});

