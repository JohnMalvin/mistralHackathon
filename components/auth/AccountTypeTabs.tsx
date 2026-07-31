'use client';

import type { AccountType } from '@/models/User';

// Shared by /login and /register so both entry points present the same two
// categories in the same order.
export const ACCOUNT_TYPE_TABS: { value: AccountType; label: string }[] = [
    { value: 'individual', label: 'Individual' },
    { value: 'business', label: 'Business' },
];

export default function AccountTypeTabs({
    value,
    onChange,
    disabled = false,
}: {
    value: AccountType;
    onChange: (next: AccountType) => void;
    disabled?: boolean;
}) {
    return (
        <div role="tablist" aria-label="Account type" className="gb-tabs">
            {ACCOUNT_TYPE_TABS.map(({ value: tab, label }) => (
                <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={value === tab}
                    disabled={disabled}
                    onClick={() => onChange(tab)}
                    className="gb-tab"
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
