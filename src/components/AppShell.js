import { Link, NavLink, useHistory } from "react-router-dom";
import { ROLE_LABELS } from "../data/seed";
import { usePlatform } from "../context/PlatformContext";

export function Brand({ compact = false }) {
  return (
    <Link className={`brand ${compact ? "brand--compact" : ""}`} to="/">
      <span className="brand__mark" aria-hidden="true">A</span>
      <span>
        <strong>AgendaPro</strong>
        {!compact && <small>gestão inteligente</small>}
      </span>
    </Link>
  );
}

export function PublicHeader() {
  const { session } = usePlatform();

  return (
    <header className="public-header">
      <div className="container public-header__inner">
        <Brand />
        <nav aria-label="Navegação principal">
          <a href="/#recursos">Recursos</a>
          <a href="/#segmentos">Segmentos</a>
          <Link to="/agendar/oliveer-barbearia">Agendar demonstração</Link>
        </nav>
        <Link className="button button--small button--dark" to={session ? "/painel" : "/entrar"}>
          {session ? "Abrir painel" : "Entrar"}
        </Link>
      </div>
    </header>
  );
}

const navByRole = {
  platform_admin: [
    ["/painel", "Visão geral"],
    ["/painel/empresas", "Estabelecimentos"],
    ["/painel/configuracoes", "Configurações"],
  ],
  business_owner: [
    ["/painel", "Visão geral"],
    ["/painel/agenda", "Agenda"],
    ["/painel/servicos", "Serviços"],
    ["/painel/personalizacao", "Personalização"],
  ],
  customer: [
    ["/painel", "Meus agendamentos"],
    ["/agendar/oliveer-barbearia", "Novo agendamento"],
  ],
};

export function DashboardShell({ children }) {
  const { session, signOut } = usePlatform();
  const history = useHistory();

  const handleSignOut = () => {
    signOut();
    history.push("/");
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <Brand />
        <div className="sidebar__profile">
          <span className="avatar">{session.name.charAt(0)}</span>
          <div>
            <strong>{session.name}</strong>
            <small>{ROLE_LABELS[session.role]}</small>
          </div>
        </div>
        <nav className="sidebar__nav" aria-label="Menu do painel">
          {navByRole[session.role].map(([path, label], index) => (
            <NavLink exact={index === 0} activeClassName="is-active" key={path} to={path}>
              <span aria-hidden="true">{["◫", "◇", "＋", "◌"][index]}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="sidebar__logout" onClick={handleSignOut} type="button">
          Sair da conta
        </button>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="eyebrow">Área segura</span>
            <strong>{ROLE_LABELS[session.role]}</strong>
          </div>
          <Link className="button button--small button--ghost" to="/">
            Ver plataforma
          </Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
