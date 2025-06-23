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
  renewEquipmentLease: (equipmentId: string, renewalNotes?: string) => boolean;
  getDutyOfficers: () => string[];
  setDutyOfficers: (officers: string[]) => void;
  setEquipment: (equipment: Equipment[]) => void;
  setCheckoutRecords: (records: CheckoutRecord[]) => void;
  clearAllData: () => void;
  getOverdueEquipment: () => Equipment[];
  getActiveCheckoutForEquipment: (equipmentId: string) => CheckoutRecord | undefined;
}

// Empty arrays for fresh app start
const sampleEquipment: Equipment[] = [];
const sampleCheckoutRecords: CheckoutRecord[] = [];
const defaultDutyOfficers: string[] = [];

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
      
      renewEquipmentLease: (equipmentId, renewalNotes) => {
        const state = get();
        
        // Find the active checkout record for this equipment
        const activeCheckoutIndex = state.checkoutRecords.findIndex(
          (record) => record.equipmentId === equipmentId && !record.returnDate
        );
        
        if (activeCheckoutIndex === -1) return false;
        
        const activeCheckout = state.checkoutRecords[activeCheckoutIndex];
        
        // Calculate new return date (60 days from current expected return date or today, whichever is later)
        const currentExpectedReturn = activeCheckout.expectedReturnDate ? new Date(activeCheckout.expectedReturnDate) : new Date();
        const today = new Date();
        const baseDate = currentExpectedReturn > today ? currentExpectedReturn : today;
        const newReturnDate = new Date(baseDate);
        newReturnDate.setDate(newReturnDate.getDate() + 60);
        
        // Update the checkout record with renewal information
        const updatedCheckoutRecords = [...state.checkoutRecords];
        const existingNotes = updatedCheckoutRecords[activeCheckoutIndex].checkoutNotes || '';
        const renewalNote = `Lease renewed on ${new Date().toLocaleDateString()} for 60 days.${renewalNotes ? ` ${renewalNotes}` : ''}`;
        
        updatedCheckoutRecords[activeCheckoutIndex] = {
          ...updatedCheckoutRecords[activeCheckoutIndex],
          expectedReturnDate: newReturnDate,
          checkoutNotes: existingNotes ? `${existingNotes}

${renewalNote}` : renewalNote,
        };
        
        set({
          checkoutRecords: updatedCheckoutRecords,
        });
        
        return true;
      },
      
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
      
      getOverdueEquipment: () => {
        const state = get();
        const now = new Date();
        
        return state.equipment.filter(equipment => {
          if (equipment.status !== 'checked-out') return false;
          
          const activeCheckout = state.checkoutRecords.find(
            record => record.equipmentId === equipment.id && !record.returnDate
          );
          
          return activeCheckout && 
                 activeCheckout.expectedReturnDate && 
                 new Date(activeCheckout.expectedReturnDate) < now;
        });
      },
      
      getActiveCheckoutForEquipment: (equipmentId) => {
        const state = get();
        return state.checkoutRecords.find(
          record => record.equipmentId === equipmentId && !record.returnDate
        );
      },
    }),
    {
      name: 'equipment-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);