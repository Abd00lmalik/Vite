import { Building2, Hospital, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type RoleChoice = 'health-worker' | 'patient' | 'donor';

interface RoleSelectorProps {
  value?: RoleChoice;
  onChange: (role: RoleChoice) => void;
}

const roles = [
  {
    id: 'health-worker' as const,
    title: "I'm a Health Worker",
    subtitle: 'Email + password login',
    icon: Hospital,
  },
  {
    id: 'patient' as const,
    title: "I'm a Patient / Family",
    subtitle: 'Phone number login',
    icon: Users,
  },
  {
    id: 'donor' as const,
    title: "I'm a Donor / NGO",
    subtitle: 'Email + password login',
    icon: Building2,
  },
];

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-3">
      {roles.map((role) => {
        const Icon = role.icon;
        return (
          <button key={role.id} type="button" onClick={() => onChange(role.id)} className="w-full text-left">
            <Card className={value === role.id ? 'border-teal-primary ring-2 ring-teal-100' : 'hover:border-teal-200'}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-dark">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-gray-900">{role.title}</span>
                  <span className="block text-sm text-gray-600">{role.subtitle}</span>
                </span>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}


