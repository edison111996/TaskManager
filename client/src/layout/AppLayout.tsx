import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "./Sidebar";

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

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={closeMobileSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label="Abrir o cerrar menú"
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>

          <span className="min-w-0 flex-1 truncate text-right text-sm text-slate-500 sm:text-left">
            <span className="hidden sm:inline">Sesión: </span>
            <span className="font-medium text-slate-800">{user?.email}</span>
          </span>
          <button
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </header>
        <main className="flex-1 overflow-x-auto bg-slate-50 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
