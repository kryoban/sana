import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Start with false to match SSR - this ensures hydration matches
  // We use a function initializer to ensure it's always false during SSR
  const [isMobile, setIsMobile] = React.useState<boolean>(() => false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // Mark as mounted after hydration is complete
    setMounted(true)
    
    // Check if we're on mobile
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
    }
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      checkMobile()
    }
    
    // Initial check
    checkMobile()
    
    // Listen for changes
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return false during SSR and initial render to prevent hydration mismatch
  // Only return the actual value after the component has mounted (post-hydration)
  // This ensures server and client render the same HTML initially
  if (typeof window === "undefined") {
    return false
  }
  
  return mounted ? isMobile : false
}
