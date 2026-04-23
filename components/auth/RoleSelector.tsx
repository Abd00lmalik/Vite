import { Building2, Hospital, Users } from 'lucide-react';

export type RoleChoice = 'health-worker' | 'patient' | 'donor';

interface RoleSelectorProps {
  value?: RoleChoice;
  onChange: (role: RoleChoice) => void;
}

const roles = [
  {
    id: 'health-worker' as const,
    title: "I'm a Health Worker",
    subtitle: 'Manage records & sync to XION',
    icon: Hospital,
  },
  {
    id: 'patient' as const,
    title: "I'm a Patient / Family",
    subtitle: 'Access your health portable wallet',
    icon: Users,
  },
  {
    id: 'donor' as const,
    title: "I'm a Donor / NGO",
    subtitle: 'Verify impact & fund grant programs',
    icon: Building2,
  },
];

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-3">
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = value === role.id;
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-4
                       ${isActive 
                         ? 'border-who-blue bg-who-blue-light shadow-sm' 
                         : 'border-ui-border bg-white hover:border-who-blue-dark/30 hover:bg-ui-bg'}`}
          >
            <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center
                          ${isActive ? 'bg-who-blue text-white' : 'bg-ui-bg text-ui-text-muted'}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className={`text-sm font-bold ${isActive ? 'text-who-blue' : 'text-ui-text'}`}>
                {role.title}
              </p>
              <p className={`text-xs ${isActive ? 'text-who-blue-dark/80' : 'text-ui-text-light'}`}>
                {role.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}



