import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, CheckoutRecord, EquipmentStatus } from '@/types/equipment';

interface EquipmentState {
  equipment: Equipment[];
  checkoutRecords: CheckoutRecord[];
  dutyOfficers: string[];
  addEquipment: (equipment: Omit<Equipment, 'id' | 'addedDate' | 'status'>) => string;
  updateEquipment: (equipment: Equipment) => void;
  removeEquipment: (id: string) => void;
  checkoutEquipment: (checkoutRecord: Omit<CheckoutRecord, 'id' | 'checkoutDate'>) => void;
  returnEquipment: (equipmentId: string, returnNotes?: string, depositReturned?: boolean, collectedBy?: string) => void;
  getDutyOfficers: () => string[];
  setDutyOfficers: (officers: string[]) => void;
  setEquipment: (equipment: Equipment[]) => void;
  setCheckoutRecords: (records: CheckoutRecord[]) => void;
  clearAllData: () => void;
}

// Sample data for the app
const sampleEquipment: Equipment[] = [
  {
    id: '1',
    name: 'Portable ECG Monitor',
    description: 'Handheld ECG monitor for quick cardiac assessments',
    imageUri: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?q=80&w=500',
    status: 'available',
    category: 'Diagnostic',
    serialNumber: 'ECG-2023-001',
    notes: 'Battery lasts approximately 8 hours on full charge',
    addedDate: new Date('2023-01-10'),
    depositAmount: 100,
  },
  {
    id: '2',
    name: 'Digital Stethoscope',
    description: 'Advanced digital stethoscope with noise cancellation',
    imageUri: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=500',
    status: 'available',
    category: 'Diagnostic',
    serialNumber: 'DS-2023-045',
    addedDate: new Date('2023-02-15'),
    depositAmount: 50,
  },
  {
    id: '3',
    name: 'Portable Ultrasound',
    description: 'Compact ultrasound device for bedside diagnostics',
    imageUri: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=500',
    status: 'checked-out',
    category: 'Imaging',
    serialNumber: 'PU-2022-112',
    notes: 'Includes 3 different probes',
    addedDate: new Date('2022-11-05'),
    depositAmount: 250,
  },
  {
    id: '4',
    name: 'Vital Signs Monitor',
    description: 'All-in-one monitor for BP, SpO2, temperature, and ECG',
    imageUri: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=500',
    status: 'checked-out',
    category: 'Monitoring',
    serialNumber: 'VSM-2023-078',
    addedDate: new Date('2023-03-22'),
    depositAmount: 150,
  },
  {
    id: '5',
    name: 'Infusion Pump',
    description: 'Programmable infusion pump for precise medication delivery',
    imageUri: 'https://images.unsplash.com/photo-1583912267550-d6c2a3a8210a?q=80&w=500',
    status: 'available',
    category: 'Therapeutic',
    serialNumber: 'IP-2022-156',
    notes: 'Recently calibrated',
    addedDate: new Date('2022-12-18'),
    depositAmount: 200,
  },
];

const sampleCheckoutRecords: CheckoutRecord[] = [
  {
    id: '1',
    equipmentId: '3',
    memberId: '1', // John Smith
    checkoutDate: new Date('2023-11-10'),
    expectedReturnDate: new Date('2023-11-17'),
    checkoutNotes: 'Needed for emergency department',
    dutyOfficer: 'John Smith',
    depositCollected: 250,
  },
  {
    id: '2',
    equipmentId: '4',
    memberId: '2', // Maria Garcia
    checkoutDate: new Date('2023-11-12'),
    expectedReturnDate: new Date('2023-11-19'),
    checkoutNotes: 'For ICU patient monitoring',
    dutyOfficer: 'Emily Davis',
    depositCollected: 150,
  },
];

// List of duty officers
const defaultDutyOfficers = [
  'John Smith',
  'Emily Davis',
  'Robert Johnson',
  'Maria Garcia',
];

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      equipment: sampleEquipment,
      checkoutRecords: sampleCheckoutRecords,
      dutyOfficers: defaultDutyOfficers,
      
      addEquipment: (newEquipment) => {
        const id = Date.now().toString();
        set((state) => ({
          equipment: [
            ...state.equipment,
            {
              ...newEquipment,
              id,
              status: 'available' as EquipmentStatus,
              addedDate: new Date(),
            },
          ],
        }));
        return id;
      },
      
      updateEquipment: (updatedEquipment) => set((state) => ({
        equipment: state.equipment.map((item) => 
          item.id === updatedEquipment.id ? updatedEquipment : item
        ),
      })),
      
      removeEquipment: (id) => set((state) => ({
        equipment: state.equipment.filter((item) => item.id !== id),
        // Also remove any checkout records for this equipment
        checkoutRecords: state.checkoutRecords.filter(
          (record) => record.equipmentId !== id
        ),
      })),
      
      checkoutEquipment: (checkoutRecord) => {
        const id = Date.now().toString();
        set((state) => {
          // Add checkout record
          const newCheckoutRecords = [
            ...state.checkoutRecords,
            {
              ...checkoutRecord,
              id,
              checkoutDate: new Date(),
            },
          ];
          
          // Update equipment status
          const updatedEquipment = state.equipment.map((item) => {
            if (item.id === checkoutRecord.equipmentId) {
              return {
                ...item,
                status: 'checked-out' as EquipmentStatus,
              };
            }
            return item;
          });
          
          return {
            checkoutRecords: newCheckoutRecords,
            equipment: updatedEquipment,
          };
        });
      },
      
      returnEquipment: (equipmentId, returnNotes, depositReturned = true, collectedBy) => set((state) => {
        // Find the active checkout record for this equipment
        const activeCheckoutIndex = state.checkoutRecords.findIndex(
          (record) => record.equipmentId === equipmentId && !record.returnDate
        );
        
        if (activeCheckoutIndex === -1) return state;
        
        // Update the checkout record with return information
        const updatedCheckoutRecords = [...state.checkoutRecords];
        updatedCheckoutRecords[activeCheckoutIndex] = {
          ...updatedCheckoutRecords[activeCheckoutIndex],
          returnDate: new Date(),
          returnNotes: returnNotes || '',
          depositReturned,
          collectedBy,
        };
        
        // Update equipment status
        const updatedEquipment = state.equipment.map((item) => {
          if (item.id === equipmentId) {
            return {
              ...item,
              status: 'available' as EquipmentStatus,
            };
          }
          return item;
        });
        
        return {
          checkoutRecords: updatedCheckoutRecords,
          equipment: updatedEquipment,
        };
      }),
      
      getDutyOfficers: () => {
        return get().dutyOfficers;
      },
      
      setDutyOfficers: (officers) => {
        set({ dutyOfficers: officers });
      },
      
      setEquipment: (equipment) => {
        set({ equipment });
      },
      
      setCheckoutRecords: (checkoutRecords) => {
        set({ checkoutRecords });
      },
      
      clearAllData: () => {
        set({
          equipment: [],
          checkoutRecords: [],
        });
      },
    }),
    {
      name: 'equipment-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);