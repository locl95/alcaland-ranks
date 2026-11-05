import { Check, HelpCircle, Loader2, XCircle } from 'lucide-react';
import { VerifyResult } from '@/features/views/api/entityApi.ts';
import './verification-badge.css';

export type CheckStatus = VerifyResult | 'checking';

const BADGES: Record<
  CheckStatus,
  { icon: typeof Check; title: (noun: string) => string; modifier: string; spin?: boolean }
> = {
  checking: {
    icon: Loader2,
    title: (noun) => `Checking ${noun.toLowerCase()}`,
    modifier: 'checking',
    spin: true,
  },
  valid: { icon: Check, title: (noun) => `${noun} found`, modifier: 'valid' },
  invalid: { icon: XCircle, title: (noun) => `${noun} not found`, modifier: 'invalid' },
  unverified: { icon: HelpCircle, title: () => 'Could not be verified', modifier: 'unverified' },
};

export function VerificationBadge({
  status,
  noun = 'Character',
}: Readonly<{ status: CheckStatus; noun?: string }>) {
  const { icon: Icon, title, modifier, spin } = BADGES[status];

  return (
    <span className={`verification-badge verification-badge--${modifier}`} title={title(noun)}>
      <Icon size={16} className={spin ? 'verification-badge-spin' : undefined} />
    </span>
  );
}
