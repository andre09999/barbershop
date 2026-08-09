import { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch } from "react-router-dom";
import { DashboardShell } from "../components/AppShell";
import { usePlatform } from "../context/PlatformContext";
import { api } from "../lib/api";
import { CATEGORY_LABELS, STATUS_LABELS } from "../lib/constants";
import { formatCurrency, formatDate, maskPhone, slugify } from "../lib/platformStore";

const emptyBusiness = {
  name: "",
  slug: "",
  category: "BARBERSHOP",
  ownerName: "",
  ownerEmail: "",
  ownerPassword: "",
  phone: "",
  whatsapp: "",
  address: "",
  description: "",
  accent: "#7257f6",
};

function Metric({ label, value, detail, tone = "violet" }) {
  return <article className={`metric-card metric-card--${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function Status({ value }) {
  return <span className={`tag tag--${String(value).toLowerCase()}`}>{STATUS_LABELS[value] || value}</span>;
}

function PageState({ children }) {
  return <div className="dashboard-content"><section className="panel empty-state"><span>◇</span><strong>{children}</strong></section></div>;
}

function ChangePasswordPanel() {
  const { refreshSession } = usePlatform();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmation: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmation) return setError("A confirmação da nova senha não corresponde.");
    try {
      await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      await refreshSession();
      setForm({ currentPassword: "", newPassword: "", confirmation: "" });
      setNotice("Senha atualizada. As novas regras já estão valendo.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return <form className="panel compact-form" onSubmit={handleSubmit}><span className="eyebrow">Segurança</span><h2>Alterar senha</h2><p className="panel-copy">Use ao menos 12 caracteres, incluindo maiúscula, minúscula, número e símbolo.</p>{notice && <p className="form-success">✓ {notice}</p>}{error && <p className="form-error">{error}</p>}<label className="field"><span>Senha atual</span><input autoComplete="current-password" onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} required type="password" value={form.currentPassword} /></label><label className="field"><span>Nova senha</span><input autoComplete="new-password" minLength="12" onChange={(event) => setForm({ ...form, newPassword: event.target.value })} required type="password" value={form.newPassword} /></label><label className="field"><span>Confirmar nova senha</span><input autoComplete="new-password" minLength="12" onChange={(event) => setForm({ ...form, confirmation: event.target.value })} required type="password" value={form.confirmation} /></label><button className="button button--primary" type="submit">Atualizar senha</button></form>;
}

function AdminOverview() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  useEffect(() => {
    let active = true;
    api.adminOverview().then((data) => active && setState({ loading: false, data, error: "" })).catch((error) => active && setState({ loading: false, data: null, error: error.message }));
    return () => { active = false; };
  }, []);
  if (state.loading) return <PageState>Carregando indicadores reais…</PageState>;
  if (state.error) return <PageState>{state.error}</PageState>;
  const { metrics, recentAudit } = state.data;
  return <div className="dashboard-content"><div className="dashboard-heading"><div><span className="eyebrow">Controle da plataforma</span><h1>Visão geral</h1><p>Indicadores consolidados de todas as operações.</p></div><Link className="button button--primary" to="/painel/empresas#nova-empresa">+ Novo estabelecimento</Link></div><div className="metric-grid"><Metric label="Empresas ativas" value={metrics.activeBusinesses} detail="operações publicadas" /><Metric label="Agendamentos" value={metrics.appointments} detail="reservas registradas" tone="blue" /><Metric label="Profissionais" value={metrics.professionals} detail="perfis ativos" tone="green" /><Metric label="Valor reservado" value={formatCurrency(metrics.bookedValueInCents / 100)} detail="em serviços agendados" tone="amber" /></div><section className="panel"><div className="panel__header"><div><h2>Histórico da plataforma</h2><p>Trilha de auditoria das mudanças mais recentes.</p></div></div><div className="audit-list">{recentAudit.length ? recentAudit.map((item) => <article key={item.id}><span className="audit-mark">✓</span><div><strong>{item.action.replaceAll("_", " ")}</strong><small>{item.entityType} · {new Date(item.createdAt).toLocaleString("pt-BR")}</small></div></article>) : <div className="empty-state"><strong>Nenhuma atividade registrada</strong></div>}</div></section></div>;
}

function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyBusiness);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(() => api.adminBusinesses().then(({ businesses: value }) => setBusinesses(value)).finally(() => setLoading(false)), []);
  useEffect(() => { load().catch((requestError) => setError(requestError.message)); }, [load]);

  const updateName = (name) => setForm((current) => ({ ...current, name, slug: current.slug ? current.slug : slugify(name) }));
  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const { business } = await api.createBusiness(form);
      setForm(emptyBusiness);
      setNotice(`${business.name} foi criado. Envie a senha inicial ao responsável por um canal seguro.`);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const toggleStatus = async (business) => {
    try {
      await api.setBusinessStatus(business.id, business.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return <div className="dashboard-content"><div className="dashboard-heading"><div><span className="eyebrow">Gestão multiempresa</span><h1>Estabelecimentos</h1><p>Cadastre operações, responsáveis e páginas públicas independentes.</p></div><a className="button button--primary" href="#nova-empresa">+ Novo estabelecimento</a></div><section className="panel"><div className="panel__header"><div><h2>Operações cadastradas</h2><p>Dados vindos diretamente do PostgreSQL.</p></div><span className="tag tag--neutral">{businesses.length} no total</span></div>{loading ? <div className="empty-state"><strong>Carregando estabelecimentos…</strong></div> : <div className="tenant-table">{businesses.map((business) => <div className="tenant-row" key={business.id}><span className="business-mini-mark" style={{ background: business.accent }}>{business.name.charAt(0)}</span><div><strong>{business.name}</strong><small>{CATEGORY_LABELS[business.category]} · /{business.slug}</small></div><div><span>Responsável</span><strong>{business.owner.name}</strong></div><div><span>Status</span><Status value={business.status} /></div><div className="row-actions"><Link to={`/agendar/${business.slug}`}>Abrir agenda</Link><button onClick={() => toggleStatus(business)} type="button">{business.status === "ACTIVE" ? "Suspender" : "Reativar"}</button></div></div>)}</div>}</section><section className="panel form-panel" id="nova-empresa"><div className="panel__header"><div><span className="eyebrow">Onboarding seguro</span><h2>Cadastrar novo estabelecimento</h2><p>O responsável será obrigado a trocar a senha inicial no primeiro acesso.</p></div></div>{notice && <p className="form-success" role="status">✓ {notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}<form className="admin-form" onSubmit={handleCreate}><div className="field-grid field-grid--three"><label className="field"><span>Nome da empresa</span><input onChange={(event) => updateName(event.target.value)} required value={form.name} /></label><label className="field"><span>Endereço da agenda</span><input onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} required value={form.slug} /></label><label className="field"><span>Segmento</span><select onChange={(event) => setForm({ ...form, category: event.target.value })} value={form.category}><option value="BARBERSHOP">Barbearia</option><option value="SALON">Salão de beleza</option><option value="CLINIC">Clínica</option></select></label></div><div className="field-grid field-grid--three"><label className="field"><span>Nome do responsável</span><input onChange={(event) => setForm({ ...form, ownerName: event.target.value })} required value={form.ownerName} /></label><label className="field"><span>E-mail do responsável</span><input onChange={(event) => setForm({ ...form, ownerEmail: event.target.value })} required type="email" value={form.ownerEmail} /></label><label className="field"><span>Senha inicial forte</span><input autoComplete="new-password" minLength="12" onChange={(event) => setForm({ ...form, ownerPassword: event.target.value })} required type="password" value={form.ownerPassword} /></label></div><div className="field-grid field-grid--three"><label className="field"><span>Telefone</span><input onChange={(event) => setForm({ ...form, phone: maskPhone(event.target.value) })} required value={form.phone} /></label><label className="field"><span>WhatsApp</span><input onChange={(event) => setForm({ ...form, whatsapp: maskPhone(event.target.value) })} required value={form.whatsapp} /></label><label className="field field--color"><span>Cor principal</span><input onChange={(event) => setForm({ ...form, accent: event.target.value })} type="color" value={form.accent} /><b>{form.accent}</b></label></div><label className="field"><span>Endereço físico</span><input onChange={(event) => setForm({ ...form, address: event.target.value })} required value={form.address} /></label><label className="field"><span>Descrição da marca</span><textarea onChange={(event) => setForm({ ...form, description: event.target.value })} required value={form.description} /></label><button className="button button--primary" type="submit">Criar empresa e responsável</button></form></section></div>;
}

function AdminSettings() {
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api.adminSettings().then(({ settings }) => setForm(settings)).catch((requestError) => setError(requestError.message)); }, []);
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { settings } = await api.updateAdminSettings(form);
      setForm(settings);
      setNotice("Configurações da plataforma atualizadas.");
      setError("");
    } catch (requestError) { setError(requestError.message); }
  };
  if (!form) return <PageState>{error || "Carregando configurações…"}</PageState>;
  return <div className="dashboard-content"><div className="dashboard-heading"><div><span className="eyebrow">Governança</span><h1>Configurações</h1><p>Parâmetros globais e segurança da conta administrativa.</p></div></div><section className="two-column"><form className="panel compact-form" onSubmit={handleSubmit}><span className="eyebrow">Plataforma</span><h2>Preferências globais</h2>{notice && <p className="form-success">✓ {notice}</p>}{error && <p className="form-error">{error}</p>}<label className="field"><span>Nome do produto</span><input onChange={(event) => setForm({ ...form, platformName: event.target.value })} required value={form.platformName} /></label><label className="field"><span>E-mail de suporte</span><input onChange={(event) => setForm({ ...form, supportEmail: event.target.value })} type="email" value={form.supportEmail || ""} /></label><div className="field-grid"><label className="field"><span>Antecedência máxima (dias)</span><input min="7" max="365" onChange={(event) => setForm({ ...form, bookingWindowDays: event.target.value })} type="number" value={form.bookingWindowDays} /></label><label className="field field--color"><span>Cor padrão</span><input onChange={(event) => setForm({ ...form, defaultAccent: event.target.value })} type="color" value={form.defaultAccent} /><b>{form.defaultAccent}</b></label></div><button className="button button--primary" type="submit">Salvar configurações</button></form><ChangePasswordPanel /></section></div>;
}

function AdminDashboard() {
  return <DashboardShell><Switch><Route exact path="/painel" component={AdminOverview} /><Route exact path="/painel/empresas" component={AdminBusinesses} /><Route exact path="/painel/configuracoes" component={AdminSettings} /><Route component={AdminOverview} /></Switch></DashboardShell>;
}

function OwnerOverview({ data }) {
  const { business, appointments } = data;
  const activeServices = business.services.filter((item) => item.active);
  const average = activeServices.reduce((total, service) => total + service.priceInCents, 0) / Math.max(activeServices.length, 1);
  return <div className="dashboard-content" style={{ "--tenant-accent": business.accent }}><div className="dashboard-heading"><div><span className="eyebrow">{CATEGORY_LABELS[business.category]}</span><h1>{business.name}</h1><p>Resumo operacional do seu estabelecimento.</p></div><Link className="button button--tenant" to={`/agendar/${business.slug}`}>Ver página de reservas</Link></div><div className="metric-grid"><Metric label="Agendamentos" value={appointments.length} detail="reservas registradas" /><Metric label="Serviços ativos" value={activeServices.length} detail="opções publicadas" tone="blue" /><Metric label="Equipe" value={business.professionals.filter((item) => item.active).length} detail="profissionais ativos" tone="green" /><Metric label="Ticket médio" value={formatCurrency(average / 100)} detail="por serviço" tone="amber" /></div><AppointmentPanel appointments={appointments.slice(0, 10)} /><ChangePasswordPanel /></div>;
}

function AppointmentPanel({ appointments, customerView = false, onCancel, onStatus }) {
  return <section className="panel"><div className="panel__header"><div><h2>{customerView ? "Seus agendamentos" : "Agenda e histórico"}</h2><p>{customerView ? "Acompanhe todas as suas reservas." : "Atualize o atendimento e consulte cada alteração."}</p></div></div><div className="appointment-table"><div className="appointment-row appointment-row--header"><span>{customerView ? "Estabelecimento" : "Cliente"}</span><span>Serviço</span><span>Data</span><span>Status</span></div>{appointments.length ? appointments.map((appointment) => <div className="appointment-entry" key={appointment.id}><div className="appointment-row"><span><strong>{customerView ? appointment.business.name : appointment.customerName}</strong><small>{customerView ? appointment.business.address : maskPhone(appointment.customerPhone)}</small></span><span><strong>{appointment.service.name}</strong><small>{appointment.professional.name} · {formatCurrency(appointment.service.priceInCents / 100)}</small></span><span><strong>{formatDate(appointment.date)}</strong><small>{appointment.time}</small></span><span><Status value={appointment.status} />{onStatus && <select aria-label="Atualizar status" onChange={(event) => onStatus(appointment.id, event.target.value)} value={appointment.status}><option value="PENDING">Pendente</option><option value="CONFIRMED">Confirmado</option><option value="COMPLETED">Concluído</option><option value="CANCELLED">Cancelado</option></select>}{onCancel && !["COMPLETED", "CANCELLED"].includes(appointment.status) && <button className="text-button text-button--danger" onClick={() => onCancel(appointment.id)} type="button">Cancelar</button>}</span></div>{appointment.statusHistory?.length > 0 && <details className="history-details"><summary>Ver histórico ({appointment.statusHistory.length})</summary>{appointment.statusHistory.map((history) => <div key={history.id}><Status value={history.toStatus} /><span>{new Date(history.createdAt).toLocaleString("pt-BR")}{history.note ? ` · ${history.note}` : ""}</span></div>)}</details>}</div>) : <div className="empty-state"><span>◇</span><strong>Nenhum agendamento encontrado</strong><p>As novas reservas aparecerão aqui automaticamente.</p></div>}</div></section>;
}

function OwnerAgenda({ data, refresh }) {
  const [error, setError] = useState("");
  const [professionalForm, setProfessionalForm] = useState({ name: "", specialty: "" });
  const setStatus = async (id, status) => { try { await api.setAppointmentStatus(id, status); await refresh(); } catch (requestError) { setError(requestError.message); } };
  const addProfessional = async (event) => { event.preventDefault(); try { await api.createProfessional(professionalForm); setProfessionalForm({ name: "", specialty: "" }); await refresh(); } catch (requestError) { setError(requestError.message); } };
  const toggleProfessional = async (professional) => { try { await api.updateProfessional(professional.id, { active: !professional.active }); await refresh(); } catch (requestError) { setError(requestError.message); } };
  return <div className="dashboard-content" style={{ "--tenant-accent": data.business.accent }}><div className="dashboard-heading"><div><span className="eyebrow">Operação diária</span><h1>Agenda da equipe</h1><p>Atendimentos, profissionais e histórico em um só lugar.</p></div></div>{error && <p className="form-error">{error}</p>}<AppointmentPanel appointments={data.appointments} onStatus={setStatus} /><section className="two-column"><div className="panel"><div className="panel__header"><div><h2>Equipe cadastrada</h2><p>Profissionais disponíveis na reserva pública.</p></div></div><div className="service-list">{data.business.professionals.map((professional) => <article key={professional.id}><span className="avatar">{professional.name.charAt(0)}</span><div><strong>{professional.name}</strong><small>{professional.specialty}</small></div><div className="service-actions"><Status value={professional.active ? "ACTIVE" : "SUSPENDED"} /><button className="text-button" onClick={() => toggleProfessional(professional)} type="button">{professional.active ? "Desativar" : "Reativar"}</button></div></article>)}</div></div><form className="panel compact-form" onSubmit={addProfessional}><span className="eyebrow">Equipe</span><h2>Novo profissional</h2><label className="field"><span>Nome</span><input onChange={(event) => setProfessionalForm({ ...professionalForm, name: event.target.value })} required value={professionalForm.name} /></label><label className="field"><span>Especialidade</span><input onChange={(event) => setProfessionalForm({ ...professionalForm, specialty: event.target.value })} required value={professionalForm.specialty} /></label><button className="button button--tenant" type="submit">Adicionar profissional</button></form></section></div>;
}

function OwnerServices({ data, refresh }) {
  const [form, setForm] = useState({ name: "", description: "", duration: 45, price: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); try { await api.createService({ name: form.name, description: form.description, duration: form.duration, priceInCents: Math.round(Number(form.price) * 100) }); setForm({ name: "", description: "", duration: 45, price: "" }); setNotice("Serviço publicado na agenda."); setError(""); await refresh(); } catch (requestError) { setError(requestError.message); } };
  const toggle = async (service) => { try { await api.updateService(service.id, { active: !service.active }); await refresh(); } catch (requestError) { setError(requestError.message); } };
  return <div className="dashboard-content" style={{ "--tenant-accent": data.business.accent }}><div className="dashboard-heading"><div><span className="eyebrow">Catálogo</span><h1>Serviços e valores</h1><p>Controle o que aparece na agenda pública.</p></div></div><section className="two-column"><div className="panel"><div className="panel__header"><div><h2>Catálogo publicado</h2><p>Valores persistidos em centavos para precisão financeira.</p></div></div><div className="service-list">{data.business.services.map((service) => <article key={service.id}><span className="service-option__icon">✦</span><div><strong>{service.name}</strong><small>{service.description}</small><em>{service.duration} minutos · {service.active ? "ativo" : "oculto"}</em></div><div className="service-actions"><b>{formatCurrency(service.priceInCents / 100)}</b><button className="text-button" onClick={() => toggle(service)} type="button">{service.active ? "Ocultar" : "Publicar"}</button></div></article>)}</div></div><form className="panel compact-form" onSubmit={submit}><span className="eyebrow">Novo serviço</span><h2>Adicionar ao catálogo</h2>{notice && <p className="form-success">✓ {notice}</p>}{error && <p className="form-error">{error}</p>}<label className="field"><span>Nome</span><input onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label><label className="field"><span>Descrição</span><textarea onChange={(event) => setForm({ ...form, description: event.target.value })} required value={form.description} /></label><div className="field-grid"><label className="field"><span>Duração (min)</span><input min="15" onChange={(event) => setForm({ ...form, duration: event.target.value })} step="15" type="number" value={form.duration} /></label><label className="field"><span>Valor (R$)</span><input min="0" onChange={(event) => setForm({ ...form, price: event.target.value })} step="0.01" type="number" value={form.price} /></label></div><button className="button button--tenant" type="submit">Publicar serviço</button></form></section></div>;
}

function OwnerBrand({ data, refresh }) {
  const { business } = data;
  const [form, setForm] = useState({ description: business.description, accent: business.accent, openingTime: business.openingTime, closingTime: business.closingTime, workingDays: business.workingDays });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); try { await api.updateOwnerBusiness(form); setNotice("Personalização e expediente atualizados."); setError(""); await refresh(); } catch (requestError) { setError(requestError.message); } };
  return <div className="dashboard-content" style={{ "--tenant-accent": business.accent }}><div className="dashboard-heading"><div><span className="eyebrow">Identidade da marca</span><h1>Personalização</h1><p>Atualize a experiência pública da sua agenda.</p></div></div><section className="two-column"><form className="panel compact-form" onSubmit={submit}>{notice && <p className="form-success">✓ {notice}</p>}{error && <p className="form-error">{error}</p>}<label className="field"><span>Texto de apresentação</span><textarea onChange={(event) => setForm({ ...form, description: event.target.value })} value={form.description} /></label><label className="field field--color"><span>Cor principal</span><input onChange={(event) => setForm({ ...form, accent: event.target.value })} type="color" value={form.accent} /><b>{form.accent}</b></label><div className="field-grid"><label className="field"><span>Abertura</span><input onChange={(event) => setForm({ ...form, openingTime: event.target.value })} type="time" value={form.openingTime} /></label><label className="field"><span>Encerramento</span><input onChange={(event) => setForm({ ...form, closingTime: event.target.value })} type="time" value={form.closingTime} /></label></div><button className="button button--tenant" type="submit">Salvar personalização</button></form><div className="brand-preview" style={{ "--tenant-accent": form.accent }}><span className="eyebrow">Prévia do cliente</span><span className="tenant-brand__mark">{business.name.charAt(0)}</span><h2>{business.name}</h2><p>{form.description}</p><span className="button button--tenant">Agendar atendimento</span></div></section></div>;
}

function OwnerDashboard() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const refresh = useCallback(async () => { const data = await api.ownerDashboard(); setState({ loading: false, data, error: "" }); }, []);
  useEffect(() => { refresh().catch((error) => setState({ loading: false, data: null, error: error.message })); }, [refresh]);
  return <DashboardShell>{state.loading ? <PageState>Carregando operação…</PageState> : state.error ? <PageState>{state.error}</PageState> : <Switch><Route exact path="/painel" render={() => <OwnerOverview data={state.data} />} /><Route exact path="/painel/agenda" render={() => <OwnerAgenda data={state.data} refresh={refresh} />} /><Route exact path="/painel/servicos" render={() => <OwnerServices data={state.data} refresh={refresh} />} /><Route exact path="/painel/personalizacao" render={() => <OwnerBrand data={state.data} refresh={refresh} />} /><Route render={() => <OwnerOverview data={state.data} />} /></Switch>}</DashboardShell>;
}

function CustomerDashboard() {
  const { session } = usePlatform();
  const [state, setState] = useState({ loading: true, appointments: [], error: "" });
  const load = useCallback(async () => { const { appointments } = await api.customerAppointments(); setState({ loading: false, appointments, error: "" }); }, []);
  useEffect(() => { load().catch((error) => setState({ loading: false, appointments: [], error: error.message })); }, [load]);
  const cancel = async (id) => { try { await api.cancelAppointment(id); await load(); } catch (error) { setState((current) => ({ ...current, error: error.message })); } };
  if (state.loading) return <DashboardShell><PageState>Carregando seus agendamentos…</PageState></DashboardShell>;
  return <DashboardShell><div className="dashboard-content"><div className="dashboard-heading"><div><span className="eyebrow">Olá, {session.name.split(" ")[0]}</span><h1>Meus agendamentos</h1><p>Reservas atuais e histórico em uma única conta.</p></div><a className="button button--primary" href="/#segmentos">+ Novo agendamento</a></div>{state.error && <p className="form-error">{state.error}</p>}<div className="metric-grid"><Metric label="Reservas" value={state.appointments.length} detail="no seu histórico" /><Metric label="Confirmados" value={state.appointments.filter((item) => item.status === "CONFIRMED").length} detail="horários garantidos" tone="green" /></div><AppointmentPanel appointments={state.appointments} customerView onCancel={cancel} /><ChangePasswordPanel /></div></DashboardShell>;
}

export default function DashboardPage() {
  const { session } = usePlatform();
  if (session.role === "PLATFORM_ADMIN") return <AdminDashboard />;
  if (session.role === "BUSINESS_OWNER") return <OwnerDashboard />;
  return <CustomerDashboard />;
}
