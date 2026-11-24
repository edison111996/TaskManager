import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "./Sidebar";
import { ErrorBoundary } from "../components/ErrorBoundary";

// Título de la sección actual para mostrarlo en el navbar. Se busca por prefijo,
// de la ruta más específica a la más general.
const PAGE_TITLES: [string, string][] = [
  ["/forms/admin", "Constructor de formularios"],
  ["/forms", "Formularios"],
  ["/tasks", "Tareas"],
  ["/projects", "Proyectos"],
  ["/reports", "Informes"],
  ["/users", "Usuarios"],
  ["/roles", "Roles"],
  ["/modules", "Módulos"],
];

function getPageTitle(pathname: string): string {
  return PAGE_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Inicio";
}

const DESKTOP_QUERY = "(min-width: 768px)";
const SIDEBAR_STORAGE_KEY = "sidebarOpen";

function isDesktopViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;
}

// Arranca abierto en desktop (o como haya quedado guardado) y cerrado en mobile,
// para no tapar toda la pantalla con el drawer apenas carga.
function getInitialSidebarState(): boolean {
  try {
    if (!isDesktopViewport()) return false;
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState);

  // Solo persistimos la preferencia cuando el cambio ocurre en desktop: en mobile el
  // drawer se abre/cierra todo el tiempo (nav, backdrop) y eso no debería pisar lo que
  // el usuario dejó configurado en su pantalla grande.
  useEffect(() => {
    if (!isDesktopViewport()) return;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen));
    } catch {
      // localStorage puede fallar (modo privado, storage bloqueado); no es crítico.
    }
  }, [isSidebarOpen]);

  // Cierra el drawer al navegar en mobile, como cualquier app con sidebar responsive.
  useEffect(() => {
    if (!isDesktopViewport()) setIsSidebarOpen(false);
  }, [location.pathname]);

  // Evita el scroll del fondo mientras el drawer está abierto en mobile.
  useEffect(() => {
    if (isSidebarOpen && !isDesktopViewport()) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isSidebarOpen]);

  function closeMobileSidebar() {
    if (!isDesktopViewport()) setIsSidebarOpen(false);
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const initials =
    ((user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")).toUpperCase() ||
    (user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={closeMobileSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <button
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label="Abrir o cerrar menú"
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>

          <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-800 sm:text-lg">
            {getPageTitle(location.pathname)}
          </h1>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white"
              >
                {initials}
              </span>
              <div className="hidden min-w-0 leading-tight sm:block">
                <p className="truncate text-sm font-medium text-slate-800">{fullName}</p>
                <p className="truncate text-xs text-slate-500">{user?.roles?.join(", ") || user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-x-auto bg-slate-50 p-4 sm:p-6">
          {/* key = ruta: al navegar a otra sección el boundary se reinicia y sale de la pantalla de error. */}
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
