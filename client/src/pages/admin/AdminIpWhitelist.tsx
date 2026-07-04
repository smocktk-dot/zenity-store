import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, Plus, Trash2, Wifi, Info, User, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UserType = "admin" | "reseller";

export default function AdminIpWhitelist() {
  const [newIp, setNewIp] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [userType, setUserType] = useState<UserType>("admin");
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"admin" | "reseller">("admin");

  const { data: list = [], refetch, isLoading } = trpc.admin.listIpWhitelist.useQuery();
  const { data: resellers = [] } = trpc.admin.listResellers.useQuery();

  const addIp = trpc.admin.addIp.useMutation({
    onSuccess: () => {
      toast.success("IP adicionado à whitelist!");
      setNewIp("");
      setNewLabel("");
      setSelectedResellerId("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeIp = trpc.admin.removeIp.useMutation({
    onSuccess: () => { toast.success("IP removido!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) { toast.error("Digite um IP válido"); return; }
    if (userType === "reseller" && !selectedResellerId) {
      toast.error("Selecione um reseller");
      return;
    }
    addIp.mutate({
      ip: newIp.trim(),
      label: newLabel.trim() || undefined,
      userType,
      userId: userType === "reseller" ? Number(selectedResellerId) : null,
    });
  };

  const adminList = list.filter(e => e.userType === "admin");
  const resellerList = list.filter(e => e.userType === "reseller");
  const displayList = activeTab === "admin" ? adminList : resellerList;

  const getResellerName = (userId: number | null) => {
    if (!userId) return "—";
    const r = (resellers as any[]).find((r: any) => r.id === userId);
    return r ? r.username : `#${userId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <Shield className="w-5 h-5" style={{ color: "#a78bfa" }} />
        </div>
        <div>
          <h1 className="text-white font-bold text-xl">Whitelist de IPs</h1>
          <p className="text-gray-500 text-sm">Controle quais IPs podem acessar o painel admin e os logins de reseller</p>
        </div>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)" }}
      >
        <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#fbbf24" }} />
        <div className="text-sm" style={{ color: "#fbbf24" }}>
          <p className="font-semibold mb-1">Como funciona</p>
          <p className="text-yellow-400/70">
            <strong>Admin:</strong> quando a lista de IPs admin está vazia, qualquer IP pode logar como admin. Ao adicionar IPs, apenas eles terão acesso.
            <br />
            <strong>Reseller:</strong> quando nenhum IP está cadastrado para um reseller, ele pode logar de qualquer IP. Ao adicionar IPs para um reseller, apenas esses IPs serão aceitos no login dele.
          </p>
        </div>
      </div>

      {/* Add form */}
      <div
        className="rounded-xl p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-purple-400" />
          Adicionar IP
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-3">
            {/* User type selector */}
            <Select value={userType} onValueChange={(v) => { setUserType(v as UserType); setSelectedResellerId(""); }}>
              <SelectTrigger
                className="h-10 w-40 text-white text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <span className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-purple-400" />Admin</span>
                </SelectItem>
                <SelectItem value="reseller">
                  <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-blue-400" />Reseller</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Reseller selector (only when type = reseller) */}
            {userType === "reseller" && (
              <Select value={selectedResellerId} onValueChange={setSelectedResellerId}>
                <SelectTrigger
                  className="h-10 w-48 text-white text-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <SelectValue placeholder="Selecionar reseller..." />
                </SelectTrigger>
                <SelectContent>
                  {(resellers as any[]).map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Input
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="Ex: 189.7.125.44"
              className="h-10 text-white placeholder:text-gray-600 flex-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (opcional)"
              className="h-10 text-white placeholder:text-gray-600 w-40"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
            <Button
              type="submit"
              disabled={addIp.isPending}
              className="h-10 px-5 font-semibold text-sm text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)", border: "none" }}
            >
              {addIp.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Plus className="w-4 h-4 mr-1" />Adicionar</>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {(["admin", "reseller"] as const).map((tab) => {
          const count = tab === "admin" ? adminList.length : resellerList.length;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: active ? "rgba(124,58,237,0.2)" : "transparent",
                color: active ? "#a78bfa" : "#6b7280",
                border: active ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
              }}
            >
              {tab === "admin" ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              {tab === "admin" ? "Admin" : "Resellers"}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: active ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)",
                  color: active ? "#c4b5fd" : "#4b5563",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5" />
            IPs {activeTab === "admin" ? "Admin" : "Resellers"} ({displayList.length})
          </span>
          {displayList.length === 0 ? (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
              Acesso Livre
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
              Restrito
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">Nenhum IP cadastrado</p>
            <p className="text-gray-700 text-xs mt-1">
              {activeTab === "admin"
                ? "Adicione IPs para restringir o acesso ao painel admin"
                : "Adicione IPs para restringir o login de resellers específicos"}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {displayList.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3.5 group">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.5)" }}
                  />
                  <div>
                    <span className="text-white font-mono text-sm">{entry.ip}</span>
                    {entry.label && (
                      <span className="ml-3 text-gray-500 text-xs">{entry.label}</span>
                    )}
                    {entry.userType === "reseller" && entry.userId && (
                      <span
                        className="ml-3 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}
                      >
                        {getResellerName(entry.userId)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-700 text-xs">
                    {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  <button
                    onClick={() => removeIp.mutate({ id: entry.id })}
                    disabled={removeIp.isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
