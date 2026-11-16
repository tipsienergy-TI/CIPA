import AdminApp from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

// Protegida pelo middleware.ts (sem sessão válida -> /admin/login).
export default function AdminPage() {
  return <AdminApp />;
}
