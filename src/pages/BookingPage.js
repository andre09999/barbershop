import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Brand } from "../components/AppShell";
import { usePlatform } from "../context/PlatformContext";
import { buildWhatsAppFallback } from "../lib/api";
import {
  buildTimeSlots,
  formatCurrency,
  formatDate,
  maskPhone,
  normalizePhone,
} from "../lib/platformStore";

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
  const { data, session, createAppointment } = usePlatform();
  const business = data.businesses.find((item) => item.slug === slug && item.status === "active");
  const [form, setForm] = useState({
    ...initialForm,
    customerName: session?.role === "customer" ? session.name : "",
    customerPhone: session?.role === "customer" ? maskPhone(session.phone || "") : "",
  });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const services = useMemo(
    () => data.services.filter((item) => item.businessId === business?.id && item.active),
    [data.services, business]
  );
  const professionals = useMemo(
    () => data.professionals.filter((item) => item.businessId === business?.id && item.active),
    [data.professionals, business]
  );
  const selectedService = services.find((item) => item.id === form.serviceId);
  const selectedProfessional = professionals.find((item) => item.id === form.professionalId);
  const minDate = new Date().toISOString().split("T")[0];
  const slots = business ? buildTimeSlots(business.openingTime, business.closingTime, 30) : [];
  const unavailableSlots = data.appointments
    .filter(
      (item) =>
        item.businessId === business?.id &&
        item.professionalId === form.professionalId &&
        item.date === form.date &&
        item.status !== "cancelled"
    )
    .map((item) => item.time);

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
      const response = await createAppointment(business, form);
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
    const whatsappUrl = buildWhatsAppFallback(
      appointment.customerPhone,
      appointment,
      business,
      selectedService
    );

    return (
      <main className="booking-success" style={{ "--tenant-accent": business.accent }}>
        <div className="success-card">
          <span className="success-icon" aria-hidden="true">✓</span>
          <span className="eyebrow">Agendamento confirmado</span>
          <h1>Seu horário está reservado.</h1>
          <p>Enviamos os detalhes para o WhatsApp informado quando a integração oficial está ativa.</p>
          <div className="success-summary">
            <div><span>Estabelecimento</span><strong>{business.name}</strong></div>
            <div><span>Serviço</span><strong>{selectedService.name}</strong></div>
            <div><span>Profissional</span><strong>{selectedProfessional.name}</strong></div>
            <div><span>Quando</span><strong>{formatDate(appointment.date)} · {appointment.time}</strong></div>
          </div>
          {result.whatsapp?.status === "fallback" && (
            <a className="button button--whatsapp button--full" href={whatsappUrl} rel="noreferrer" target="_blank">
              Receber confirmação no WhatsApp
            </a>
          )}
          <div className="success-actions">
            <Link to="/painel">Ver meus agendamentos</Link>
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
        <div className="tenant-brand">
          <span className="tenant-brand__mark">{business.name.charAt(0)}</span>
          <span className="eyebrow">Agendamento online</span>
          <h1>{business.name}</h1>
          <p>{business.description}</p>
        </div>
        <div className="tenant-info">
          <span>⌖ {business.address}</span>
          <span>◷ {business.openingTime} às {business.closingTime}</span>
        </div>
      </aside>
      <main className="booking-main">
        <div className="booking-main__header">
          <div><span className="eyebrow">Reserva rápida</span><h2>Escolha seu atendimento</h2></div>
          <Link to="/">Fechar</Link>
        </div>
        <ol className="stepper" aria-label="Etapas do agendamento">
          {["Serviço", "Profissional", "Horário", "Seus dados"].map((label, index) => (
            <li className={step >= index + 1 ? "is-active" : ""} key={label}>
              <span>{step > index + 1 ? "✓" : index + 1}</span>{label}
            </li>
          ))}
        </ol>

        <form className="booking-form" onSubmit={handleSubmit}>
          {step === 1 && (
            <section>
              <div className="form-section-heading"><h3>Qual serviço você deseja?</h3><p>Valores e duração definidos pelo estabelecimento.</p></div>
              <div className="service-options">
                {services.map((service) => (
                  <button className={form.serviceId === service.id ? "service-option is-selected" : "service-option"} key={service.id} onClick={() => update("serviceId", service.id)} type="button">
                    <span className="service-option__icon" aria-hidden="true">✦</span>
                    <span><strong>{service.name}</strong><small>{service.description}</small><em>{service.duration} min</em></span>
                    <b>{formatCurrency(service.price)}</b>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <div className="form-section-heading"><h3>Com quem você prefere?</h3><p>Todos os profissionais abaixo estão disponíveis para este serviço.</p></div>
              <div className="professional-options">
                {professionals.map((professional) => (
                  <button className={form.professionalId === professional.id ? "professional-option is-selected" : "professional-option"} key={professional.id} onClick={() => update("professionalId", professional.id)} type="button">
                    <span className="avatar avatar--large">{professional.name.charAt(0)}</span>
                    <span><strong>{professional.name}</strong><small>{professional.specialty}</small></span>
                    <span className="radio-mark" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <div className="form-section-heading"><h3>Quando você pode vir?</h3><p>Os horários ocupados são bloqueados automaticamente.</p></div>
              <label className="field"><span>Data do atendimento</span><input min={minDate} onChange={(event) => { update("date", event.target.value); update("time", ""); }} required type="date" value={form.date} /></label>
              {form.date && (
                <div className="time-grid" aria-label="Horários disponíveis">
                  {slots.map((slot) => (
                    <button className={form.time === slot ? "is-selected" : ""} disabled={unavailableSlots.includes(slot)} key={slot} onClick={() => update("time", slot)} type="button">{slot}</button>
                  ))}
                </div>
              )}
            </section>
          )}

          {step === 4 && (
            <section>
              <div className="form-section-heading"><h3>Quase pronto.</h3><p>Use um número com WhatsApp para receber a confirmação.</p></div>
              <div className="field-grid">
                <label className="field"><span>Nome completo</span><input autoComplete="name" onChange={(event) => update("customerName", event.target.value)} placeholder="Como devemos chamar você?" required value={form.customerName} /></label>
                <label className="field"><span>WhatsApp</span><input autoComplete="tel" inputMode="tel" onChange={(event) => update("customerPhone", maskPhone(event.target.value))} placeholder="(62) 99999-9999" required value={form.customerPhone} /></label>
              </div>
              <label className="field"><span>Observação (opcional)</span><textarea maxLength="280" onChange={(event) => update("notes", event.target.value)} placeholder="Alguma preferência ou informação importante?" value={form.notes} /></label>
              <div className="booking-review">
                <span className="booking-review__mark">{business.name.charAt(0)}</span>
                <div><strong>{selectedService.name}</strong><small>{selectedProfessional.name} · {formatDate(form.date)} às {form.time}</small></div>
                <b>{formatCurrency(selectedService.price)}</b>
              </div>
            </section>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="booking-form__actions">
            {step > 1 ? <button className="button button--secondary" onClick={() => { setError(""); setStep((current) => current - 1); }} type="button">Voltar</button> : <span />}
            {step < 4 ? <button className="button button--tenant" onClick={nextStep} type="button">Continuar</button> : <button className="button button--tenant" disabled={submitting} type="submit">{submitting ? "Confirmando..." : "Confirmar agendamento"}</button>}
          </div>
        </form>
      </main>
    </div>
  );
}
