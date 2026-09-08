import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useTrip } from '../../trips/hooks/useTrip'
import { useAuth } from './useAuth'

export function useLogout() {
  const { signOut } = useAuth()
  const { clearActiveTrip } = useTrip()
  const navigate = useNavigate()

  return useCallback(() => {
    clearActiveTrip()
    signOut()
    void navigate('/', { replace: true })
  }, [clearActiveTrip, navigate, signOut])
}
