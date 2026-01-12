import { create } from 'zustand'

interface CryptoData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  sparkline_in_7d?: {
    price: number[]
  }
}

interface Portfolio {
  totalValue: number
  totalChange: number
  totalChangePercent: number
  holdings: Array<{
    coinId: string
    amount: number
    avgPrice: number
  }>
}

interface AppState {
  cryptos: CryptoData[]
  portfolio: Portfolio | null
  watchlist: string[]
  userTier: 'free' | 'silver' | 'gold' | 'platinum'
  connectedWallet: string | null
  isLoading: boolean
  lastUpdate: Date | null
  
  // Actions
  setCryptos: (cryptos: CryptoData[]) => void
  setPortfolio: (portfolio: Portfolio) => void
  addToWatchlist: (coinId: string) => void
  removeFromWatchlist: (coinId: string) => void
  setUserTier: (tier: 'free' | 'silver' | 'gold' | 'platinum') => void
  setConnectedWallet: (address: string | null) => void
  setLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  cryptos: [],
  portfolio: null,
  watchlist: [],
  userTier: 'free',
  connectedWallet: null,
  isLoading: false,
  lastUpdate: null,

  setCryptos: (cryptos) => set({ cryptos, lastUpdate: new Date() }),
  setPortfolio: (portfolio) => set({ portfolio }),
  addToWatchlist: (coinId) => set((state) => ({
    watchlist: [...state.watchlist, coinId]
  })),
  removeFromWatchlist: (coinId) => set((state) => ({
    watchlist: state.watchlist.filter(id => id !== coinId)
  })),
  setUserTier: (tier) => set({ userTier: tier }),
  setConnectedWallet: (address) => set({ connectedWallet: address }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
