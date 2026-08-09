import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DashboardShell } from "../components/AppShell";
import { CATEGORY_LABELS } from "../data/seed";
import { usePlatform } from "../context/PlatformContext";
import { formatCurrency, formatDate, maskPhone } from "../lib/platformStore";

const emptyBusiness = {
  name: "",
  category: "barbershop",
  ownerName: "",
  ownerEmail: "",
  whatsapp: "",
  address: "",
  description: "",
  accent: "#7c5cff",
};

function Metric({ label, value, detail, tone = "violet" }) {
  return <article className={`metric-card metric-card--${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function Status({ value }) {
  const labels = { confirmed: "Confirmado", completed: "Concluído", cancelled: "Cancelado", pending: "Pendente" };
  return <span className={`tag tag--${value}`}>{labels[value] || value}</span>;
}

function AdminDashboard() {
  const { data, createBusiness } = usePlatform();
  const location = useLocation();
  const [form, setForm] = useState(emptyBusiness);
  const [notice, setNotice] = useState("");
  const isCompanies = location.pathname.endsWith("/empresas");

  const handleCreate = (event) => {
    event.preventDefault();
    const business = createBusiness(form);
    setForm(emptyBusiness);
    setNotice(`${business.name} foi criado com um perfil de responsável.`);
  };

  return (
    <DashboardShell>
      <div className="dashboard-content">
        <div className="dashboard-heading"><div><span className="eyebrow">Controle da plataforma</span><h1>{isCompanies ? "Estabelecimentos" : "Visão geral"}</h1><p>Administre operações, responsáveis e crescimento em um só lugar.</p></div><a className="button button--primary" href="#nova-empresa">+ Novo estabelecimento</a></div>
        <div className="metric-grid">
          <Metric label="Empresas ativas" value={data.businesses.filter((item) => item.status === "active").length} detail="operações publicadas" />
          <Metric label="Agendamentos" value={data.appointments.length} detail="na plataforma" tone="blue" />
          <Metric label="Profissionais" value={data.professionals.length} detail="perfis cadastrados" tone="green" />
          <Metric label="Receita potencial" value={formatCurrency(data.appointments.reduce((total, appointment) => total + (data.services.find((service) => service.id === appointment.serviceId)?.price || 0), 0))} detail="em serviços reservados" tone="amber" />
        </div>
        <section className="panel">
          <div className="panel__header"><div><h2>Operações cadastradas</h2><p>Cada empresa possui uma página de reservas e gestão independentes.</p></div><span className="tag tag--neutral">{data.businesses.length} no total</span></div>
          <div className="tenant-table">
            {data.businesses.map((business) => {
              const owner = data.users.find((user) => user.id === business.ownerId);
              return <div className="tenant-row" key={business.id}><span className="business-mini-mark" style={{ background: business.accent }}>{business.name.charAt(0)}</span><div><strong>{business.name}</strong><small>{CATEGORY_LABELS[business.category]} · /{business.slug}</small></div><div><span>Responsável</span><strong>{owner?.name || "Não definido"}</strong></div><div><span>Status</span><Status value={business.status === "active" ? "confirmed" : "pending"} /></div><Link to={`/agendar/${business.slug}`}>Abrir agenda →</Link></div>;
            })}
          </div>
        </section>
        <section className="panel form-panel" id="nova-empresa">
          <div className="panel__header"><div><span className="eyebrow">Onboarding</span><h2>Cadastrar novo estabelecimento</h2><p>Somente o administrador da plataforma cria uma empresa e o primeiro acesso do responsável.</p></div></div>
          {notice && <p className="form-success" role="status">✓ {notice}</p>}
          <form className="admin-form" onSubmit={handleCreate}>
            <div className="field-grid field-grid--three">
              <label className="field"><span>Nome da empresa</span><input onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label>
              <label className="field"><span>Segmento</span><select onChange={(event) => setForm({ ...form, category: event.target.value })} value={form.category}><option value="barbershop">Barbearia</option><option value="salon">Salão de beleza</option><option value="clinic">Clínica</option></select></label>
              <label className="field field--color"><span>Cor principal</span><input onChange={(event) => setForm({ ...form, accent: event.target.value })} type="color" value={form.accent} /><b>{form.accent}</b></label>
            </div>
            <div className="field-grid">
              <label className="field"><span>Nome do responsável</span><input onChange={(event) => setForm({ ...form, ownerName: event.target.value })} required value={form.ownerName} /></label>
              <label className="field"><span>E-mail do responsável</span><input onChange={(event) => setForm({ ...form, ownerEmail: event.target.value })} required type="email" value={form.ownerEmail} /></label>
            </div>
            <div className="field-grid">
              <label className="field"><span>WhatsApp da empresa</span><input onChange={(event) => setForm({ ...form, whatsapp: maskPhone(event.target.value) })} required value={form.whatsapp} /></label>
              <label className="field"><span>Endereço</span><input onChange={(event) => setForm({ ...form, address: event.target.value })} required value={form.address} /></label>
            </div>
            <label className="field"><span>Descrição da marca</span><textarea onChange={(event) => setForm({ ...form, description: event.target.value })} required value={form.description} /></label>
            <button className="button button--primary" type="submit">Criar empresa e responsável</button>
          </form>
        </section>
      </div>
    </DashboardShell>
  );
}

function OwnerDashboard() {
  const { data, session, addService, updateBusiness } = usePlatform();
  const location = useLocation();
  const business = data.businesses.find((item) => item.id === session.businessId);
  const services = data.services.filter((item) => item.businessId === business.id);
  const appointments = data.appointments.filter((item) => item.businessId === business.id);
  const professionals = data.professionals.filter((item) => item.businessId === business.id);
  const [serviceForm, setServiceForm] = useState({ name: "", description: "", duration: 45, price: "" });
  const [brandForm, setBrandForm] = useState({ description: business.description, accent: business.accent, openingTime: business.openingTime, closingTime: business.closingTime });
  const [notice, setNotice] = useState("");

  const addNewService = (event) => {
    event.preventDefault();
    addService(business.id, serviceForm);
    setServiceForm({ name: "", description: "", duration: 45, price: "" });
    setNotice("Serviço adicionado à página de agendamento.");
  };

  const saveBrand = (event) => {
    event.preventDefault();
    updateBusiness(business.id, brandForm);
    setNotice("Personalização atualizada com sucesso.");
  };

  const path = location.pathname;
  const showServices = path.endsWith("/servicos");
  const showBrand = path.endsWith("/personalizacao");
  const showAgenda = path.endsWith("/agenda");

  return (
    <DashboardShell>
      <div className="dashboard-content" style={{ "--tenant-accent": business.accent }}>
        <div className="dashboard-heading"><div><span className="eyebrow">{CATEGORY_LABELS[business.category]}</span><h1>{showServices ? "Serviços e valores" : showBrand ? "Personalização" : showAgenda ? "Agenda da equipe" : business.name}</h1><p>Gerencie sua operação e a experiência entregue aos clientes.</p></div><Link className="button button--tenant" to={`/agendar/${business.slug}`}>Ver página de reservas</Link></div>
        {!showServices && !showBrand && (
          <>
            <div className="metric-grid"><Metric label="Agendamentos" value={appointments.length} detail="reservas registradas" /><Metric label="Serviços ativos" value={services.filter((item) => item.active).length} detail="opções publicadas" tone="blue" /><Metric label="Equipe" value={professionals.length} detail="profissionais ativos" tone="green" /><Metric label="Ticket médio" value={formatCurrency(services.reduce((total, service) => total + service.price, 0) / Math.max(services.length, 1))} detail="por serviço" tone="amber" /></div>
            <AppointmentPanel appointments={appointments} data={data} />
          </>
        )}
        {showServices && <section className="two-column"><div className="panel"><div className="panel__header"><div><h2>Catálogo publicado</h2><p>O cliente escolhe uma ou mais opções na próxima evolução.</p></div></div><div className="service-list">{services.map((service) => <article key={service.id}><span className="service-option__icon">✦</span><div><strong>{service.name}</strong><small>{service.description}</small><em>{service.duration} minutos</em></div><b>{formatCurrency(service.price)}</b></article>)}</div></div><form className="panel compact-form" onSubmit={addNewService}><span className="eyebrow">Novo serviço</span><h2>Adicionar ao catálogo</h2>{notice && <p className="form-success">✓ {notice}</p>}<label className="field"><span>Nome</span><input onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} required value={serviceForm.name} /></label><label className="field"><span>Descrição</span><textarea onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })} required value={serviceForm.description} /></label><div className="field-grid"><label className="field"><span>Duração (min)</span><input min="15" onChange={(event) => setServiceForm({ ...serviceForm, duration: event.target.value })} step="15" type="number" value={serviceForm.duration} /></label><label className="field"><span>Valor</span><input min="0" onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} step="0.01" type="number" value={serviceForm.price} /></label></div><button className="button button--tenant button--full" type="submit">Publicar serviço</button></form></section>}
        {showBrand && <section className="two-column"><form className="panel compact-form" onSubmit={saveBrand}><span className="eyebrow">Identidade da marca</span><h2>Personalize sua agenda</h2>{notice && <p className="form-success">✓ {notice}</p>}<label className="field"><span>Texto de apresentação</span><textarea onChange={(event) => setBrandForm({ ...brandForm, description: event.target.value })} value={brandForm.description} /></label><label className="field field--color"><span>Cor principal</span><input onChange={(event) => setBrandForm({ ...brandForm, accent: event.target.value })} type="color" value={brandForm.accent} /><b>{brandForm.accent}</b></label><div className="field-grid"><label className="field"><span>Abertura</span><input onChange={(event) => setBrandForm({ ...brandForm, openingTime: event.target.value })} type="time" value={brandForm.openingTime} /></label><label className="field"><span>Encerramento</span><input onChange={(event) => setBrandForm({ ...brandForm, closingTime: event.target.value })} type="time" value={brandForm.closingTime} /></label></div><button className="button button--tenant" type="submit">Salvar personalização</button></form><div className="brand-preview" style={{ "--tenant-accent": brandForm.accent }}><span className="eyebrow">Prévia do cliente</span><span className="tenant-brand__mark">{business.name.charAt(0)}</span><h2>{business.name}</h2><p>{brandForm.description}</p><span className="button button--tenant">Agendar atendimento</span></div></section>}
      </div>
    </DashboardShell>
  );
}

function AppointmentPanel({ appointments, data, customerView = false }) {
  return <section className="panel"><div className="panel__header"><div><h2>{customerView ? "Seus agendamentos" : "Próximos atendimentos"}</h2><p>{customerView ? "Acompanhe todas as suas reservas em um só lugar." : "Agenda atualizada por toda a equipe."}</p></div></div><div className="appointment-table"><div className="appointment-row appointment-row--header"><span>Cliente</span><span>Serviço</span><span>Data</span><span>Status</span></div>{appointments.length ? appointments.map((appointment) => { const service = data.services.find((item) => item.id === appointment.serviceId); const business = data.businesses.find((item) => item.id === appointment.businessId); return <div className="appointment-row" key={appointment.id}><span><strong>{customerView ? business?.name : appointment.customerName}</strong><small>{customerView ? business?.address : appointment.customerPhone}</small></span><span><strong>{service?.name}</strong><small>{formatCurrency(service?.price || 0)}</small></span><span><strong>{formatDate(appointment.date)}</strong><small>{appointment.time}</small></span><Status value={appointment.status} /></div>; }) : <div className="empty-state"><span>◇</span><strong>Nenhum agendamento encontrado</strong><p>As novas reservas aparecerão aqui automaticamente.</p></div>}</div></section>;
}

function CustomerDashboard() {
  const { data, session } = usePlatform();
  const appointments = useMemo(() => data.appointments.filter((item) => item.customerId === session.id || item.customerPhone === session.phone), [data.appointments, session]);
  return <DashboardShell><div className="dashboard-content"><div className="dashboard-heading"><div><span className="eyebrow">Olá, {session.name.split(" ")[0]}</span><h1>Meus agendamentos</h1><p>Organize seus cuidados sem perder nenhum horário.</p></div><Link className="button button--primary" to="/agendar/oliveer-barbearia">+ Novo agendamento</Link></div><div className="metric-grid"><Metric label="Reservas no mês" value={appointments.length} detail="agendamentos registrados" /><Metric label="Confirmados" value={appointments.filter((item) => item.status === "confirmed").length} detail="horários garantidos" tone="green" /></div><AppointmentPanel appointments={appointments} customerView data={data} /></div></DashboardShell>;
}

export default function DashboardPage() {
  const { session } = usePlatform();
  if (session.role === "platform_admin") return <AdminDashboard />;
  if (session.role === "business_owner") return <OwnerDashboard />;
  return <CustomerDashboard />;
}
