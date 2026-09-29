export type MemberBranch = 'Army' | 'Navy' | 'Air Force' | 'Marines' | 'Coast Guard' | 'Space Force';
export type MemberStatus = 'Active' | 'Inactive' | 'Suspended' | 'Deceased';
export type MemberGroup = 'Legion' | 'Auxiliary' | 'Sons of the American Legion' | 'Legion Riders';
export type InvolvementInterest = 'Veterans & Family Assistance' | 'Community Outreach Programs' | 'Events' | 'Social Media' | 'Membership' | 'Donations/Sponsorship';

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

export const INVOLVEMENT_INTERESTS: InvolvementInterest[] = [
  'Veterans & Family Assistance',
  'Community Outreach Programs',
  'Events',
  'Social Media',
  'Membership',
  'Donations/Sponsorship'
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
  dateOfBirth?: Date;
  branch?: MemberBranch;
  status: MemberStatus;
  group: MemberGroup;
  associatedMembers?: string[]; // Array of member IDs
  addedBy?: string; // Duty officer who added this member
  involvementInterests?: InvolvementInterest[]; // Areas they want to get involved with
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
  dateOfBirth?: Date;
  branch?: MemberBranch;
  status: MemberStatus;
  group: MemberGroup;
  addedBy?: string;
  involvementInterests?: InvolvementInterest[];
}