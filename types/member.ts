export type Member = {
  id: string;
  memberId: string; // Organization member ID number
  name: string;
  phone?: string; // Made optional since not all members may have phone
  email?: string;
  address?: string;
  notes?: string;
  joinDate: Date;
};