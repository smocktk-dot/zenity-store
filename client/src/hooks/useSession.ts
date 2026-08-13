import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function useSession() {
  const { data: session, isLoading, refetch } = trpc.auth.session.useQuery(undefined, {
    retry: false,
    staleTime: 30000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
  return { session, isLoading, refetch };
}

export function useAdminSession() {
  const { session, isLoading } = useSession();
  const [, navigate] = useLocation();
  if (!isLoading && (!session || session.role !== "admin")) {
    navigate("/");
  }
  return { session: session?.role === "admin" ? session : null, isLoading };
}

export function useResellerSession() {
  const { session, isLoading } = useSession();
  const [, navigate] = useLocation();
  if (!isLoading && (!session || session.role !== "reseller")) {
    navigate("/");
  }
  return { session: session?.role === "reseller" ? session : null, isLoading };
}
