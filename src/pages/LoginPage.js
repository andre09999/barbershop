import { useState } from "react";
import { Link, Redirect, useHistory, useLocation } from "react-router-dom";
import { Brand } from "../components/AppShell";
import { usePlatform } from "../context/PlatformContext";
import { maskPhone } from "../lib/platformStore";

const loginInitial = { email: "", password: "" };
const registerInitial = { name: "", email: "", phone: "", password: "", passwordConfirmation: "" };

export default function LoginPage() {
  const { session, authLoading, signIn, registerCustomer } = usePlatform();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(loginInitial);
  const [registerForm, setRegisterForm] = useState(registerInitial);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const history = useHistory();
  const location = useLocation();

  if (!authLoading && session) return <Redirect to="/painel" />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (mode === "register" && registerForm.password !== registerForm.passwordConfirmation) {
      setError("A confirmação de senha não corresponde.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") await signIn(loginForm);
      else {
        await registerCustomer({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          password: registerForm.password,
        });
      }
      history.replace(location.state?.from?.pathname || "/painel");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <Brand />
        <div>
          <span className="pill pill--dark">Acesso protegido</span>
          <h1>Sua agenda, sua equipe e seus clientes no mesmo lugar.</h1>
          <p>Cada perfil enxerga somente o necessário, com dados persistidos e permissões verificadas pela API.</p>
        </div>
        <div className="auth-showcase__stats">
          <div><strong>3</strong><span>níveis de acesso</span></div>
          <div><strong>24h</strong><span>disponível para reservas</span></div>
        </div>
      </section>
      <section className="auth-panel">
        <Link className="back-link" to="/">← Voltar para o início</Link>
        <form className="auth-card" onSubmit={handleSubmit}>
          <span className="eyebrow">Área segura</span>
          <h2>{mode === "login" ? "Entrar na plataforma" : "Criar conta de cliente"}</h2>
          <p>{mode === "login" ? "Use seu e-mail e senha para acessar o painel correspondente ao seu perfil." : "Cadastre-se para reunir seus agendamentos e histórico em uma única conta."}</p>
          <div className="auth-tabs" role="tablist" aria-label="Tipo de acesso">
            <button aria-selected={mode === "login"} className={mode === "login" ? "is-active" : ""} onClick={() => { setMode("login"); setError(""); }} role="tab" type="button">Já tenho acesso</button>
            <button aria-selected={mode === "register"} className={mode === "register" ? "is-active" : ""} onClick={() => { setMode("register"); setError(""); }} role="tab" type="button">Sou cliente novo</button>
          </div>
          {mode === "login" ? (
            <div className="auth-fields">
              <label className="field"><span>E-mail</span><input autoComplete="email" onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} required type="email" value={loginForm.email} /></label>
              <label className="field"><span>Senha</span><input autoComplete="current-password" minLength="8" onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} required type="password" value={loginForm.password} /></label>
            </div>
          ) : (
            <div className="auth-fields">
              <label className="field"><span>Nome completo</span><input autoComplete="name" onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} required value={registerForm.name} /></label>
              <div className="field-grid">
                <label className="field"><span>E-mail</span><input autoComplete="email" onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} required type="email" value={registerForm.email} /></label>
                <label className="field"><span>WhatsApp</span><input autoComplete="tel" onChange={(event) => setRegisterForm({ ...registerForm, phone: maskPhone(event.target.value) })} required value={registerForm.phone} /></label>
              </div>
              <div className="field-grid">
                <label className="field"><span>Senha</span><input autoComplete="new-password" minLength="12" onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} required type="password" value={registerForm.password} /></label>
                <label className="field"><span>Confirmar senha</span><input autoComplete="new-password" minLength="12" onChange={(event) => setRegisterForm({ ...registerForm, passwordConfirmation: event.target.value })} required type="password" value={registerForm.passwordConfirmation} /></label>
              </div>
              <small className="password-hint">Mínimo de 12 caracteres, com maiúscula, minúscula, número e símbolo.</small>
            </div>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button--primary button--full" disabled={submitting || authLoading} type="submit">
            {submitting ? "Validando acesso…" : mode === "login" ? "Entrar com segurança" : "Criar minha conta"}
          </button>
          <small className="form-note">A sessão é protegida em cookie seguro; sua senha nunca é enviada de volta ao navegador.</small>
        </form>
      </section>
    </main>
  );
}
