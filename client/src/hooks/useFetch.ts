import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, NetworkError } from "../api/httpClient";

interface UseFetchResult<T> {
  data: T | undefined;
  /** true solo en la carga inicial y al reintentar; un `reload` no lo activa. */
  isLoading: boolean;
  error: string | null;
  /** Vuelve a pedir los datos SIN mostrar el spinner (ej. después de guardar o eliminar). */
  reload: () => Promise<void>;
  /** Vuelve a pedir los datos mostrando el spinner (para el botón "Reintentar"). */
  retry: () => void;
}

function toMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 403) return "No tienes permiso para ver esta información.";
  if (err instanceof NetworkError) return err.message;
  return fallback;
}

// Encapsula el patrón que se repetía en cada página: estado de carga, de error y de datos,
// más el useEffect que dispara la petición al montar. `fetcher` es cualquier función que
// devuelva una Promise (ej. listUsers). Se guarda en un ref para que no haga falta
// memorizarla con useCallback en cada página.
export function useFetch<T>(fetcher: () => Promise<T>, errorMessage = "No se pudieron cargar los datos."): UseFetchResult<T> {
  const fetcherRef = useRef(fetcher);
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const reload = useCallback(async () => {
    try {
      setData(await fetcherRef.current());
      setError(null);
    } catch (err) {
      setError(toMessage(err, errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [errorMessage]);

  const retry = useCallback(() => {
    setIsLoading(true);
    void reload();
  }, [reload]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, isLoading, error, reload, retry };
}
