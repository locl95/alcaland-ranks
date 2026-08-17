import { Check, HelpCircle, Loader2, XCircle } from 'lucide-react';
import { VerifyResult } from '@/features/views/api/entityApi.ts';
import './verification-badge.css';

export type CheckStatus = VerifyResult | 'checking';

const BADGES: Record<
  CheckStatus,
  { icon: typeof Check; title: string; modifier: string; spin?: boolean }
> = {
  checking: { icon: Loader2, title: 'Checking character', modifier: 'checking', spin: true },
  valid: { icon: Check, title: 'Character found', modifier: 'valid' },
  invalid: { icon: XCircle, title: 'Character not found', modifier: 'invalid' },
  unverified: { icon: HelpCircle, title: 'Could not be verified', modifier: 'unverified' },
};

export function VerificationBadge({ status }: Readonly<{ status: CheckStatus }>) {
  const { icon: Icon, title, modifier, spin } = BADGES[status];

  return (
    <span className={`verification-badge verification-badge--${modifier}`} title={title}>
      <Icon size={16} className={spin ? 'verification-badge-spin' : undefined} />
    </span>
  );
}
