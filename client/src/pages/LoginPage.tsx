import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck, TriangleAlert } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ApiError, NetworkError } from "../api/httpClient";
import { Input } from "../components/Input";
import { PasswordInput } from "../components/PasswordInput";
import { Button } from "../components/Button";

const REMEMBER_EMAIL_KEY = "rememberedEmail";
const DEFAULT_DEV_EMAIL = "admin@taskmanager.local";
const DEFAULT_DEV_PASSWORD = "Admin123!";

function readRememberedEmail(): string | null {
  try {
    return localStorage.getItem(REMEMBER_EMAIL_KEY);
  } catch {
    return null; // storage bloqueado (modo privado): simplemente no recordamos nada
  }
}

function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Escribe tu correo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "El correo no parece válido.";
  return undefined;
}

// Vista previa decorativa del producto (datos de ejemplo, no reales).
function ProductPreview() {
  const rows = [
    { title: "Diseñar pantalla de inicio", who: "AM", done: true },
    { title: "Revisar informe semanal", who: "JR", done: true },
    { title: "Configurar roles del equipo", who: "LC", done: false },
  ];

  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Sprint de la semana</p>
            <p className="text-xs text-blue-200">3 tareas · 2 completadas</p>
          </div>
          <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-medium text-emerald-300">En curso</span>
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" />
        </div>

        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.title} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  row.done ? "border-emerald-400 bg-emerald-400 text-slate-900" : "border-white/40"
                }`}
              >
                {row.done && <CheckCircle2 size={12} />}
              </span>
              <span className={`flex-1 truncate text-sm ${row.done ? "text-blue-200 line-through" : "text-white"}`}>
                {row.title}
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold text-white">
                {row.who}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="animate-float absolute -right-4 -top-5 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xl">
        <ShieldCheck size={14} className="text-blue-600" />
        Permisos por rol
      </div>
      <div className="animate-float absolute -bottom-5 -left-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xl [animation-delay:-3s]">
        <CheckCircle2 size={14} className="text-emerald-500" />
        Historial de cambios
      </div>
    </div>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Si ProtectedRoute nos mandó aquí, "from" es la página que el usuario quería abrir.
  const redirectTo = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;

  const rememberedEmail = readRememberedEmail();
  const [email, setEmail] = useState(rememberedEmail ?? DEFAULT_DEV_EMAIL);
  const [password, setPassword] = useState(DEFAULT_DEV_PASSWORD);
  const [rememberEmail, setRememberEmail] = useState(rememberedEmail !== null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quien ya tiene sesión no necesita ver el login.
  if (user) {
    return <Navigate to="/" replace />;
  }

  function handleCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setIsCapsLockOn(event.getModifierState("CapsLock"));
  }

  function persistRememberedEmail() {
    try {
      // Solo se guarda el correo, NUNCA la contraseña.
      if (rememberEmail) localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      else localStorage.removeItem(REMEMBER_EMAIL_KEY);
    } catch {
      // no es crítico
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const emailProblem = validateEmail(email);
    setEmailError(emailProblem);
    if (emailProblem) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      persistRememberedEmail();
      navigate(redirectTo ? `${redirectTo.pathname}${redirectTo.search ?? ""}` : "/", { replace: true });
    } catch (err) {
      if (err instanceof NetworkError) {
        setError(err.message);
      } else if (err instanceof ApiError && err.status === 429) {
        setError(err.message); // "Demasiados intentos..."
      } else {
        setError("Correo o contraseña incorrectos.");
      }
      setShakeKey((k) => k + 1); // reinicia la animación de sacudida
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Panel de marca (solo pantallas grandes) */}
      <aside className="relative hidden w-[55%] flex-col justify-between overflow-hidden bg-slate-950 p-14 text-white lg:flex">
        <div aria-hidden="true" className="animate-blob absolute -left-20 -top-20 h-[28rem] w-[28rem] rounded-full bg-blue-600/50 blur-3xl" />
        <div
          aria-hidden="true"
          className="animate-blob absolute -bottom-32 right-0 h-[30rem] w-[30rem] rounded-full bg-indigo-500/40 blur-3xl [animation-delay:-7s]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex items-center gap-3 text-xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-900/50">
            T
          </span>
          TaskManager
        </div>

        <div className="relative space-y-12">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold leading-[1.1] tracking-tight">
              Todo tu trabajo,
              <br />
              <span className="bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent">
                en un solo lugar.
              </span>
            </h2>
            <p className="max-w-md text-lg text-blue-100/80">
              Planifica tareas, da seguimiento a proyectos y controla quién puede hacer qué.
            </p>
          </div>
          <ProductPreview />
        </div>

        <p className="relative text-sm text-blue-200/60">© {new Date().getFullYear()} TaskManager</p>
      </aside>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="animate-fade-up w-full max-w-md">
          <span className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-600/30 lg:hidden">
            T
          </span>

          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Iniciar sesión</h1>
            <p className="text-slate-500">Bienvenido de nuevo. Ingresa tus datos para continuar.</p>
          </div>

          {/* key={shakeKey}: al cambiar, React recrea el formulario y se repite la animación de error. */}
          <form
            key={shakeKey}
            onSubmit={handleSubmit}
            noValidate
            className={`space-y-5 ${shakeKey > 0 ? "animate-shake" : ""}`}
          >
            <Input
              label="Correo electrónico"
              type="email"
              icon={Mail}
              autoComplete="username"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(validateEmail(e.target.value));
              }}
              onBlur={(e) => setEmailError(validateEmail(e.target.value))}
              error={emailError}
              autoFocus={!rememberedEmail}
            />

            <div className="space-y-1.5">
              <PasswordInput
                label="Contraseña"
                icon={KeyRound}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleCapsLock}
                onKeyUp={handleCapsLock}
                onBlur={() => setIsCapsLockOn(false)}
                required
              />
              {isCapsLockOn && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                  <TriangleAlert size={13} />
                  Las mayúsculas están activadas
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Recordar mi correo
              </label>
              <span className="text-xs text-slate-400">¿Olvidaste tu clave? Pídela al administrador</span>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-base shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? (
                "Ingresando..."
              ) : (
                <>
                  Ingresar <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
