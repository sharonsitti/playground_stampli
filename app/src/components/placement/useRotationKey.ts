import { useEffect } from 'react'

export function useRotationKey(onRotate: () => void): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'r' || event.key === 'R') {
        onRotate()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onRotate])
}
