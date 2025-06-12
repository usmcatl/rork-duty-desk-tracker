export type MemberBranch = 'Army' | 'Navy' | 'Air Force' | 'Marines' | 'Coast Guard' | 'Space Force';
export type MemberStatus = 'Active' | 'Inactive' | 'Suspended' | 'Deceased';
export type MemberGroup = 'Legion' | 'Auxiliary' | 'Sons of the American Legion' | 'Legion Riders';

export const MEMBER_BRANCHES: MemberBranch[] = [
  'Army',
  'Navy', 
  'Air Force',
  'Marines',
  'Coast Guard',
  'Space Force'
];

export const MEMBER_STATUSES: MemberStatus[] = [
  'Active',
  'Inactive',
  'Suspended',
  'Deceased'
];

export const MEMBER_GROUPS: MemberGroup[] = [
  'Legion',
  'Auxiliary',
  'Sons of the American Legion',
  'Legion Riders'
];

export interface Member {
  id: string;
  memberId: string;
  name: string;
  aliases?: string[];
  phone?: string;
  email: string;
  address?: string;
  notes?: string;
  joinDate: Date;
  branch?: MemberBranch;
  status: MemberStatus;
  group: MemberGroup;
  associatedMembers?: string[]; // Array of member IDs
}

export interface MemberFormData {
  memberId: string;
  name: string;
  aliases?: string[];
  phone?: string;
  email: string;
  address?: string;
  notes?: string;
  joinDate: Date;
  branch?: MemberBranch;
  status: MemberStatus;
  group: MemberGroup;
}