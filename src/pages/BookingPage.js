import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Brand } from "../components/AppShell";
import { usePlatform } from "../context/PlatformContext";
import { api, buildWhatsAppFallback } from "../lib/api";
import { buildTimeSlots, formatCurrency, formatDate, maskPhone, normalizePhone } from "../lib/platformStore";

const initialForm = {
  serviceId: "",
  professionalId: "",
  date: "",
  time: "",
  customerName: "",
  customerPhone: "",
  notes: "",
};

export default function BookingPage() {
  const { slug } = useParams();
  const { session } = usePlatform();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.publicBusiness(slug)
      .then(({ business: value }) => active && setBusiness(value))
      .catch(() => active && setBusiness(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (session?.role !== "CUSTOMER") return;
    setForm((current) => ({
      ...current,
      customerName: current.customerName || session.name,
      customerPhone: current.customerPhone || maskPhone(session.phone || ""),
    }));
  }, [session]);

  useEffect(() => {
    if (!business || !form.professionalId || !form.date) {
      setUnavailableSlots([]);
      return undefined;
    }
    let active = true;
    api.availability(business.slug, form.professionalId, form.date)
      .then(({ unavailableTimes }) => active && setUnavailableSlots(unavailableTimes))
      .catch(() => active && setUnavailableSlots([]));
    return () => { active = false; };
  }, [business, form.professionalId, form.date]);

  const services = useMemo(() => business?.services || [], [business]);
  const professionals = useMemo(() => business?.professionals || [], [business]);
  const selectedService = services.find((item) => item.id === form.serviceId);
  const selectedProfessional = professionals.find((item) => item.id === form.professionalId);
  const now = new Date();
  const minDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const slots = business ? buildTimeSlots(business.openingTime, business.closingTime, 30) : [];

  if (loading) return <main className="page-loading" role="status">Carregando agenda…</main>;
  if (!business) {
    return (
      <main className="not-found">
        <Brand />
        <span className="not-found__code">404</span>
        <h1>Agenda não encontrada</h1>
        <p>Confira o endereço ou escolha um estabelecimento disponível.</p>
        <Link className="button button--primary" to="/">Voltar para a plataforma</Link>
      </main>
    );
  }

  const update = (field, value) => {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const nextStep = () => {
    if (step === 1 && !form.serviceId) return setError("Escolha um serviço para continuar.");
    if (step === 2 && !form.professionalId) return setError("Escolha um profissional para continuar.");
    if (step === 3 && (!form.date || !form.time)) return setError("Escolha uma data e um horário disponíveis.");
    setError("");
    setStep((current) => Math.min(current + 1, 4));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.customerName.trim().length < 3 || normalizePhone(form.customerPhone).length < 10) {
      setError("Informe seu nome completo e um WhatsApp válido.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.createAppointment(business.slug, form);
      setResult(response);
      setError("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const appointment = result.appointment;
    const whatsappUrl = buildWhatsAppFallback(business.whatsapp, appointment, business, selectedService);
    const needsManualConfirmation = ["not_configured", "failed"].includes(result.whatsapp?.status);
    return (
      <main className="booking-success" style={{ "--tenant-accent": business.accent }}>
        <div className="success-card">
          <span className="success-icon" aria-hidden="true">✓</span>
          <span className="eyebrow">Agendamento confirmado</span>
          <h1>Seu horário está reservado.</h1>
          <p>{result.whatsapp?.status === "sent" ? "A confirmação foi enviada para o WhatsApp informado." : "A reserva está salva. Se quiser, confirme também pelo WhatsApp do estabelecimento."}</p>
          <div className="success-summary">
            <div><span>Estabelecimento</span><strong>{business.name}</strong></div>
            <div><span>Serviço</span><strong>{selectedService.name}</strong></div>
            <div><span>Profissional</span><strong>{selectedProfessional.name}</strong></div>
            <div><span>Quando</span><strong>{formatDate(appointment.date)} · {appointment.time}</strong></div>
          </div>
          {needsManualConfirmation && <a className="button button--whatsapp button--full" href={whatsappUrl} rel="noreferrer" target="_blank">Falar com o estabelecimento</a>}
          <div className="success-actions">
            <Link to={session ? "/painel" : "/entrar"}>{session ? "Ver meus agendamentos" : "Criar conta de cliente"}</Link>
            <button onClick={() => { setForm(initialForm); setResult(null); setStep(1); }} type="button">Agendar outro horário</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="booking-page" style={{ "--tenant-accent": business.accent }}>
      <aside className="booking-brand-panel">
        <Brand compact />
        <div className="tenant-brand"><span className="tenant-brand__mark">{business.name.charAt(0)}</span><span className="eyebrow">Agendamento online</span><h1>{business.name}</h1><p>{business.description}</p></div>
        <div className="tenant-info"><span>⌖ {business.address}</span><span>◷ {business.openingTime} às {business.closingTime}</span></div>
      </aside>
      <main className="booking-main">
        <div className="booking-main__header"><div><span className="eyebrow">Reserva rápida</span><h2>Escolha seu atendimento</h2></div><Link to="/">Fechar</Link></div>
        <ol className="stepper" aria-label="Etapas do agendamento">
          {["Serviço", "Profissional", "Horário", "Seus dados"].map((label, index) => <li className={step >= index + 1 ? "is-active" : ""} key={label}><span>{step > index + 1 ? "✓" : index + 1}</span>{label}</li>)}
        </ol>
        <form className="booking-form" onSubmit={handleSubmit}>
          {step === 1 && <section><div className="form-section-heading"><h3>Qual serviço você deseja?</h3><p>Valores e duração definidos pelo estabelecimento.</p></div><div className="service-options">{services.map((service) => <button className={form.serviceId === service.id ? "service-option is-selected" : "service-option"} key={service.id} onClick={() => update("serviceId", service.id)} type="button"><span className="service-option__icon" aria-hidden="true">✦</span><span><strong>{service.name}</strong><small>{service.description}</small><em>{service.duration} min</em></span><b>{formatCurrency(service.priceInCents / 100)}</b></button>)}</div>{!services.length && <p className="empty-inline">Este estabelecimento ainda não publicou serviços.</p>}</section>}
          {step === 2 && <section><div className="form-section-heading"><h3>Com quem você prefere?</h3><p>Escolha um profissional ativo.</p></div><div className="professional-options">{professionals.map((professional) => <button className={form.professionalId === professional.id ? "professional-option is-selected" : "professional-option"} key={professional.id} onClick={() => update("professionalId", professional.id)} type="button"><span className="avatar avatar--large">{professional.name.charAt(0)}</span><span><strong>{professional.name}</strong><small>{professional.specialty}</small></span><span className="radio-mark" /></button>)}</div></section>}
          {step === 3 && <section><div className="form-section-heading"><h3>Quando você pode vir?</h3><p>Os horários ocupados são bloqueados automaticamente.</p></div><label className="field"><span>Data do atendimento</span><input min={minDate} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value, time: "" }))} required type="date" value={form.date} /></label>{form.date && <div className="time-grid" aria-label="Horários disponíveis">{slots.map((slot) => <button className={form.time === slot ? "is-selected" : ""} disabled={unavailableSlots.includes(slot)} key={slot} onClick={() => update("time", slot)} type="button">{slot}</button>)}</div>}</section>}
          {step === 4 && <section><div className="form-section-heading"><h3>Quase pronto.</h3><p>Use um número com WhatsApp para receber a confirmação.</p></div><div className="field-grid"><label className="field"><span>Nome completo</span><input autoComplete="name" onChange={(event) => update("customerName", event.target.value)} required value={form.customerName} /></label><label className="field"><span>WhatsApp</span><input autoComplete="tel" inputMode="tel" onChange={(event) => update("customerPhone", maskPhone(event.target.value))} required value={form.customerPhone} /></label></div><label className="field"><span>Observação (opcional)</span><textarea maxLength="280" onChange={(event) => update("notes", event.target.value)} value={form.notes} /></label><div className="booking-review"><span className="booking-review__mark">{business.name.charAt(0)}</span><div><strong>{selectedService.name}</strong><small>{selectedProfessional.name} · {formatDate(form.date)} às {form.time}</small></div><b>{formatCurrency(selectedService.priceInCents / 100)}</b></div></section>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="booking-form__actions">{step > 1 ? <button className="button button--secondary" onClick={() => { setError(""); setStep((current) => current - 1); }} type="button">Voltar</button> : <span />}{step < 4 ? <button className="button button--tenant" onClick={nextStep} type="button">Continuar</button> : <button className="button button--tenant" disabled={submitting} type="submit">{submitting ? "Confirmando…" : "Confirmar agendamento"}</button>}</div>
        </form>
      </main>
    </div>
  );
}
