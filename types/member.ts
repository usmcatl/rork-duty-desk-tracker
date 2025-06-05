export type Member = {
  id: string;
  memberId: string; // Organization member ID number
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  joinDate: Date;
};