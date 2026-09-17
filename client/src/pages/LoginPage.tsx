import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@taskmanager.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Correo o contraseña inválidos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="w-80 space-y-4 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-xl font-bold text-blue-600">TaskManager</h1>

        <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" isLoading={isSubmitting} className="w-full justify-center">
          Ingresar
        </Button>
      </form>
    </div>
  );
}
