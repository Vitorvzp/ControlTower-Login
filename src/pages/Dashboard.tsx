import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getEmbarcadoras, getUsuarios, getTransportadoras } from "@/lib/api";
import type { Embarcadora, Transportadora, User } from "@/types";
import { 
  Loader2, 
  LogOut, 
  Users, 
  Building2, 
  Truck, 
  UserPlus,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TabType = "embarcadoras" | "usuarios" | "transportadoras";

const Dashboard = () => {
  const { user, token, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("embarcadoras");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [embarcadoras, setEmbarcadoras] = useState<Embarcadora[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);

  const fetchData = async (tab: TabType) => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);

    try {
      switch (tab) {
        case "embarcadoras":
          const emb = await getEmbarcadoras(token);
          setEmbarcadoras(emb);
          break;
        case "usuarios":
          const usr = await getUsuarios(token);
          setUsuarios(usr);
          break;
        case "transportadoras":
          const trn = await getTransportadoras(token);
          setTransportadoras(trn);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, token]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleRefresh = () => {
    fetchData(activeTab);
  };

  const tabs = [
    { id: "embarcadoras" as TabType, label: "Embarcadoras", icon: Building2 },
    { id: "usuarios" as TabType, label: "Usuários", icon: Users },
    { id: "transportadoras" as TabType, label: "Transportadoras", icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Olá, {user?.nome || user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Criar Usuário</span>
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Content Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {activeTab === "embarcadoras" && <Building2 className="h-5 w-5" />}
              {activeTab === "usuarios" && <Users className="h-5 w-5" />}
              {activeTab === "transportadoras" && <Truck className="h-5 w-5" />}
              {tabs.find(t => t.id === activeTab)?.label}
            </CardTitle>
            <CardDescription>
              {activeTab === "embarcadoras" && "Lista de empresas embarcadoras cadastradas"}
              {activeTab === "usuarios" && "Lista de usuários do sistema"}
              {activeTab === "transportadoras" && "Lista de transportadoras cadastradas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-destructive font-medium">{error}</p>
                <Button variant="outline" onClick={handleRefresh} className="mt-4">
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === "embarcadoras" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {embarcadoras.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhuma embarcadora encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        embarcadoras.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.nome}</TableCell>
                            <TableCell>{item.email || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {activeTab === "usuarios" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhum usuário encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        usuarios.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.nome || "-"}</TableCell>
                            <TableCell>{item.email}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                item.tipo === 1 
                                  ? "bg-primary/10 text-primary" 
                                  : "bg-secondary text-secondary-foreground"
                              }`}>
                                {item.tipo === 1 ? "Admin" : "Usuário"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {activeTab === "transportadoras" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transportadoras.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhuma transportadora encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        transportadoras.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.nome}</TableCell>
                            <TableCell>{item.email || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
