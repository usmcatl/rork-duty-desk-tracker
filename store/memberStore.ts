import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Member } from '@/types/member';

interface MemberState {
  members: Member[];
  addMember: (member: Omit<Member, 'id'>) => string;
  updateMember: (member: Member) => void;
  removeMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
  getMemberByMemberId: (memberId: string) => Member | undefined;
  importMembers: (members: Omit<Member, 'id'>[]) => void;
  clearAllMembers: () => void;
}

// Sample data for the app
const sampleMembers: Member[] = [
  {
    id: '1',
    memberId: 'M001',
    name: 'John Smith',
    phone: '555-123-4567',
    email: 'john.smith@example.com',
    address: '123 Main St, Lake Chapala',
    joinDate: new Date('2020-03-15'),
  },
  {
    id: '2',
    memberId: 'M002',
    name: 'Maria Garcia',
    phone: '555-987-6543',
    email: 'maria.garcia@example.com',
    address: '456 Oak Ave, Lake Chapala',
    notes: 'Volunteer coordinator',
    joinDate: new Date('2019-07-22'),
  },
  {
    id: '3',
    memberId: 'M003',
    name: 'Robert Johnson',
    phone: '555-456-7890',
    address: '789 Pine Rd, Lake Chapala',
    joinDate: new Date('2021-01-10'),
  },
];

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: sampleMembers,
      
      addMember: (newMember) => {
        const id = Date.now().toString();
        set((state) => ({
          members: [
            ...state.members,
            {
              ...newMember,
              id,
            },
          ],
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
      
      getMemberByMemberId: (memberId) => {
        return get().members.find(member => member.memberId === memberId);
      },
      
      importMembers: (newMembers) => {
        const membersWithIds = newMembers.map(member => ({
          ...member,
          id: Date.now() + Math.random().toString(36).substring(2, 9),
        }));
        
        set((state) => ({
          members: [...state.members, ...membersWithIds],
        }));
      },
      
      clearAllMembers: () => {
        set({ members: [] });
      },
    }),
    {
      name: 'member-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);