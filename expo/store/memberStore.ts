import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Member } from '@/types/member';
import { matchesMemberSearch } from '@/utils/memberUtils';

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
        return get().members.filter(member => matchesMemberSearch(member, query));
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