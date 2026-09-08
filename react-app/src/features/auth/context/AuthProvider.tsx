import { useCallback, useMemo, useState, type PropsWithChildren } from 'react'
import type { AuthUser } from '../model/authTypes'
import {
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
} from '../storage/authSession'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(readAuthSession)

  const signIn = useCallback((authenticatedUser: AuthUser) => {
    writeAuthSession(authenticatedUser)
    setUser(authenticatedUser)
  }, [])

  const signOut = useCallback(() => {
    clearAuthSession()
    setUser(null)
  }, [])

  const contextValue = useMemo(
    () => ({ user, signIn, signOut }),
    [signIn, signOut, user],
  )

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}
