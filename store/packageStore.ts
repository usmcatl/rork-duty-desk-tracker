import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Package, PackageStatus } from '@/types/package';

interface PackageState {
  packages: Package[];
  addPackage: (packageData: Omit<Package, 'id' | 'arrivalDate' | 'status'>) => string;
  updatePackage: (packageData: Package) => void;
  removePackage: (id: string) => void;
  markAsPickedUp: (id: string, handOffBy: string, pickupNotes?: string) => void;
  getPackagesByMember: (memberId: string) => Package[];
  massUpdateStorageLocation: (packageIds: string[], newLocation: string) => void;
  setPackages: (packages: Package[]) => void;
  clearAllData: () => void;
}

// Empty array for fresh app start
const samplePackages: Package[] = [];

export const usePackageStore = create<PackageState>()(
  persist(
    (set, get) => ({
      packages: samplePackages,
      
      addPackage: (packageData) => {
        const id = Date.now().toString();
        set((state) => ({
          packages: [
            ...state.packages,
            {
              ...packageData,
              id,
              status: 'pending' as PackageStatus,
              arrivalDate: new Date(),
            },
          ],
        }));
        return id;
      },
      
      updatePackage: (updatedPackage) => set((state) => ({
        packages: state.packages.map((pkg) => 
          pkg.id === updatedPackage.id ? updatedPackage : pkg
        ),
      })),
      
      removePackage: (id) => set((state) => ({
        packages: state.packages.filter((pkg) => pkg.id !== id),
      })),
      
      markAsPickedUp: (id, handOffBy, pickupNotes) => set((state) => ({
        packages: state.packages.map((pkg) => {
          if (pkg.id === id) {
            return {
              ...pkg,
              status: 'picked-up' as PackageStatus,
              pickupDate: new Date(),
              handOffBy,
              notes: pickupNotes ? `${pkg.notes || ''}
Pickup: ${pickupNotes}`.trim() : pkg.notes,
            };
          }
          return pkg;
        }),
      })),
      
      getPackagesByMember: (memberId) => {
        return get().packages.filter(pkg => pkg.memberId === memberId);
      },
      
      massUpdateStorageLocation: (packageIds, newLocation) => set((state) => ({
        packages: state.packages.map((pkg) => 
          packageIds.includes(pkg.id) ? { ...pkg, storageLocation: newLocation } : pkg
        ),
      })),
      
      setPackages: (packages) => {
        set({ packages });
      },
      
      clearAllData: () => {
        set({
          packages: [],
        });
      },
    }),
    {
      name: 'package-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);