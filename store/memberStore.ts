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
  importMembers: (members: Omit<Member, 'id'>[]) => void;
  setMembers: (members: Member[]) => void;
  clearAllMembers: () => void;
}

// Empty array for fresh app start
const sampleMembers: Member[] = [];

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
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            status: member.status || 'Active',
            group: member.group || 'Legion',
            email: member.email || 'no-email@example.com', // Ensure email is present
            joinDate: member.joinDate || new Date(), // Ensure joinDate is present
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