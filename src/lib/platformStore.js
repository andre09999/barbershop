import { seedState } from "../data/seed";

const DATA_KEY = "agenda-pro:data:v1";
const SESSION_KEY = "agenda-pro:session:v1";

const clone = (value) => JSON.parse(JSON.stringify(value));

export const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function loadData() {
  try {
    const stored = window.localStorage.getItem(DATA_KEY);
    return stored ? JSON.parse(stored) : clone(seedState);
  } catch {
    return clone(seedState);
  }
}

export function saveData(data) {
  window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadSession() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function resetDemoData() {
  const nextData = clone(seedState);
  saveData(nextData);
  return nextData;
}

export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function normalizePhone(value) {
  return value.replace(/\D/g, "").slice(0, 13);
}

export function maskPhone(value) {
  const digits = normalizePhone(value).replace(/^55/, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function buildTimeSlots(start = "09:00", end = "19:00", interval = 30) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const slots = [];
  let current = startHour * 60 + startMinute;
  const limit = endHour * 60 + endMinute;

  while (current < limit) {
    const hour = String(Math.floor(current / 60)).padStart(2, "0");
    const minute = String(current % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
    current += interval;
  }

  return slots;
}
