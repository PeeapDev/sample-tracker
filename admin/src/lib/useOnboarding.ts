import { useEffect, useState } from 'react'
import { useAuth } from './auth'

/**
 * First-login onboarding state.
 *
 * Completion is persisted in localStorage, keyed per user:
 *   nsrtms_onboarded_<userId> = '1'
 *
 * On login, if the current user has no such key, the wizard auto-shows once.
 * `open()` re-opens it on demand (e.g. from a Help button) without touching
 * the auto-show logic. `close()` always marks the user as onboarded.
 */
export function useOnboarding() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)

  const key = user ? `nsrtms_onboarded_${user.id}` : null

  // Auto-show once per user when they haven't completed onboarding yet.
  useEffect(() => {
    if (!key) {
      setShow(false)
      return
    }
    if (localStorage.getItem(key) !== '1') {
      setShow(true)
    }
  }, [key])

  function close() {
    if (key) localStorage.setItem(key, '1')
    setShow(false)
  }

  function open() {
    setShow(true)
  }

  return { show, open, close }
}
