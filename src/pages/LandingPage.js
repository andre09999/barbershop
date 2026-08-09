import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicHeader } from "../components/AppShell";
import { api } from "../lib/api";
import { CATEGORY_LABELS } from "../lib/constants";

const benefits = [
  {
    number: "01",
    title: "Agenda sem conflitos",
    text: "Horários, profissionais e duração dos serviços organizados em uma única visão.",
  },
  {
    number: "02",
    title: "Relacionamento automático",
    text: "Confirmações e lembretes via WhatsApp com comunicação personalizada.",
  },
  {
    number: "03",
    title: "Gestão multiempresa",
    text: "Cada estabelecimento tem marca, equipe, serviços, preços e painel próprios.",
  },
];

export default function LandingPage() {
  const [activeBusinesses, setActiveBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  useEffect(() => {
    let active = true;
    api.publicBusinesses()
      .then(({ businesses }) => active && setActiveBusinesses(businesses))
      .catch(() => active && setActiveBusinesses([]))
      .finally(() => active && setLoadingBusinesses(false));
    return () => { active = false; };
  }, []);

  return (
    <div className="landing-page">
      <PublicHeader />
      <main>
        <section className="hero">
          <div className="container hero__grid">
            <div className="hero__content">
              <span className="pill">Agenda online · Gestão · WhatsApp</span>
              <h1>Mais organização para você. <em>Mais conveniência</em> para seus clientes.</h1>
              <p>
                Uma plataforma de agendamentos completa para barbearias, salões e clínicas
                crescerem com processos simples e uma experiência memorável.
              </p>
              <div className="hero__actions">
                <a className="button button--primary" href="#segmentos">
                  Encontrar estabelecimento
                </a>
                <Link className="button button--secondary" to="/entrar">
                  Acessar plataforma
                </Link>
              </div>
              <div className="hero__proof" aria-label="Benefícios rápidos">
                <span>✓ Configuração por empresa</span>
                <span>✓ Acesso por perfil</span>
                <span>✓ Pronto para WhatsApp Cloud</span>
              </div>
            </div>
            <div className="hero__visual" aria-label="Prévia do painel de agenda">
              <div className="floating-card floating-card--top">
                <span className="status-dot" />
                <div><strong>Novo agendamento</strong><small>Confirmado via WhatsApp</small></div>
              </div>
              <div className="schedule-card">
                <div className="schedule-card__header">
                  <div><span className="eyebrow">Hoje</span><strong>Agenda da equipe</strong></div>
                  <span className="schedule-card__date">08 AGO</span>
                </div>
                <div className="schedule-card__metric"><strong>12</strong><span>atendimentos</span></div>
                {["09:00", "10:30", "14:00", "16:30"].map((time, index) => (
                  <div className="schedule-row" key={time}>
                    <time>{time}</time>
                    <span className={`schedule-row__avatar tone-${index + 1}`}>{["M", "A", "J", "C"][index]}</span>
                    <div><strong>{["Marcos", "Amanda", "João", "Carla"][index]}</strong><small>{["Corte premium", "Escova", "Corte + barba", "Avaliação"][index]}</small></div>
                    <span className="tag tag--success">Confirmado</span>
                  </div>
                ))}
              </div>
              <div className="floating-card floating-card--bottom">
                <strong>+28%</strong><span>mais reservas no mês</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--light" id="recursos">
          <div className="container">
            <div className="section-heading">
              <div><span className="eyebrow">Operação inteligente</span><h2>Tudo o que seu negócio precisa para atender melhor.</h2></div>
              <p>Do primeiro contato ao pós-atendimento, a plataforma conecta gestão e experiência do cliente.</p>
            </div>
            <div className="benefit-grid">
              {benefits.map((benefit) => (
                <article className="benefit-card" key={benefit.number}>
                  <span>{benefit.number}</span><h3>{benefit.title}</h3><p>{benefit.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="segmentos">
          <div className="container">
            <div className="section-heading section-heading--center">
              <div><span className="eyebrow">Experiência personalizada</span><h2>Um sistema, diversas marcas.</h2></div>
              <p>O administrador cria cada operação; o responsável personaliza serviços, equipe, preços e horários.</p>
            </div>
            <div className="business-grid">
              {activeBusinesses.map((business) => (
                <article className="business-card" key={business.id} style={{ "--business-accent": business.accent }}>
                  <span className="business-card__mark">{business.name.charAt(0)}</span>
                  <div><span className="eyebrow">{CATEGORY_LABELS[business.category]}</span><h3>{business.name}</h3><p>{business.description}</p></div>
                  <Link to={`/agendar/${business.slug}`}>Ver agenda <span aria-hidden="true">→</span></Link>
                </article>
              ))}
              {loadingBusinesses && <article className="business-card business-card--placeholder"><span className="business-card__mark">…</span><div><span className="eyebrow">Consultando agenda</span><h3>Carregando estabelecimentos</h3><p>Os dados estão sendo buscados com segurança.</p></div></article>}
              <article className="business-card business-card--placeholder">
                <span className="business-card__mark">+</span>
                <div><span className="eyebrow">Sua próxima operação</span><h3>Marca personalizada</h3><p>Cadastre uma nova empresa e entregue um ambiente exclusivo ao responsável.</p></div>
                <Link to="/entrar">Abrir painel admin <span aria-hidden="true">→</span></Link>
              </article>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container cta-section__inner">
            <div><span className="eyebrow">Pronto para evoluir?</span><h2>Transforme horários livres em oportunidades.</h2></div>
            <Link className="button button--light" to="/entrar">Conhecer a plataforma</Link>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <div className="container"><strong>AgendaPro</strong><span>Produto desenvolvido por André Luis · Goiânia, GO</span><span>© 2026</span></div>
      </footer>
    </div>
  );
}
