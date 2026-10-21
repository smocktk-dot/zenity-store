import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ username: "", password: "", setupKey: "" });

  const setup = trpc.auth.setupAdmin.useMutation({
    onSuccess: () => { toast.success("Admin criado! Faça login."); navigate("/login"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
      <div className="w-full max-w-md px-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-lg">C</div>
          <span className="text-white text-xl font-semibold">CV STORE | Setup</span>
        </div>
        <div className="rounded-2xl border border-white/10 p-8" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-red-500" />
            <h1 className="text-white text-xl font-bold">Criar Admin Inicial</h1>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setup.mutate(form); }} className="space-y-4">
            <div>
              <Label className="text-gray-300 text-sm">Username</Label>
              <Input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Password</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Setup Key</Label>
              <Input value={form.setupKey} onChange={e => setForm(f => ({...f, setupKey: e.target.value}))} placeholder="CV-SETUP-2024" className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <Button type="submit" disabled={setup.isPending} className="w-full bg-red-600 hover:bg-red-500 text-white">
              {setup.isPending ? "Criando..." : "Criar Admin"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
