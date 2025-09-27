import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "andes-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
      
      // Update user preferences in local storage
      const savedUser = localStorage.getItem('andes_user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        if (userData.preferences) {
          userData.preferences.theme = theme
          localStorage.setItem('andes_user', JSON.stringify(userData))
          
          // Update in users storage
          const existingUsers = JSON.parse(localStorage.getItem('andes_users') || '{}')
          if (existingUsers[userData.nametag]) {
            existingUsers[userData.nametag].preferences = {
              ...existingUsers[userData.nametag].preferences,
              theme
            }
            localStorage.setItem('andes_users', JSON.stringify(existingUsers))
          }
        }
      }
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}