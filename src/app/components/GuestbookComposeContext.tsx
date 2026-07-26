'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export const GUESTBOOK_NOTE_COLORS = [
  '#ffe8a3', // yellow
  '#ffd0d6', // pink
  '#c8e7ff', // blue
  '#d8f5c8', // green
  '#e6d4ff', // lilac
  '#ffd8b8', // peach
] as const

type GuestbookComposeContextValue = {
  noteColor: string
  setNoteColor: (color: string) => void
  boardReady: boolean
  setBoardReady: (ready: boolean) => void
  registerPinHandler: (handler: (() => void) | null) => void
  requestPin: () => void
}

const GuestbookComposeContext = createContext<GuestbookComposeContextValue | null>(null)

export function GuestbookComposeProvider({ children }: { children: ReactNode }) {
  const [noteColor, setNoteColor] = useState<string>(GUESTBOOK_NOTE_COLORS[0])
  const [boardReady, setBoardReady] = useState(false)
  const pinHandlerRef = useRef<(() => void) | null>(null)

  const registerPinHandler = useCallback((handler: (() => void) | null) => {
    pinHandlerRef.current = handler
  }, [])

  const requestPin = useCallback(() => {
    pinHandlerRef.current?.()
  }, [])

  const value = useMemo(
    () => ({
      noteColor,
      setNoteColor,
      boardReady,
      setBoardReady,
      registerPinHandler,
      requestPin,
    }),
    [boardReady, noteColor, registerPinHandler, requestPin]
  )

  return (
    <GuestbookComposeContext.Provider value={value}>
      {children}
    </GuestbookComposeContext.Provider>
  )
}

export function useGuestbookCompose() {
  const ctx = useContext(GuestbookComposeContext)
  if (!ctx) {
    throw new Error('useGuestbookCompose must be used within GuestbookComposeProvider')
  }
  return ctx
}
