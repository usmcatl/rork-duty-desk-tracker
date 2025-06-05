export type Member = {
  id: string;
  memberId: string; // Organization member ID number
  name: string;
  phone?: string; // Optional since not all members may have phone
  email?: string; // Optional since not all members may have email
  address?: string;
  notes?: string;
  joinDate: Date;
};