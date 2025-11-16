import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const CORRECT_CODE = '1234'

export default function Verification() {
  const navigate = useNavigate()
  const { completeAuth } = useAuth()
  const [code, setCode] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [shake, setShake] = useState(false)

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const verifyCode = async (fullCode: string) => {
    if (fullCode.length !== 4) return

    if (fullCode === CORRECT_CODE) {
      await completeAuth()
    } else {
      setError('Неверный код')
      setCode(['', '', '', ''])
      inputRefs.current[0]?.focus()
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  useEffect(() => {
    const fullCode = code.join('')
    if (fullCode.length === 4) {
      verifyCode(fullCode)
    }
  }, [code])

  const handleCodeChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return

    const newCode = [...code]
    newCode[index] = text
    setCode(newCode)
    setError('')

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/auth/phone')} className="mb-6">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>

        <h1 className="text-3xl font-bold text-foreground mb-3">Введите код</h1>
        <p className="text-muted-foreground mb-3 leading-relaxed">
          Мы отправили код подтверждения{' \n'}на указанный номер телефона
        </p>
        <p className="text-sm text-accent italic">Используйте код: 1234</p>

        <div className="flex justify-center mt-10">
          <div className={`flex gap-3 ${shake ? 'animate-shake' : ''}`}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                value={digit}
                onChange={(e) => handleCodeChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyPress(e, index)}
                className={`w-14 h-16 text-2xl font-bold text-center rounded-xl border-2 ${
                  digit
                    ? 'border-primary bg-white'
                    : error
                    ? 'border-destructive bg-destructive/10'
                    : 'border-input bg-muted'
                } focus:outline-none focus:ring-2 focus:ring-primary`}
                maxLength={1}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-destructive text-center mt-4">{error}</p>}

        <div className="mt-auto flex justify-center">
          <button className="text-primary text-sm font-medium mt-8">Отправить код повторно</button>
        </div>
      </div>
    </div>
  )
}