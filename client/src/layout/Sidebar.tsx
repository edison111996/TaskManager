import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChevronRight,
  FolderKanban,
  Home,
  Layers,
  ListTodo,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Solo se muestra si el usuario tiene este permiso (viene de /api/auth/me) */
  requiredPermission: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Tareas",
    items: [
      { to: "/tasks", label: "Tareas", icon: ListTodo, requiredPermission: "Tasks:Read" },
      { to: "/projects", label: "Proyectos", icon: FolderKanban, requiredPermission: "Tasks:Read" },
      { to: "/reports", label: "Informes", icon: BarChart3, requiredPermission: "Reports:Read" },
    ],
  },
  {
    label: "Configuración",
    items: [
      { to: "/users", label: "Usuarios", icon: Users, requiredPermission: "Users:Read" },
      { to: "/roles", label: "Roles", icon: ShieldCheck, requiredPermission: "Roles:Read" },
      { to: "/modules", label: "Módulos", icon: Layers, requiredPermission: "Modules:Read" },
    ],
  },
];

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
    isActive ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30" : "text-slate-600 hover:bg-slate-100"
  }`;

const subLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg py-1.5 pl-4 pr-3 text-sm font-medium whitespace-nowrap transition-colors ${
    isActive ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30" : "text-slate-500 hover:bg-slate-100"
  }`;

function SidebarGroup({
  group,
  visibleItems,
  onNavigate,
}: {
  group: NavGroup;
  visibleItems: NavItem[];
  onNavigate: () => void;
}) {
  const location = useLocation();
  const containsCurrentPath = visibleItems.some((item) => location.pathname.startsWith(item.to));
  const [isExpanded, setIsExpanded] = useState(containsCurrentPath);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <span>{group.label}</span>
        <ChevronRight size={12} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
      </button>
      {isExpanded && (
        <div className="mt-1 space-y-1">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={subLinkClasses} onClick={onNavigate}>
              <item.icon size={16} className="shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { permissions } = useAuth();

  return (
    <>
      {/* Backdrop: solo existe en mobile (md:hidden) — en desktop el sidebar nunca flota
          arriba del contenido, así que no hace falta oscurecer nada. */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-[1px] md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 overflow-hidden border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 md:static md:z-auto md:shadow-none md:transition-[width] ${
          isOpen ? "translate-x-0 md:w-56" : "-translate-x-full md:w-0 md:border-r-0"
        }`}
      >
        <div className="flex h-full w-64 flex-col md:w-56">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-5">
            <span className="flex items-center gap-2 text-lg font-bold text-blue-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">
                T
              </span>
              TaskManager
            </span>
            <button
              onClick={onClose}
              aria-label="Cerrar menú"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
            <NavLink to="/" end className={linkClasses} onClick={onClose}>
              <Home size={16} className="shrink-0" />
              Inicio
            </NavLink>

            {GROUPS.map((group) => (
              <SidebarGroup
                key={group.label}
                group={group}
                visibleItems={group.items.filter((item) => permissions.includes(item.requiredPermission))}
                onNavigate={onClose}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
