// src/components/ui/PasswordRequirements.tsx
import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordRule {
    label: string;
    test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
    { label: 'One number (0–9)', test: (p) => /[0-9]/.test(p) },
];

export const allPasswordRulesPassed = (password: string) =>
    PASSWORD_RULES.every((rule) => rule.test(password));

interface PasswordRequirementsProps {
    password: string;
    confirmPassword?: string;
    showConfirmMatch?: boolean;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
    password,
    confirmPassword,
    showConfirmMatch = false,
}) => {
    const rules = showConfirmMatch
        ? [
              ...PASSWORD_RULES,
              {
                  label: 'Passwords match',
                  test: () => password.length > 0 && password === confirmPassword,
              },
          ]
        : PASSWORD_RULES;

    return (
        <ul className="mt-2 space-y-1">
            {rules.map((rule) => {
                const passed = rule.test(password);
                return (
                    <li
                        key={rule.label}
                        className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                            passed ? 'text-green-600' : 'text-red-500'
                        }`}
                    >
                        <span
                            className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${
                                passed ? 'bg-green-100' : 'bg-red-100'
                            }`}
                        >
                            {passed ? (
                                <Check className="w-2.5 h-2.5" strokeWidth={3} />
                            ) : (
                                <X className="w-2.5 h-2.5" strokeWidth={3} />
                            )}
                        </span>
                        {rule.label}
                    </li>
                );
            })}
        </ul>
    );
};
