import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const links = [
  { to: '/',             icon: '⬡', label: 'Dashboard'     },
  { to: '/transactions', icon: '↔', label: 'Transactions'  },
  { to: '/budgets',      icon: '◎', label: 'Budgets'       },
  { to: '/charts',       icon: '∿', label: 'Insights'      },
  { to: '/subscriptions',icon: '↻', label: 'Subscriptions' },
  { to: '/goals',        icon: '◈', label: 'Goals'         },
  { to: '/networth',     icon: '◇', label: 'Net Worth'     },
  { to: '/settings',     icon: '⚙', label: 'Settings'      },
];

export default function Sidebar() {
  const { logout } = useAuth();
  return (
    <aside className="w-56 flex-shrink-0 bg-surface-1 border-r border-white/5 flex flex-col">
      <div className="px-5 py-6 border-b border-white/5">
        <span className="text-lg font-semibold tracking-tight text-white">Finance</span>
      </div>
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span className="text-base w-4 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 pb-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span className="text-base w-4 text-center">→</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
