export type EquipmentStatus = 'available' | 'checked-out' | 'maintenance' | 'retired';

export interface Equipment {
  id: string;
  name: string;
  description: string;
  imageUri?: string;
  status: EquipmentStatus;
  category: string;
  serialNumber?: string;
  notes?: string;
  addedDate: Date;
  depositAmount?: number;
}

export interface CheckoutRecord {
  id: string;
  equipmentId: string;
  memberId: string;
  checkoutDate: Date;
  expectedReturnDate?: Date;
  returnDate?: Date;
  checkoutNotes?: string;
  returnNotes?: string;
  dutyOfficer: string;
  depositCollected?: number;
  depositReturned?: boolean;
  collectedBy?: string; // Who collected the money on return
}