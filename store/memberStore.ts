import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Member } from '@/types/member';

interface MemberState {
  members: Member[];
  addMember: (memberData: Omit<Member, 'id'>) => string;
  updateMember: (member: Member) => void;
  removeMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
  setMembers: (members: Member[]) => void;
  clearAllData: () => void;
}

// Sample data for the app
const sampleMembers: Member[] = [
  {
    id: '1',
    name: 'John Smith',
    memberId: 'MED001',
    phone: '+1 (555) 123-4567',
    email: 'john.smith@example.com',
  },
  {
    id: '2',
    name: 'Maria Garcia',
    memberId: 'MED002',
    phone: '+1 (555) 987-6543',
    email: 'maria.garcia@example.com',
  },
  {
    id: '3',
    name: 'David Johnson',
    memberId: 'MED003',
    phone: '+1 (555) 456-7890',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    memberId: 'MED004',
    email: 'sarah.wilson@example.com',
  },
];

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: sampleMembers,
      
      addMember: (memberData) => {
        const id = Date.now().toString();
        const newMember: Member = {
          ...memberData,
          id,
        };
        
        set((state) => ({
          members: [...state.members, newMember],
        }));
        
        return id;
      },
      
      updateMember: (updatedMember) => set((state) => ({
        members: state.members.map((member) => 
          member.id === updatedMember.id ? updatedMember : member
        ),
      })),
      
      removeMember: (id) => set((state) => ({
        members: state.members.filter((member) => member.id !== id),
      })),
      
      getMemberById: (id) => {
        return get().members.find(member => member.id === id);
      },
      
      setMembers: (members) => {
        set({ members });
      },
      
      clearAllData: () => {
        set({
          members: [],
        });
      },
    }),
    {
      name: 'member-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);