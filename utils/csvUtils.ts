import { Equipment, CheckoutRecord } from '@/types/equipment';
import { Member, MEMBER_BRANCHES, MEMBER_STATUSES, MEMBER_GROUPS, MemberBranch, MemberStatus, MemberGroup } from '@/types/member';

/**
 * Converts equipment and checkout records to CSV format
 */
export const convertToCSV = (
  equipment: Equipment[],
  checkoutRecords: CheckoutRecord[]
): { equipmentCSV: string; checkoutRecordsCSV: string } => {
  // Equipment CSV
  const equipmentHeaders = [
    'id',
    'name',
    'description',
    'imageUri',
    'status',
    'category',
    'serialNumber',
    'notes',
    'addedDate',
    'depositAmount'
  ];
  
  let equipmentCSV = equipmentHeaders.join(',') + '\n';
  
  equipment.forEach(item => {
    const row = [
      item.id,
      escapeCsvValue(item.name),
      escapeCsvValue(item.description),
      escapeCsvValue(item.imageUri || ''),
      item.status,
      escapeCsvValue(item.category),
      escapeCsvValue(item.serialNumber || ''),
      escapeCsvValue(item.notes || ''),
      new Date(item.addedDate).toISOString(),
      item.depositAmount !== undefined ? item.depositAmount.toString() : ''
    ];
    
    equipmentCSV += row.join(',') + '\n';
  });
  
  // Checkout Records CSV
  const checkoutHeaders = [
    'id',
    'equipmentId',
    'memberId',
    'checkoutDate',
    'expectedReturnDate',
    'returnDate',
    'checkoutNotes',
    'returnNotes',
    'dutyOfficer',
    'depositCollected',
    'depositReturned'
  ];
  
  let checkoutRecordsCSV = checkoutHeaders.join(',') + '\n';
  
  checkoutRecords.forEach(record => {
    const row = [
      record.id,
      record.equipmentId,
      record.memberId,
      new Date(record.checkoutDate).toISOString(),
      new Date(record.expectedReturnDate).toISOString(),
      record.returnDate ? new Date(record.returnDate).toISOString() : '',
      escapeCsvValue(record.checkoutNotes || ''),
      escapeCsvValue(record.returnNotes || ''),
      escapeCsvValue(record.dutyOfficer),
      record.depositCollected !== undefined ? record.depositCollected.toString() : '',
      record.depositReturned !== undefined ? record.depositReturned.toString() : ''
    ];
    
    checkoutRecordsCSV += row.join(',') + '\n';
  });
  
  return { equipmentCSV, checkoutRecordsCSV };
};

/**
 * Converts members to CSV format
 */
export const convertMembersToCSV = (members: Member[]): string => {
  const headers = [
    'id',
    'memberId',
    'name',
    'phone',
    'email',
    'address',
    'notes',
    'joinDate',
    'branch',
    'status',
    'group'
  ];
  
  let csv = headers.join(',') + '\n';
  
  members.forEach(member => {
    const row = [
      member.id,
      escapeCsvValue(member.memberId),
      escapeCsvValue(member.name),
      escapeCsvValue(member.phone || ''),
      escapeCsvValue(member.email),
      escapeCsvValue(member.address || ''),
      escapeCsvValue(member.notes || ''),
      new Date(member.joinDate).toISOString(),
      escapeCsvValue(member.branch || ''),
      member.status,
      member.group
    ];
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
};

/**
 * Parses CSV data back into equipment and checkout records
 */
export const parseFromCSV = (
  equipmentCSV: string,
  checkoutRecordsCSV: string
): { equipment: Equipment[]; checkoutRecords: CheckoutRecord[] } => {
  const equipment: Equipment[] = [];
  const checkoutRecords: CheckoutRecord[] = [];
  
  // Parse equipment CSV
  const equipmentLines = equipmentCSV.split('\n');
  const equipmentHeaders = equipmentLines[0].split(',');
  
  for (let i = 1; i < equipmentLines.length; i++) {
    const line = equipmentLines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length !== equipmentHeaders.length) continue;
    
    const item: Equipment = {
      id: values[0],
      name: values[1],
      description: values[2],
      imageUri: values[3] || '',
      status: values[4] as 'available' | 'checked-out',
      category: values[5],
      serialNumber: values[6] || undefined,
      notes: values[7] || undefined,
      addedDate: new Date(values[8]),
      depositAmount: values[9] ? parseFloat(values[9]) : 0
    };
    
    equipment.push(item);
  }
  
  // Parse checkout records CSV
  const checkoutLines = checkoutRecordsCSV.split('\n');
  const checkoutHeaders = checkoutLines[0].split(',');
  
  for (let i = 1; i < checkoutLines.length; i++) {
    const line = checkoutLines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length !== checkoutHeaders.length) continue;
    
    const record: CheckoutRecord = {
      id: values[0],
      equipmentId: values[1],
      memberId: values[2],
      checkoutDate: new Date(values[3]),
      expectedReturnDate: new Date(values[4]),
      returnDate: values[5] ? new Date(values[5]) : undefined,
      checkoutNotes: values[6] || undefined,
      returnNotes: values[7] || undefined,
      dutyOfficer: values[8],
      depositCollected: values[9] ? parseFloat(values[9]) : 0,
      depositReturned: values[10] ? values[10] === 'true' : undefined
    };
    
    checkoutRecords.push(record);
  }
  
  return { equipment, checkoutRecords };
};

/**
 * Parses CSV data into members
 */
export const parseMembersFromCSV = (csv: string): Member[] => {
  const members: Member[] = [];
  
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length < 3) continue; // At minimum need id, memberId, and name
    
    // Validate and parse branch
    const branchValue = values[8]?.trim();
    const branch: MemberBranch | undefined = branchValue && MEMBER_BRANCHES.includes(branchValue as MemberBranch) 
      ? branchValue as MemberBranch 
      : undefined;
    
    // Validate and parse status
    const statusValue = values[9]?.trim();
    const status: MemberStatus = statusValue && MEMBER_STATUSES.includes(statusValue as MemberStatus)
      ? statusValue as MemberStatus
      : 'Active';
    
    // Validate and parse group
    const groupValue = values[10]?.trim();
    const group: MemberGroup = groupValue && MEMBER_GROUPS.includes(groupValue as MemberGroup)
      ? groupValue as MemberGroup
      : 'Legion';
    
    // Map CSV columns to member properties
    const member: Member = {
      id: values[0] || Date.now().toString() + Math.random().toString(36).substring(2, 9),
      memberId: values[1],
      name: values[2],
      phone: values[3] || '',
      email: values[4] || 'no-email@example.com', // Provide default email since it's now required
      address: values[5] || undefined,
      notes: values[6] || undefined,
      joinDate: values[7] ? new Date(values[7]) : new Date(),
      branch,
      status,
      group
    };
    
    members.push(member);
  }
  
  return members;
};

/**
 * Creates a template CSV for member import
 */
export const getMemberImportTemplate = (): string => {
  return 'memberId,name,phone,email,address,notes,joinDate,branch,status,group\n' +
         'M001,John Doe,555-123-4567,john@example.com,"123 Main St, Lake Chapala",Active member,2023-01-15,Army,Active,Legion\n' +
         'M002,Jane Smith,555-987-6543,jane@example.com,"456 Oak Ave, Lake Chapala",Volunteer,2022-11-20,Navy,Active,Auxiliary';
};

/**
 * Escapes special characters in CSV values
 */
const escapeCsvValue = (value: string): string => {
  if (!value) return '';
  
  // If the value contains commas, quotes, or newlines, wrap it in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Double up any quotes to escape them
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
};

/**
 * Parses a CSV line, handling quoted values correctly
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Check if this is an escaped quote (double quote)
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
};