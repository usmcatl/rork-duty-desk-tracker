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
  getAssociatedMembers: (id: string) => Member[];
  addAssociation: (memberId: string, associatedMemberId: string) => void;
  removeAssociation: (memberId: string, associatedMemberId: string) => void;
  searchMembers: (query: string) => Member[];
  importMembers: (members: Member[]) => void;
  setMembers: (members: Member[]) => void;
  clearAllMembers: () => void;
}

// Sample data for the app
const sampleMembers: Member[] = [
  {
    id: '1',
    name: 'John Smith',
    aliases: ['Johnny', 'J. Smith'],
    memberId: 'MED001',
    phone: '+1 (555) 123-4567',
    email: 'john.smith@example.com',
    joinDate: new Date('2024-01-15T10:30:00.000Z'),
    dateOfBirth: new Date('1975-03-22T00:00:00.000Z'),
    associatedMembers: ['2'],
    branch: 'Army',
    status: 'Active',
    group: 'Legion',
    addedBy: 'John Smith',
    involvementInterests: ['Veterans & Family Assistance', 'Events'],
  },
  {
    id: '2',
    name: 'Maria Garcia',
    aliases: ['Mary Garcia'],
    memberId: 'MED002',
    phone: '+1 (555) 987-6543',
    email: 'maria.garcia@example.com',
    joinDate: new Date('2024-02-20T14:15:00.000Z'),
    dateOfBirth: new Date('1982-07-14T00:00:00.000Z'),
    associatedMembers: ['1'],
    branch: 'Navy',
    status: 'Active',
    group: 'Auxiliary',
    addedBy: 'Emily Davis',
    involvementInterests: ['Community Outreach Programs', 'Social Media'],
  },
  {
    id: '3',
    name: 'David Johnson',
    aliases: ['Dave Johnson', 'D.J.'],
    memberId: 'MED003',
    phone: '+1 (555) 456-7890',
    email: 'david.johnson@example.com',
    joinDate: new Date('2024-03-10T09:45:00.000Z'),
    dateOfBirth: new Date('1968-11-08T00:00:00.000Z'),
    branch: 'Air Force',
    status: 'Active',
    group: 'Legion',
    addedBy: 'Robert Johnson',
    involvementInterests: ['Membership', 'Donations/Sponsorship'],
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    memberId: 'MED004',
    email: 'sarah.wilson@example.com',
    joinDate: new Date('2024-04-05T16:20:00.000Z'),
    dateOfBirth: new Date('1990-05-30T00:00:00.000Z'),
    status: 'Inactive',
    group: 'Sons of the American Legion',
    addedBy: 'Maria Garcia',
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
      
      getAssociatedMembers: (id) => {
        const member = get().getMemberById(id);
        if (!member || !member.associatedMembers) return [];
        
        return member.associatedMembers
          .map(associatedId => get().getMemberById(associatedId))
          .filter(Boolean) as Member[];
      },
      
      addAssociation: (memberId, associatedMemberId) => {
        set((state) => ({
          members: state.members.map((member) => {
            if (member.id === memberId) {
              const currentAssociations = member.associatedMembers || [];
              if (!currentAssociations.includes(associatedMemberId)) {
                return {
                  ...member,
                  associatedMembers: [...currentAssociations, associatedMemberId]
                };
              }
            }
            return member;
          }),
        }));
      },
      
      removeAssociation: (memberId, associatedMemberId) => {
        set((state) => ({
          members: state.members.map((member) => {
            if (member.id === memberId && member.associatedMembers) {
              return {
                ...member,
                associatedMembers: member.associatedMembers.filter(id => id !== associatedMemberId)
              };
            }
            return member;
          }),
        }));
      },
      
      searchMembers: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().members.filter(member => {
          const nameMatch = member.name.toLowerCase().includes(lowerQuery);
          const memberIdMatch = member.memberId.toLowerCase().includes(lowerQuery);
          const phoneMatch = member.phone?.includes(query) || false;
          const aliasMatch = member.aliases?.some(alias => 
            alias.toLowerCase().includes(lowerQuery)
          ) || false;
          
          return nameMatch || memberIdMatch || phoneMatch || aliasMatch;
        });
      },
      
      importMembers: (newMembers) => {
        set((state) => {
          // Generate unique IDs for imported members and ensure required fields
          const membersWithIds = newMembers.map(member => ({
            ...member,
            id: member.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
            status: member.status || 'Active',
            group: member.group || 'Legion',
            email: member.email || 'no-email@example.com', // Ensure email is present
          }));
          
          return {
            members: [...state.members, ...membersWithIds],
          };
        });
      },
      
      setMembers: (members) => {
        set({ members });
      },
      
      clearAllMembers: () => {
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