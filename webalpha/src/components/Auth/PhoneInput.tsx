import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PhoneInput() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')

  const formatPhone = (text: string) => {
    let numbers = text.replace(/\D/g, '')

    if (numbers.startsWith('8')) {
      numbers = '7' + numbers.slice(1)
    }
    if (!numbers.startsWith('7')) {
      numbers = '7' + numbers
    }

    const withoutCountryCode = numbers.slice(1)

    if (withoutCountryCode.length === 0) return '+7 '
    if (withoutCountryCode.length <= 3) return `+7 (${withoutCountryCode}`
    if (withoutCountryCode.length <= 6) return `+7 (${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3)}`
    if (withoutCountryCode.length <= 8) return `+7 (${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`
    return `+7 (${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6, 8)}-${withoutCountryCode.slice(8, 10)}`
  }

  const handlePhoneChange = (text: string) => {
    let numbers = text.replace(/\D/g, '')

    if (numbers.startsWith('8')) {
      numbers = '7' + numbers.slice(1)
    }
    if (!numbers.startsWith('7')) {
      numbers = '7' + numbers
    }

    if (numbers.length <= 11) {
      setPhone(formatPhone(text))
    }
  }

  const handleContinue = () => {
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length === 11) {
      navigate('/auth/verification')
    }
  }

  const isValid = phone.replace(/\D/g, '').length === 11

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-foreground mb-3">Вход</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Укажите номер телефона,{' \n'}на который зарегистрирован аккаунт
        </p>

        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">Телефон</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            className="w-full px-3 py-4 border-b border-input text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <button
          className={`w-full py-4 rounded-lg font-semibold ${isValid ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
          onClick={handleContinue}
          disabled={!isValid}
        >
          Продолжить
        </button>

        <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
          Нажимая «Продолжить», вы соглашаетесь{' \n'}с условиями обработки персональных данных
        </p>
      </div>
    </div>
  )
}