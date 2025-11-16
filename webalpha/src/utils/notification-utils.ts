export type NotificationPermission = 'default' | 'granted' | 'denied'

export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * Запрашивает разрешение на показ уведомлений
 * @returns Promise с результатом запроса ('granted' | 'denied' | 'default')
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('[Notifications] Notifications are not supported in this browser')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    console.warn('[Notifications] Notification permission was previously denied')
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('[Notifications] Error requesting permission:', error)
    return 'denied'
  }
}

/**
 * Показывает уведомление с заданными параметрами
 * @param title - Заголовок уведомления
 * @param options - Опции уведомления (body, icon, badge, sound и т.д.)
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!isNotificationSupported()) {
    console.warn('[Notifications] Notifications are not supported')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Notifications] Permission not granted, cannot show notification')
    return
  }

  try {
    const notification = new Notification(title, {
      badge: '/vite.svg', 
      icon: '/vite.svg', // Иконка уведомления
      requireInteraction: false, 
      silent: false,
      ...options,
    })

    setTimeout(() => {
      notification.close()
    }, 5000)

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch (error) {
    console.error('[Notifications] Error showing notification:', error)
  }
}

/**
 * Показывает уведомление о готовом ответе от LLM
 * @param chatTitle - Название чата
 * @param preview - Превью ответа (первые несколько слов)
 */
export function showLLMResponseNotification(chatTitle: string, preview?: string): void {
  const title = 'Новый ответ от помощника'
  const body = preview 
    ? `${chatTitle}: ${preview.slice(0, 100)}${preview.length > 100 ? '...' : ''}`
    : `Получен ответ в чате "${chatTitle}"`

  showNotification(title, {
    body,
    tag: 'llm-response', 
    badge: '/vite.svg',
    icon: '/vite.svg',
  })
}

