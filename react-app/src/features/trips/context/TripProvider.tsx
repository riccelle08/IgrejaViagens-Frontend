import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { listTrips } from '../api/tripApi'
import type { TripSummary } from '../model/tripTypes'
import {
  clearActiveTripId,
  readActiveTripId,
  writeActiveTripId,
} from '../storage/activeTripStorage'
import { TripContext } from './tripContext'

function getLoadError(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar as viagens.'
}

export function TripProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const [trips, setTrips] = useState<TripSummary[]>([])
  const [activeTripId, setActiveTripId] = useState<string | null>(
    readActiveTripId,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)

  const reloadTrips = useCallback(() => {
    setIsLoading(true)
    setErrorMessage(null)

    void listTrips()
      .then((loadedTrips) => setTrips(loadedTrips))
      .catch((error: unknown) => {
        setTrips([])
        setErrorMessage(getLoadError(error))
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    let isCurrent = true

    void listTrips()
      .then((loadedTrips) => {
        if (isCurrent) setTrips(loadedTrips)
      })
      .catch((error: unknown) => {
        if (!isCurrent) return
        setTrips([])
        setErrorMessage(getLoadError(error))
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const availableTrips = useMemo(() => {
    if (!user) return []
    if (user.role === 'admin') return trips

    return trips.filter((trip) => trip.travelerCpfs.includes(user.cpf))
  }, [trips, user])

  const activeTrip = useMemo(
    () => availableTrips.find((trip) => trip.id === activeTripId) ?? null,
    [activeTripId, availableTrips],
  )

  const selectTrip = useCallback(
    (tripId: string) => {
      if (!availableTrips.some((trip) => trip.id === tripId)) return

      writeActiveTripId(tripId)
      setActiveTripId(tripId)
      setIsSelectorOpen(false)
    },
    [availableTrips],
  )

  const clearActiveTrip = useCallback(() => {
    clearActiveTripId()
    setActiveTripId(null)
  }, [])

  const contextValue = useMemo(
    () => ({
      activeTrip,
      activeTripId,
      availableTrips,
      errorMessage,
      isLoading,
      isSelectorOpen,
      clearActiveTrip,
      closeSelector: () => setIsSelectorOpen(false),
      openSelector: () => setIsSelectorOpen(true),
      reloadTrips,
      selectTrip,
    }),
    [
      activeTrip,
      activeTripId,
      availableTrips,
      clearActiveTrip,
      errorMessage,
      isLoading,
      isSelectorOpen,
      reloadTrips,
      selectTrip,
    ],
  )

  return (
    <TripContext.Provider value={contextValue}>{children}</TripContext.Provider>
  )
}
