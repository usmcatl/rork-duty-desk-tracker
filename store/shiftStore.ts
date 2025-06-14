import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShiftRecord, ShiftHandover } from '@/types/shift';

interface ShiftState {
  currentShift: ShiftRecord | null;
  shiftHistory: ShiftRecord[];
  lastChangeoverCheck: Date | null;
  startShift: (shiftData: Omit<ShiftRecord, 'id' | 'startTime'>) => string;
  endCurrentShift: (endNotes?: string) => void;
  getCurrentShift: () => ShiftRecord | null;
  getShiftHistory: () => ShiftRecord[];
  isShiftChangeoverDue: () => boolean;
  setLastChangeoverCheck: (date: Date) => void;
  clearShiftData: () => void;
}

export const useShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      currentShift: null,
      shiftHistory: [],
      lastChangeoverCheck: null,
      
      startShift: (shiftData) => {
        const id = Date.now().toString();
        const newShift: ShiftRecord = {
          ...shiftData,
          id,
          startTime: new Date(),
        };
        
        set((state) => {
          // End current shift if one exists
          let updatedHistory = [...state.shiftHistory];
          if (state.currentShift) {
            const endedShift = {
              ...state.currentShift,
              endTime: new Date(),
            };
            updatedHistory.push(endedShift);
          }
          
          return {
            currentShift: newShift,
            shiftHistory: updatedHistory,
            lastChangeoverCheck: new Date(),
          };
        });
        
        return id;
      },
      
      endCurrentShift: (endNotes) => {
        set((state) => {
          if (!state.currentShift) return state;
          
          const endedShift = {
            ...state.currentShift,
            endTime: new Date(),
            notes: endNotes ? `${state.currentShift.notes || ''}\n\nEnd of shift notes: ${endNotes}`.trim() : state.currentShift.notes,
          };
          
          return {
            currentShift: null,
            shiftHistory: [...state.shiftHistory, endedShift],
          };
        });
      },
      
      getCurrentShift: () => {
        return get().currentShift;
      },
      
      getShiftHistory: () => {
        return get().shiftHistory.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      },
      
      isShiftChangeoverDue: () => {
        const state = get();
        const now = new Date();
        const currentHour = now.getHours();
        
        // Check if we're in a shift change window (6am-8am, 2pm-4pm, 10pm-12am)
        const isShiftChangeWindow = 
          (currentHour >= 6 && currentHour < 8) ||   // Morning shift
          (currentHour >= 14 && currentHour < 16) || // Afternoon shift  
          (currentHour >= 22 || currentHour < 2);    // Night shift (crosses midnight)
        
        if (!isShiftChangeWindow) return false;
        
        // Check if we've already done a changeover check today in this window
        if (state.lastChangeoverCheck) {
          const lastCheck = new Date(state.lastChangeoverCheck);
          const timeDiff = now.getTime() - lastCheck.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // If last check was less than 4 hours ago, don't prompt again
          if (hoursDiff < 4) return false;
        }
        
        // Check if current shift has been running for more than 8 hours
        if (state.currentShift) {
          const shiftStart = new Date(state.currentShift.startTime);
          const shiftDuration = now.getTime() - shiftStart.getTime();
          const shiftHours = shiftDuration / (1000 * 60 * 60);
          
          return shiftHours >= 8;
        }
        
        // No current shift, should prompt for changeover
        return true;
      },
      
      setLastChangeoverCheck: (date) => {
        set({ lastChangeoverCheck: date });
      },
      
      clearShiftData: () => {
        set({
          currentShift: null,
          shiftHistory: [],
          lastChangeoverCheck: null,
        });
      },
    }),
    {
      name: 'shift-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);