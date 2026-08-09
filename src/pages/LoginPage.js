import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { Brand } from "../components/AppShell";
import { ROLE_LABELS } from "../data/seed";
import { usePlatform } from "../context/PlatformContext";

export default function LoginPage() {
  const { data, signInAs } = usePlatform();
  const [selectedUser, setSelectedUser] = useState(data.users[0].id);
  const history = useHistory();

  const handleSubmit = (event) => {
    event.preventDefault();
    signInAs(selectedUser);
    history.push("/painel");
  };

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <Brand />
        <div>
          <span className="pill pill--dark">Ambiente de demonstração</span>
          <h1>Uma visão diferente para cada responsabilidade.</h1>
          <p>Explore a plataforma como administrador, responsável pelo estabelecimento ou cliente.</p>
        </div>
        <div className="auth-showcase__stats">
          <div><strong>3</strong><span>níveis de acesso</span></div>
          <div><strong>1</strong><span>experiência integrada</span></div>
        </div>
      </section>
      <section className="auth-panel">
        <Link className="back-link" to="/">← Voltar para o início</Link>
        <form className="auth-card" onSubmit={handleSubmit}>
          <span className="eyebrow">Acesso à plataforma</span>
          <h2>Escolha um perfil</h2>
          <p>Na produção, este acesso será protegido por e-mail, senha segura e permissões da API.</p>
          <div className="profile-options">
            {data.users.slice(0, 3).map((user) => (
              <label className={selectedUser === user.id ? "profile-option is-selected" : "profile-option"} key={user.id}>
                <input checked={selectedUser === user.id} name="profile" onChange={() => setSelectedUser(user.id)} type="radio" value={user.id} />
                <span className="avatar">{user.name.charAt(0)}</span>
                <span><strong>{user.name}</strong><small>{ROLE_LABELS[user.role]}</small></span>
                <span className="profile-option__check" aria-hidden="true">✓</span>
              </label>
            ))}
          </div>
          <button className="button button--primary button--full" type="submit">Entrar na demonstração</button>
          <small className="form-note">Nenhuma senha real é utilizada ou armazenada nesta demonstração.</small>
        </form>
      </section>
    </main>
  );
}
