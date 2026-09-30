import Colors from '@/constants/colors';
import { Member, MemberStatus } from '@/types/member';

/** Only Active members may check out equipment. */
export const canCheckOutEquipment = (member: Member) => member.status === 'Active';

/** Packages may be logged for any member, but non-Active ones need a warning. */
export const needsMembershipWarning = (member: Member) => member.status !== 'Active';

export const membershipWarningText = (member: Member) =>
  `${member.name} is ${member.status.toUpperCase()}. Their membership is not current.`;

export const memberStatusColor = (status: MemberStatus) => {
  switch (status) {
    case 'Active':
      return Colors.light.success;
    case 'Inactive':
      return Colors.light.warningText;
    default:
      return Colors.light.error;
  }
};

/**
 * Secondary line for member lists: the member ID when there is one
 * (members from Google Contacts often have none), otherwise phone or email.
 */
export const memberSubtitle = (member: Member) => {
  if (member.memberId) return `ID: ${member.memberId}`;
  return member.phone || member.email || 'No member ID';
};

export const matchesMemberSearch = (member: Member, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    member.name.toLowerCase().includes(q) ||
    (member.memberId || '').toLowerCase().includes(q) ||
    (member.phone || '').includes(query.trim()) ||
    (member.email || '').toLowerCase().includes(q) ||
    (member.aliases || []).some((alias) => alias.toLowerCase().includes(q))
  );
};
