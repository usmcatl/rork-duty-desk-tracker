export type MemberBranch = 'Army' | 'Air Force' | 'Marines' | 'Navy' | 'Coast Guard' | 'Space Force';
export type MemberStatus = 'Active' | 'Inactive';
export type MemberGroup = 'Legion' | 'SAL' | 'Auxiliary';

export type Member = {
  id: string;
  memberId: string; // Organization member ID number
  name: string;
  aliases?: string[]; // Alternative names or nicknames
  phone?: string; // Optional since not all members may have phone
  email: string; // Now mandatory
  address?: string;
  notes?: string;
  joinDate: Date;
  associatedMembers?: string[]; // IDs of associated members (family, etc.)
  branch?: MemberBranch; // Military branch
  status: MemberStatus; // Active or Inactive status
  group: MemberGroup; // Legion, SAL, or Auxiliary
};

export const MEMBER_BRANCHES: MemberBranch[] = [
  'Army',
  'Air Force', 
  'Marines',
  'Navy',
  'Coast Guard',
  'Space Force'
];

export const MEMBER_STATUSES: MemberStatus[] = [
  'Active',
  'Inactive'
];

export const MEMBER_GROUPS: MemberGroup[] = [
  'Legion',
  'SAL',
  'Auxiliary'
];