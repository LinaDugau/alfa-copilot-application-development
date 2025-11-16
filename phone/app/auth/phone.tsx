import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');

  const formatPhone = (text: string) => {
    let numbers = text.replace(/\D/g, '');

    if (numbers.startsWith('8')) {
      numbers = '7' + numbers.slice(1);
    }

    if (!numbers.startsWith('7')) {
      numbers = '7' + numbers;
    }
    
    const withoutCountryCode = numbers.slice(1);
    
    if (withoutCountryCode.length === 0) return '+7 ';
    if (withoutCountryCode.length <= 3) return `+7 (${withoutCountryCode}`;
    if (withoutCountryCode.length <= 6) return `+7 (${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3)}`;
    if (withoutCountryCode.length <= 8) return `+7 (${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
    return `+7 (${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6, 8)}-${withoutCountryCode.slice(8, 10)}`;
  };

  const handlePhoneChange = (text: string) => {
    let numbers = text.replace(/\D/g, '');
    
    if (numbers.startsWith('8')) {
      numbers = '7' + numbers.slice(1);
    }
    
    if (!numbers.startsWith('7')) {
      numbers = '7' + numbers;
    }
    
    if (numbers.length <= 11) {
      setPhone(formatPhone(text));
    }
  };

  const handleContinue = () => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      router.push('/auth/verification');
    }
  };

  const isValid = phone.replace(/\D/g, '').length === 11;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Вход</Text>
              <Text style={styles.subtitle}>
                Укажите номер телефона,{' \n'}на который зарегистрирован аккаунт
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Телефон</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="+7 (___) ___-__-__"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={18}
                autoFocus
                testID="phone-input"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                !isValid && styles.buttonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!isValid}
              activeOpacity={0.8}
              testID="continue-button"
            >
              <Text style={[
                styles.buttonText,
                !isValid && styles.buttonTextDisabled,
              ]}>Продолжить</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Нажимая «Продолжить», вы соглашаетесь{' \n'}с условиями обработки персональных данных
            </Text>
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
    paddingTop: 24,
    paddingBottom: 32,
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
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    fontSize: 17,
    color: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    fontWeight: '400',
  },
  button: {
    backgroundColor: '#EF3124',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
  disclaimer: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 24,
  },
});

