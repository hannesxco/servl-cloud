import avatar1 from '@/assets/avatars/avatar-1.png';
import avatar2 from '@/assets/avatars/avatar-2.png';
import avatar3 from '@/assets/avatars/avatar-3.png';
import avatar4 from '@/assets/avatars/avatar-4.png';
import avatar5 from '@/assets/avatars/avatar-5.png';
import avatar6 from '@/assets/avatars/avatar-6.png';
import avatar7 from '@/assets/avatars/avatar-7.png';
import avatar8 from '@/assets/avatars/avatar-8.png';

export const AVATARS = [
  { id: 'avatar-1', src: avatar1, label: 'Frau mit Pullover' },
  { id: 'avatar-2', src: avatar2, label: 'Mann mit Brille' },
  { id: 'avatar-3', src: avatar3, label: 'Frau mit Jacke' },
  { id: 'avatar-4', src: avatar4, label: 'Mann mit Hoodie' },
  { id: 'avatar-5', src: avatar5, label: 'Älterer Herr' },
  { id: 'avatar-6', src: avatar6, label: 'Frau mit Dutt' },
  { id: 'avatar-7', src: avatar7, label: 'Mann mit Bart' },
  { id: 'avatar-8', src: avatar8, label: 'Frau mit Locken' },
];

export function getAvatarSrc(avatarId?: string): string | undefined {
  if (!avatarId) return undefined;
  return AVATARS.find(a => a.id === avatarId)?.src;
}
