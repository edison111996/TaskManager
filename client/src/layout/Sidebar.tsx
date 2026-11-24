import { NavLink } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  FileEdit,
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
  /** Sin esto, el ítem se muestra a cualquier usuario autenticado (ej. "Diligenciar
   * formularios" — no hace falta ningún permiso especial, alcanza con estar logueado). */
  requiredPermission?: string;
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
    label: "Formularios",
    items: [
      { to: "/forms", label: "Diligenciar", icon: ClipboardList },
      { to: "/forms/admin", label: "Constructor", icon: FileEdit, requiredPermission: "Forms:Read" },
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

const linkClasses = (collapsed: boolean) => ({ isActive }: { isActive: boolean }) =>
  `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${collapsed ? "md:mx-auto md:h-10 md:w-10 md:justify-center md:gap-0 md:px-0 md:py-0" : ""} font-medium whitespace-nowrap transition-colors ${
    isActive
      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

// Los grupos ya no se colapsan: con solo 3 secciones y ~9 ítems, tener todo a la vista
// ahorra un clic por navegación y el usuario siempre sabe qué opciones existen.
function SidebarGroup({
  group,
  visibleItems,
  onNavigate,
  collapsed,
}: {
  group: NavGroup;
  visibleItems: NavItem[];
  onNavigate: () => void;
  collapsed: boolean;
}) {
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div>
      <p
        className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${
          collapsed ? "md:hidden" : ""
        }`}
      >
        {group.label}
      </p>
      {/* Colapsado no hay título: una línea separa los grupos. */}
      {collapsed && <div className="mx-3 mb-2 hidden border-t border-slate-200 md:block" />}
      <div className="space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/forms"}
            title={item.label}
            className={linkClasses(collapsed)}
            onClick={onNavigate}
          >
            <item.icon size={18} className="shrink-0" />
            <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
          </NavLink>
        ))}
      </div>
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
      {/* Backdrop: solo existe en mobile (md:hidden). */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-[1px] md:hidden"
        />
      )}

      {/* En desktop es sticky + h-screen: el menú se queda fijo mientras el contenido scrollea. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 overflow-hidden border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:shadow-none md:translate-x-0 md:transition-[width] ${
          isOpen ? "translate-x-0 md:w-60" : "-translate-x-full md:w-[68px]"
        }`}
      >
        <div className={`flex h-full w-64 flex-col ${isOpen ? "md:w-60" : "md:w-[68px]"}`}>
          <div
            className={`flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 ${
              isOpen ? "" : "md:justify-center md:px-0"
            }`}
          >
            <span className="flex items-center gap-2.5 text-lg font-bold text-blue-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm text-white shadow-sm">
                T
              </span>
              <span className={isOpen ? "" : "md:hidden"}>TaskManager</span>
            </span>
            <button
              onClick={onClose}
              aria-label="Cerrar menú"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden px-3 py-4">
            <NavLink to="/" end title="Inicio" className={linkClasses(!isOpen)} onClick={onClose}>
              <Home size={18} className="shrink-0" />
              <span className={isOpen ? "" : "md:hidden"}>Inicio</span>
            </NavLink>

            {GROUPS.map((group) => (
              <SidebarGroup
                key={group.label}
                group={group}
                visibleItems={group.items.filter(
                  (item) => !item.requiredPermission || permissions.includes(item.requiredPermission),
                )}
                onNavigate={onClose}
                collapsed={!isOpen}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
