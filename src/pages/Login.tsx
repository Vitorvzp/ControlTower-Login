import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound, RefreshCw, Clock } from "lucide-react";
import { loginCredentials, verify2FA } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Digite um email válido" }).max(255),
  senha: z.string().trim().min(1, { message: "A senha é obrigatória" }).max(100),
});

type LoginStep = "credentials" | "verification";
type LoginState = "idle" | "loading" | "success" | "error";

const TIMER_DURATION = 7 * 60; // 7 minutos

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<LoginStep>("credentials");
  const [state, setState] = useState<LoginState>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isResending, setIsResending] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Redireciona se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

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

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(TIMER_DURATION);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setStep("credentials");
          setState("error");
          setMessage("Código expirado. Faça login novamente.");
          setCode(["", "", "", "", "", ""]);
          return TIMER_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setState("loading");
    setMessage("");

    try {
      const result = await loginCredentials(email, senha);

      if (result.success) {
        setStep("verification");
        setState("idle");
        setMessage("Código enviado para seu email!");
        startTimer();
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setState("error");
        setMessage(result.output || "Credenciais inválidas");
      }
    } catch {
      setState("error");
      setMessage("Erro de conexão. Tente novamente.");
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setMessage("");
    setCode(["", "", "", "", "", ""]);

    try {
      const result = await loginCredentials(email, senha);

      if (result.success) {
        startTimer();
        setState("idle");
        setMessage("Novo código enviado!");
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setState("error");
        setMessage(result.output || "Erro ao reenviar código");
      }
    } catch {
      setState("error");
      setMessage("Erro de conexão. Tente novamente.");
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleVerificationSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData) {
      const newCode = [...code];
      pastedData.split("").forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setCode(newCode);
      
      const lastFilledIndex = Math.min(pastedData.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();

      if (pastedData.length === 6) {
        handleVerificationSubmit(pastedData);
      }
    }
  };

  const handleVerificationSubmit = async (codeValue?: string) => {
    const fullCode = codeValue || code.join("");
    
    if (fullCode.length !== 6) {
      setState("error");
      setMessage("Digite o código completo");
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const result = await verify2FA(email, parseInt(fullCode));

      if (result.success && result.token && result.user) {
        clearTimer();
        login(result.user, result.token);
        setState("success");
        setMessage("Acesso Autorizado!");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setState("error");
        setMessage(result.output || "Código inválido");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setState("error");
      setMessage("Erro de conexão. Tente novamente.");
    }
  };

  const handleBackToCredentials = () => {
    clearTimer();
    setStep("credentials");
    setState("idle");
    setMessage("");
    setCode(["", "", "", "", "", ""]);
  };

  return (
    <main className="gradient-bg relative min-h-screen overflow-hidden">
      <div className="floating-orb floating-orb-1" aria-hidden="true" />
      <div className="floating-orb floating-orb-2" aria-hidden="true" />
      <div className="floating-orb floating-orb-3" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <div 
            className={`glass-card p-8 sm:p-10 ${
              state === "error" ? "animate-shake" : ""
            } ${state === "success" ? "animate-success-pulse" : ""}`}
          >
            {/* Logo */}
            <div className="mb-8 flex justify-center animate-slide-up">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                {step === "credentials" ? (
                  <Lock className="h-10 w-10 text-primary-foreground" strokeWidth={2.5} />
                ) : (
                  <KeyRound className="h-10 w-10 text-primary-foreground" strokeWidth={2.5} />
                )}
              </div>
            </div>

            {/* Title */}
            <div className="mb-8 text-center animate-slide-up">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {step === "credentials" ? "Bem-vindo" : "Verificação"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {step === "credentials" 
                  ? "Faça login para continuar" 
                  : `Digite o código enviado para ${email}`}
              </p>
            </div>

            {state === "success" ? (
              <div className="animate-scale-in text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-primary">{message}</p>
              </div>
            ) : step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                {/* Email */}
                <div className="animate-slide-up">
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

                {/* Password */}
                <div className="animate-slide-up">
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
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.senha && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {errors.senha}
                    </p>
                  )}
                </div>

                {/* Error */}
                {state === "error" && message && (
                  <div className="animate-fade-in rounded-2xl bg-destructive/10 p-4 text-center">
                    <p className="flex items-center justify-center gap-2 text-sm font-medium text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {message}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <div className="animate-slide-up pt-2">
                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="btn-primary-ios w-full"
                  >
                    {state === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Verificando...
                      </span>
                    ) : (
                      "Continuar"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Timer */}
                <div className="animate-fade-in flex items-center justify-center gap-2">
                  <Clock className={`h-5 w-5 ${timeLeft <= 60 ? "text-destructive" : "text-muted-foreground"}`} />
                  <span className={`text-lg font-mono font-semibold ${timeLeft <= 60 ? "text-destructive" : "text-foreground"}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Success message */}
                {message && state === "idle" && (
                  <div className="animate-fade-in rounded-2xl bg-primary/10 p-4 text-center">
                    <p className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      {message}
                    </p>
                  </div>
                )}

                {/* Code Input */}
                <div className="animate-slide-up flex justify-center gap-2 sm:gap-3">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="glass-input h-14 w-11 p-0 text-center text-xl font-bold sm:h-16 sm:w-12 sm:text-2xl"
                      disabled={state === "loading" || isResending}
                    />
                  ))}
                </div>

                {/* Error */}
                {state === "error" && message && (
                  <div className="animate-fade-in rounded-2xl bg-destructive/10 p-4 text-center">
                    <p className="flex items-center justify-center gap-2 text-sm font-medium text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {message}
                    </p>
                  </div>
                )}

                {/* Verify Button */}
                <div className="animate-slide-up">
                  <button
                    type="button"
                    onClick={() => handleVerificationSubmit()}
                    disabled={state === "loading" || isResending || code.join("").length !== 6}
                    className="btn-primary-ios w-full disabled:opacity-50"
                  >
                    {state === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Verificando...
                      </span>
                    ) : (
                      "Verificar"
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="animate-slide-up flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
                    disabled={state === "loading" || isResending}
                  >
                    {isResending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Reenviar código
                  </button>
                  <span className="text-muted-foreground/40">|</span>
                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    disabled={state === "loading"}
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
