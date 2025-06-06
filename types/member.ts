export type Member = {
  id: string;
  memberId: string; // Organization member ID number
  name: string;
  aliases?: string[]; // Alternative names or nicknames
  phone?: string; // Optional since not all members may have phone
  email?: string; // Optional since not all members may have email
  address?: string;
  notes?: string;
  joinDate: Date;
  associatedMembers?: string[]; // IDs of associated members (family, etc.)
};