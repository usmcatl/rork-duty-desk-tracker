export type PackageStatus = 'pending' | 'picked-up';

export type Package = {
  id: string;
  recipientName: string;
  memberId: string; // Reference to the member who will receive the package
  description: string;
  sender: string;
  status: PackageStatus;
  arrivalDate: Date;
  pickupDate?: Date;
  storageLocation: string;
  notes?: string;
  // Photo URIs
  packagePhotoUri: string;
  labelPhotoUri: string;
  storagePhotoUri: string;
  addedBy: string; // Duty officer who added the package
  handOffBy?: string; // Duty officer who handed off the package during pickup
};