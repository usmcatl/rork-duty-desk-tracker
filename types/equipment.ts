export type EquipmentStatus = 'available' | 'checked-out';

export type Equipment = {
  id: string;
  name: string;
  description: string;
  imageUri: string;
  status: EquipmentStatus;
  category: string;
  serialNumber?: string;
  notes?: string;
  addedDate: Date;
  depositAmount: number; // Required deposit amount in dollars
};

export type CheckoutRecord = {
  id: string;
  equipmentId: string;
  memberId: string; // Reference to the member who borrowed the equipment
  checkoutDate: Date;
  expectedReturnDate: Date; // Required expected return date
  returnDate?: Date;
  checkoutNotes?: string;
  returnNotes?: string;
  dutyOfficer: string;
  depositCollected: number; // Required deposit amount collected
  depositReturned?: boolean; // Whether deposit was returned
};