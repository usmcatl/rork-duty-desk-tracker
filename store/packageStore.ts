import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Package, PackageStatus } from '@/types/package';

interface PackageState {
  packages: Package[];
  addPackage: (packageData: Omit<Package, 'id' | 'arrivalDate' | 'status'>) => string;
  updatePackage: (packageData: Package) => void;
  removePackage: (id: string) => void;
  markAsPickedUp: (id: string, pickupNotes?: string) => void;
  getPackagesByMember: (memberId: string) => Package[];
  massUpdateStorageLocation: (packageIds: string[], newLocation: string) => void;
  setPackages: (packages: Package[]) => void;
  clearAllData: () => void;
}

// Sample data for the app
const samplePackages: Package[] = [
  {
    id: '1',
    recipientName: 'John Smith',
    memberId: '1',
    description: 'Medical supplies order',
    sender: 'MedSupply Co.',
    status: 'pending',
    arrivalDate: new Date('2023-11-15'),
    storageLocation: 'Shelf A-3',
    packagePhotoUri: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=500',
    labelPhotoUri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=500',
    storagePhotoUri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=500',
    addedBy: 'Emily Davis',
    notes: 'Fragile - handle with care',
  },
  {
    id: '2',
    recipientName: 'Maria Garcia',
    memberId: '2',
    description: 'Personal package',
    sender: 'Amazon',
    status: 'picked-up',
    arrivalDate: new Date('2023-11-12'),
    pickupDate: new Date('2023-11-14'),
    storageLocation: 'Shelf B-1',
    packagePhotoUri: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=500',
    labelPhotoUri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=500',
    storagePhotoUri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=500',
    addedBy: 'John Smith',
  },
];

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
      
      markAsPickedUp: (id, pickupNotes) => set((state) => ({
        packages: state.packages.map((pkg) => {
          if (pkg.id === id) {
            return {
              ...pkg,
              status: 'picked-up' as PackageStatus,
              pickupDate: new Date(),
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