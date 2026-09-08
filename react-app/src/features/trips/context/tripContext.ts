import { createContext } from 'react'
import type { TripSummary } from '../model/tripTypes'

export interface TripContextValue {
  activeTrip: TripSummary | null
  activeTripId: string | null
  availableTrips: TripSummary[]
  errorMessage: string | null
  isLoading: boolean
  isSelectorOpen: boolean
  clearActiveTrip: () => void
  closeSelector: () => void
  openSelector: () => void
  reloadTrips: () => void
  selectTrip: (tripId: string) => void
}

export const TripContext = createContext<TripContextValue | null>(null)
