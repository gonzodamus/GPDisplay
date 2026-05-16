export async function loadConfig() {
  try {
    const res = await fetch('/api/config')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const config = await res.json()
    const { theme } = config
    if (theme) {
      document.documentElement.style.setProperty('--gp-bg', theme.background)
      document.documentElement.style.setProperty('--gp-fg', theme.foreground)
      document.documentElement.style.setProperty('--gp-accent', theme.accent)
    }
    return config
  } catch (err) {
    console.error('loadConfig failed, retrying in 3s:', err)
    return new Promise((resolve) => {
      setTimeout(() => resolve(loadConfig()), 3000)
    })
  }
}
