export interface ShiftRecord {
  id: string;
  startTime: Date;
  endTime?: Date;
  dutyOfficer: string;
  previousOfficer?: string;
  tabletAcknowledged: boolean;
  keysAcknowledged: boolean;
  equipmentInspected: boolean;
  notes?: string;
  signatureData?: string; // Base64 signature data
  biometricConfirmed?: boolean;
}

export interface ShiftHandover {
  outgoingOfficer?: string;
  incomingOfficer: string;
  handoverNotes?: string;
  equipmentCount: number;
  checkedOutCount: number;
  pendingIssues?: string;
}