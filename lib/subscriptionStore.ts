import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { refreshUserAddOns } from './profile'

type AddOn = 'core' | 'defi' | 'whale' | 'magnum'

interface SubscriptionState {
  addOns: AddOn[]
  isLoaded: boolean
  isLoading: boolean
  
  // Actions
  setAddOns: (addOns: AddOn[]) => void
  addAddOn: (addOn: AddOn) => void
  removeAddOn: (addOn: AddOn) => void
  hasFeature: (feature: AddOn) => boolean
  hasCore: () => boolean
  hasDeFi: () => boolean
  hasWhale: () => boolean
  refreshProfile: () => Promise<void>
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      addOns: [],
      isLoaded: false,
      isLoading: false,

      setAddOns: (addOns) => set({ addOns, isLoaded: true }),
      
      addAddOn: (addOn) => set((state) => ({
        addOns: state.addOns.includes(addOn) ? state.addOns : [...state.addOns, addOn]
      })),
      
      removeAddOn: (addOn) => set((state) => ({
        addOns: state.addOns.filter(a => a !== addOn)
      })),
      
      hasFeature: (feature) => {
        const { addOns } = get()
        return addOns.includes(feature)
      },
      
      hasCore: () => get().hasFeature('core'),
      hasDeFi: () => get().hasFeature('defi'),
      hasWhale: () => get().hasFeature('whale'),
      hasMagnum: () => get().hasFeature('magnum'),

      refreshProfile: async () => {
        set({ isLoading: true })
        try {
          const addOns = await refreshUserAddOns()
          set({ 
            addOns: addOns as AddOn[], 
            isLoaded: true,
            isLoading: false 
          })
        } catch (error) {
          console.error('Failed to refresh profile:', error)
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'kryptotrac-subscription',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
