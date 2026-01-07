import { useState } from "react";
import { z } from "zod";
import { Loader2, Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Digite um email válido" }).max(255),
  senha: z.string().trim().min(1, { message: "A senha é obrigatória" }).max(100),
});

type LoginState = "idle" | "loading" | "success" | "error";

const API_URL = "https://n8n.srv1251718.hstgr.cloud/webhook/login";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<LoginState>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});

  const validateForm = (): boolean => {
    const result = loginSchema.safeParse({ email, senha });
    
    if (!result.success) {
      const fieldErrors: { email?: string; senha?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "senha") fieldErrors.senha = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setState("loading");
    setMessage("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), senha: senha.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setState("success");
        setMessage(data.output || "Acesso Autorizado!");
      } else {
        setState("error");
        setMessage(data.output || "Credenciais inválidas");
      }
    } catch {
      setState("error");
      setMessage("Erro de conexão. Tente novamente.");
    }
  };

  const resetForm = () => {
    setState("idle");
    setMessage("");
    setEmail("");
    setSenha("");
    setErrors({});
  };

  return (
    <div className="w-full max-w-md px-4">
      <div 
        className={`glass-card p-8 sm:p-10 ${
          state === "error" ? "animate-shake" : ""
        } ${state === "success" ? "animate-success-pulse" : ""}`}
        style={{ animationDelay: "0.2s" }}
      >
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Lock className="h-10 w-10 text-primary-foreground" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <div className="mb-8 text-center animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Bem-vindo
          </h1>
          <p className="mt-2 text-muted-foreground">
            Faça login para continuar
          </p>
        </div>

        {state === "success" ? (
          <div className="animate-scale-in text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-primary">{message}</p>
            <button
              onClick={resetForm}
              className="mt-6 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Fazer outro login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`glass-input pl-12 ${
                    errors.email ? "border-destructive/50 ring-2 ring-destructive/20" : ""
                  }`}
                  disabled={state === "loading"}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-2 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    if (errors.senha) setErrors((prev) => ({ ...prev, senha: undefined }));
                  }}
                  className={`glass-input pl-12 pr-12 ${
                    errors.senha ? "border-destructive/50 ring-2 ring-destructive/20" : ""
                  }`}
                  disabled={state === "loading"}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="mt-2 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errors.senha}
                </p>
              )}
            </div>

            {/* Error Message */}
            {state === "error" && message && (
              <div className="animate-fade-in rounded-2xl bg-destructive/10 p-4 text-center">
                <p className="flex items-center justify-center gap-2 text-sm font-medium text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {message}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="animate-slide-up pt-2" style={{ animationDelay: "0.3s" }}>
              <button
                type="submit"
                disabled={state === "loading"}
                className="btn-primary-ios w-full"
              >
                {state === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin-slow" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground/70 animate-fade-in" style={{ animationDelay: "0.5s" }}>
        Ambiente seguro e protegido
      </p>
    </div>
  );
};

export default LoginForm;
