import { useState, type FormEvent } from "react";
import { Modal } from "../components/Modal";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { createUser, updateUser, assignUserRoles, type UserDto } from "../api/users";
import type { RoleDto } from "../api/roles";
import { useToast } from "../components/ToastProvider";

interface UserFormModalProps {
  roles: RoleDto[];
  /** Si viene un usuario, el modal edita; si no, crea uno nuevo. */
  editingUser?: UserDto & { roleIds?: string[] };
  onClose: () => void;
  onSaved: () => void;
}

type FieldName = "firstName" | "lastName" | "email" | "password" | "phone";
type FieldErrors = Partial<Record<FieldName, string>>;

// Quita cualquier caracter que no sea parte de un teléfono a medida que se escribe —
// así ni siquiera se puede llegar a escribir una letra en el campo, no hace falta
// esperar al blur para avisar que "eso no es un teléfono".
function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+\-\s()]/g, "");
}

// Se corre en cada blur/cambio para dar feedback inmediato, sin esperar al submit
// ni al roundtrip al backend. La validación "real" sigue viviendo en las DataAnnotations
// de CreateUserRequest/UpdateUserRequest (ver UserDtos.cs) — esto es solo UX.
function validateField(field: FieldName, value: string, isEditing: boolean): string | undefined {
  switch (field) {
    case "firstName":
      return value.trim() ? undefined : "El nombre es obligatorio.";
    case "lastName":
      return value.trim() ? undefined : "El apellido es obligatorio.";
    case "email":
      if (!value.trim()) return "El correo es obligatorio.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Correo inválido.";
      return undefined;
    case "password":
      if (isEditing) return undefined;
      if (!value) return "La contraseña es obligatoria.";
      if (value.length < 6) return "Debe tener al menos 6 caracteres.";
      return undefined;
    case "phone": {
      if (!value.trim()) return undefined; // opcional
      const digitCount = value.replace(/\D/g, "").length;
      if (digitCount < 7 || digitCount > 15) return "Ingresá un teléfono válido (7 a 15 dígitos).";
      return undefined;
    }
  }
}

export function UserFormModal({ roles, editingUser, onClose, onSaved }: UserFormModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(editingUser);

  const [firstName, setFirstName] = useState(editingUser?.firstName ?? "");
  const [lastName, setLastName] = useState(editingUser?.lastName ?? "");
  const [email, setEmail] = useState(editingUser?.email ?? "");
  const [phone, setPhone] = useState(editingUser?.phone ?? "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(editingUser?.isActive ?? true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(editingUser?.roleIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    );
  }

  // Valida al perder foco (no en cada tecla, sería molesto). Una vez que un campo
  // ya tiene error visible, sí revalidamos en cada cambio para que desaparezca apenas
  // se corrige, en vez de obligar a des-enfocar el input de nuevo.
  function handleBlur(field: FieldName, value: string) {
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value, isEditing) }));
  }

  function handleFieldChange(field: FieldName, value: string, setter: (v: string) => void) {
    setter(value);
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: validateField(field, value, isEditing) } : prev));
  }

  const isFormValid =
    !validateField("firstName", firstName, isEditing) &&
    !validateField("lastName", lastName, isEditing) &&
    !validateField("email", email, isEditing) &&
    !validateField("password", password, isEditing) &&
    !validateField("phone", phone, isEditing);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEditing && editingUser) {
        await updateUser(editingUser.id, { firstName, lastName, email, phone: phone || null, isActive });
        await assignUserRoles(editingUser.id, selectedRoleIds);
      } else {
        await createUser({ firstName, lastName, email, password, phone: phone || null, roleIds: selectedRoleIds });
      }
      showToast(isEditing ? "Usuario actualizado" : "Usuario creado", "success");
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el usuario.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar usuario" : "Nuevo usuario"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Nombre"
          value={firstName}
          onChange={(e) => handleFieldChange("firstName", e.target.value, setFirstName)}
          onBlur={(e) => handleBlur("firstName", e.target.value)}
          error={fieldErrors.firstName}
          required
        />
        <Input
          label="Apellido"
          value={lastName}
          onChange={(e) => handleFieldChange("lastName", e.target.value, setLastName)}
          onBlur={(e) => handleBlur("lastName", e.target.value)}
          error={fieldErrors.lastName}
          required
        />
        <Input
          label="Correo"
          type="email"
          value={email}
          onChange={(e) => handleFieldChange("email", e.target.value, setEmail)}
          onBlur={(e) => handleBlur("email", e.target.value)}
          error={fieldErrors.email}
          required
        />
        <Input
          label="Teléfono"
          type="tel"
          value={phone}
          onChange={(e) => handleFieldChange("phone", sanitizePhoneInput(e.target.value), setPhone)}
          onBlur={(e) => handleBlur("phone", e.target.value)}
          error={fieldErrors.phone}
        />

        {!isEditing && (
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => handleFieldChange("password", e.target.value, setPassword)}
            onBlur={(e) => handleBlur("password", e.target.value)}
            error={fieldErrors.password}
            minLength={6}
            required
          />
        )}

        {isEditing && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Usuario activo
          </label>
        )}

        <div>
          <span className="text-sm font-medium text-slate-600">Roles</span>
          <div className="mt-1 space-y-1">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                />
                {role.name}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!isFormValid}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
