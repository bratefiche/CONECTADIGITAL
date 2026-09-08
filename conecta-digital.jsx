import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Briefcase,
  Plus,
  Star,
  Check,
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Clock,
  Banknote,
  Menu,
  ArrowRight,
  Inbox,
  Search,
  Pencil,
  MapPin,
  Award,
  Camera,
  GraduationCap,
  Trash2,
} from "lucide-react";

/* -------------------------------------------------------------------------
   CONECTA DIGITAL — protótipo funcional de MVP
   Marketplace local conectando freelancers e pequenos negócios (Sorocaba/SP)
   Estado mantido em memória (useState) — sem localStorage.
   Todas as regras de negócio do MVP são reais: nada aqui é decorativo.
------------------------------------------------------------------------- */

const CATEGORIAS = [
  "Design",
  "Marketing Digital",
  "Desenvolvimento",
  "Fotografia",
  "Vídeo",
  "Contabilidade",
  "Administrativo",
  "Consultoria",
  "Eventos",
  "Redação",
  "Tecnologia",
];

const STATUS = {
  ABERTA: "ABERTA",
  EM_ANALISE: "EM_ANALISE",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  CONCLUIDA: "CONCLUIDA",
};

const STATUS_LABEL = {
  ABERTA: "Aberta",
  EM_ANALISE: "Em análise",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

let idCounter = 1000;
const uid = (prefix) => `${prefix}_${idCounter++}`;

const now = () => Date.now();
const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const fmtPrazo = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};

// Selo do freelancer: conta demandas concluídas cuja proposta aceita foi dele
function trabalhosConcluidos(freelancerId, demandas, propostas) {
  return demandas.filter((d) => {
    if (d.status !== STATUS.CONCLUIDA || !d.propostaAceitaId) return false;
    const p = propostas.find((pr) => pr.id === d.propostaAceitaId);
    return p && p.freelancerId === freelancerId;
  }).length;
}

function tierSelo(count) {
  if (count >= 10) return { label: "Selo ouro", desc: "10+ trabalhos concluídos" };
  if (count >= 5) return { label: "Selo prata", desc: "5+ trabalhos concluídos" };
  if (count >= 1) return { label: "Selo bronze", desc: "1º trabalho concluído" };
  return null;
}

/* -------------------------------------------------------------------------
   Dados iniciais (seed) — simula um marketplace já com alguma atividade,
   para que o fluxo possa ser testado dos dois lados desde o primeiro acesso.
------------------------------------------------------------------------- */

const seedUsers = [
  {
    id: "u_negocio_1",
    tipo: "negocio",
    nome: "Padaria Trigo Nosso",
    email: "contato@trigonosso.com.br",
    senha: "123456",
    setor: "Alimentação",
    descricaoNegocio:
      "Padaria de bairro em Sorocaba, aberta há 12 anos, buscando modernizar o atendimento e a presença digital.",
    localizacao: "Centro, Sorocaba - SP",
    fotoUrl: "",
    criadoEm: now() - 1000 * 60 * 60 * 24 * 40,
  },
  {
    id: "u_negocio_2",
    tipo: "negocio",
    nome: "Studio Vitta Pilates",
    email: "contato@vittapilates.com.br",
    senha: "123456",
    setor: "Saúde e Bem-estar",
    descricaoNegocio: "Estúdio de pilates com duas unidades em Sorocaba, foco em atendimento personalizado.",
    localizacao: "Campolim, Sorocaba - SP",
    fotoUrl: "",
    criadoEm: now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: "u_free_1",
    tipo: "freelancer",
    nome: "Marina Lopes",
    email: "marina.lopes@email.com",
    senha: "123456",
    especialidade: "Design",
    descricaoFreelancer: "Designer gráfica especializada em identidade visual para pequenos negócios locais.",
    faixaPreco: "R$ 400 – R$ 1.500",
    localizacao: "Centro, Sorocaba - SP",
    fotoUrl: "",
    formacao: [{ id: "f_1", titulo: "Design Gráfico", instituicao: "Centro Universitário Facens", ano: "2023" }],
    criadoEm: now() - 1000 * 60 * 60 * 24 * 60,
  },
  {
    id: "u_free_2",
    tipo: "freelancer",
    nome: "Rafael Nogueira",
    email: "rafael.nog@email.com",
    senha: "123456",
    especialidade: "Desenvolvimento",
    descricaoFreelancer: "Desenvolvedor front-end, foco em sites institucionais e landing pages rápidas.",
    faixaPreco: "R$ 800 – R$ 3.000",
    localizacao: "Campolim, Sorocaba - SP",
    fotoUrl: "",
    formacao: [
      { id: "f_2", titulo: "Análise e Desenvolvimento de Sistemas", instituicao: "Centro Universitário Facens", ano: "2024" },
    ],
    criadoEm: now() - 1000 * 60 * 60 * 24 * 55,
  },
  {
    id: "u_free_3",
    tipo: "freelancer",
    nome: "Camila Duarte",
    email: "camila.duarte@email.com",
    senha: "123456",
    especialidade: "Marketing Digital",
    descricaoFreelancer: "Gestão de redes sociais e tráfego pago para negócios locais em Sorocaba e região.",
    faixaPreco: "R$ 500 – R$ 2.000",
    localizacao: "Éden, Sorocaba - SP",
    fotoUrl: "",
    formacao: [{ id: "f_3", titulo: "Marketing Digital", instituicao: "Centro Universitário Facens", ano: "2022" }],
    criadoEm: now() - 1000 * 60 * 60 * 24 * 20,
  },
];

const seedDemandas = [
  {
    id: "d_1",
    negocioId: "u_negocio_1",
    titulo: "Cardápio digital com QR Code",
    descricao:
      "Precisamos de um cardápio digital acessível por QR code nas mesas, com fotos dos produtos e atualização fácil.",
    categoria: "Desenvolvimento",
    prazo: "2026-10-15",
    status: STATUS.ABERTA,
    criadoEm: now() - 1000 * 60 * 60 * 24 * 3,
    aceitaEm: null,
    concluidaEm: null,
    propostaAceitaId: null,
  },
  {
    id: "d_2",
    negocioId: "u_negocio_2",
    titulo: "Identidade visual para nova unidade",
    descricao:
      "Vamos abrir uma segunda unidade e precisamos adaptar a identidade visual atual: logo, paleta e materiais de recepção.",
    categoria: "Design",
    prazo: "2026-09-30",
    status: STATUS.EM_ANDAMENTO,
    criadoEm: now() - 1000 * 60 * 60 * 24 * 10,
    aceitaEm: now() - 1000 * 60 * 60 * 24 * 6,
    concluidaEm: null,
    propostaAceitaId: "p_2",
  },
  {
    id: "d_3",
    negocioId: "u_negocio_1",
    titulo: "Gestão de Instagram por 1 mês",
    descricao:
      "Buscamos alguém para cuidar do Instagram da padaria por um mês: 3 posts semanais e stories dos bastidores.",
    categoria: "Marketing Digital",
    prazo: "2026-08-20",
    status: STATUS.CONCLUIDA,
    criadoEm: now() - 1000 * 60 * 60 * 24 * 45,
    aceitaEm: now() - 1000 * 60 * 60 * 24 * 40,
    concluidaEm: now() - 1000 * 60 * 60 * 24 * 8,
    propostaAceitaId: "p_3",
  },
];

const seedPropostas = [
  {
    id: "p_1",
    demandaId: "d_1",
    freelancerId: "u_free_2",
    valor: 950,
    prazo: "2026-10-10",
    mensagem: "Posso entregar em WordPress com um painel simples para vocês editarem o cardápio sozinhos.",
    status: "pendente",
    criadoEm: now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "p_2",
    demandaId: "d_2",
    freelancerId: "u_free_1",
    valor: 1200,
    prazo: "2026-09-25",
    mensagem: "Trabalho com identidade visual para negócios locais há 4 anos. Posso enviar um moodboard inicial em 3 dias.",
    status: "aceita",
    criadoEm: now() - 1000 * 60 * 60 * 24 * 9,
  },
  {
    id: "p_3",
    demandaId: "d_3",
    freelancerId: "u_free_3",
    valor: 700,
    prazo: "2026-08-15",
    mensagem: "Posso montar um calendário de conteúdo focado no público de bairro, com foco em stories de bastidores.",
    status: "aceita",
    criadoEm: now() - 1000 * 60 * 60 * 24 * 42,
  },
];

// Trabalhos anteriores concluídos, só para o protótipo já demonstrar os níveis de selo
for (let i = 0; i < 4; i++) {
  const dId = uid("d");
  const pId = uid("p");
  seedDemandas.push({
    id: dId,
    negocioId: i % 2 === 0 ? "u_negocio_1" : "u_negocio_2",
    titulo: `Projeto de identidade visual ${i + 2}`,
    descricao: "Projeto anterior concluído com sucesso pela freelancer.",
    categoria: "Design",
    prazo: "2026-07-01",
    status: STATUS.CONCLUIDA,
    criadoEm: now() - 1000 * 60 * 60 * 24 * (95 - i * 5),
    aceitaEm: now() - 1000 * 60 * 60 * 24 * (90 - i * 5),
    concluidaEm: now() - 1000 * 60 * 60 * 24 * (70 - i * 5),
    propostaAceitaId: pId,
  });
  seedPropostas.push({
    id: pId,
    demandaId: dId,
    freelancerId: "u_free_1",
    valor: 900 + i * 50,
    prazo: "2026-06-25",
    mensagem: "Proposta enviada e aceita em projeto anterior.",
    status: "aceita",
    criadoEm: now() - 1000 * 60 * 60 * 24 * (91 - i * 5),
  });
}

const seedAvaliacoes = [
  {
    id: "a_1",
    demandaId: "d_3",
    deId: "u_negocio_1",
    paraId: "u_free_3",
    nota: 5,
    comentario: "Camila entregou tudo no prazo e entendeu muito bem o tom da nossa padaria. Recontrataria sem pensar.",
    criadoEm: now() - 1000 * 60 * 60 * 24 * 8,
  },
  {
    id: "a_2",
    demandaId: "d_3",
    deId: "u_free_3",
    paraId: "u_negocio_1",
    nota: 5,
    comentario: "Comunicação muito boa e feedback rápido durante todo o mês.",
    criadoEm: now() - 1000 * 60 * 60 * 24 * 7,
  },
];

/* -------------------------------------------------------------------------
   Estilos globais — tokens de design
------------------------------------------------------------------------- */

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');

    .cd-root {
      --bg: #FAFAF8;
      --surface: #FFFFFF;
      --surface-hover: #F3F2EE;
      --border: #E6E4DD;
      --ink: #1A1D22;
      --ink-muted: #6B7280;
      --ink-faint: #9CA3AF;
      --accent: #3D6B5C;
      --accent-hover: #2F5747;
      --accent-soft: #E8EFEC;
      --amber: #A8752F;
      --amber-soft: #F6EEDF;
      --red: #B14B3C;
      --red-soft: #F5E9E6;
      --radius: 10px;
      --radius-sm: 7px;
      --radius-pill: 999px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--ink);
      background: var(--bg);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .cd-root * { box-sizing: border-box; }
    .cd-serif { font-family: 'Fraunces', serif; }

    .cd-root button { font-family: inherit; cursor: pointer; }
    .cd-root input, .cd-root select, .cd-root textarea {
      font-family: inherit;
      font-size: 14.5px;
      color: var(--ink);
    }
    .cd-root ::placeholder { color: var(--ink-faint); }
    .cd-root a { color: inherit; }

    .cd-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .cd-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .cd-btn-primary { background: var(--accent); color: #fff; }
    .cd-btn-primary:not(:disabled):hover { background: var(--accent-hover); }
    .cd-btn-secondary { background: var(--surface); color: var(--ink); border-color: var(--border); }
    .cd-btn-secondary:not(:disabled):hover { background: var(--surface-hover); }
    .cd-btn-ghost { background: transparent; color: var(--ink-muted); }
    .cd-btn-ghost:not(:disabled):hover { background: var(--surface-hover); color: var(--ink); }
    .cd-btn-danger { background: transparent; color: var(--red); border-color: var(--red-soft); }
    .cd-btn-danger:hover { background: var(--red-soft); }
    .cd-btn-sm { padding: 7px 13px; font-size: 13px; }
    .cd-btn-full { width: 100%; }

    .cd-input, .cd-select, .cd-textarea {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 13px;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .cd-input:focus, .cd-select:focus, .cd-textarea:focus { border-color: var(--accent); }
    .cd-textarea { resize: vertical; min-height: 90px; line-height: 1.55; }
    .cd-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .cd-label { font-size: 13.5px; font-weight: 500; color: var(--ink); }
    .cd-hint { font-size: 12.5px; color: var(--ink-faint); }
    .cd-error { font-size: 12.5px; color: var(--red); }
    .cd-input-error { border-color: var(--red) !important; }

    .cd-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .cd-card-hover:hover { border-color: #C9C6BC; }

    .cd-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12.5px;
      font-weight: 600;
      padding: 4px 11px;
      border-radius: var(--radius-pill);
      line-height: 1.4;
    }
    .cd-badge-neutral { background: #EEEDE8; color: var(--ink-muted); }
    .cd-badge-amber { background: var(--amber-soft); color: var(--amber); }
    .cd-badge-accent { background: var(--accent-soft); color: var(--accent); }
    .cd-badge-dark { background: var(--ink); color: #fff; }

    .cd-shell { display: flex; min-height: 100vh; }
    .cd-sidebar {
      width: 250px;
      flex-shrink: 0;
      border-right: 1px solid var(--border);
      background: var(--surface);
      display: flex;
      flex-direction: column;
      padding: 26px 18px;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    .cd-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      font-size: 14.5px;
      font-weight: 500;
      color: var(--ink-muted);
      transition: all 0.15s ease;
      margin-bottom: 2px;
    }
    .cd-nav-item:hover { background: var(--surface-hover); color: var(--ink); }
    .cd-nav-item.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }

    .cd-main { flex: 1; min-width: 0; padding: 44px 48px; max-width: 900px; }

    .cd-topbar-mobile {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      position: sticky;
      top: 0;
      z-index: 20;
    }

    .cd-drawer {
      position: fixed;
      inset: 0;
      z-index: 30;
      display: none;
    }
    .cd-drawer.open { display: block; }
    .cd-drawer-panel {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 260px;
      background: var(--surface);
      padding: 22px 16px;
      display: flex;
      flex-direction: column;
    }
    .cd-drawer-overlay {
      position: absolute; inset: 0;
      background: rgba(26,29,34,0.35);
    }

    @media (max-width: 860px) {
      .cd-sidebar { display: none; }
      .cd-topbar-mobile { display: flex; }
      .cd-main { padding: 24px 18px 60px; max-width: 100%; }
    }

    .cd-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 56px 24px;
      border: 1px dashed var(--border);
      border-radius: var(--radius);
      color: var(--ink-muted);
    }

    .cd-skeleton {
      background: linear-gradient(90deg, #EFEEE9 25%, #F6F5F1 37%, #EFEEE9 63%);
      background-size: 400% 100%;
      animation: cd-shimmer 1.4s ease infinite;
      border-radius: var(--radius-sm);
    }
    @keyframes cd-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

    .cd-star-row { display: inline-flex; gap: 2px; }
    .cd-star-btn { background: none; border: none; padding: 2px; line-height: 0; }

    .cd-fade-in { animation: cd-fade 0.2s ease; }
    @keyframes cd-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    .cd-modal-overlay {
      position: fixed; inset: 0; background: rgba(26,29,34,0.45);
      display: flex; align-items: center; justify-content: center;
      padding: 20px; z-index: 50;
    }
    .cd-modal {
      background: var(--surface);
      border-radius: 14px;
      padding: 28px;
      width: 100%;
      max-width: 440px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .cd-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--accent-soft); color: var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; flex-shrink: 0;
    }

    .cd-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
    .cd-tab {
      padding: 10px 4px; margin-right: 22px; font-size: 14.5px; font-weight: 500;
      color: var(--ink-muted); border-bottom: 2px solid transparent; margin-bottom: -1px;
    }
    .cd-tab.active { color: var(--ink); border-bottom-color: var(--accent); font-weight: 600; }
  `}</style>
);

/* -------------------------------------------------------------------------
   Componentes utilitários
------------------------------------------------------------------------- */

function Avatar({ nome, fotoUrl, size = 40 }) {
  const initials = nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  if (fotoUrl) {
    return (
      <div className="cd-avatar" style={{ width: size, height: size, padding: 0, overflow: "hidden" }}>
        <img src={fotoUrl} alt={nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div className="cd-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function AvatarEditable({ nome, fotoUrl, onChange }) {
  const inputId = useMemo(() => `foto-input-${Math.random().toString(36).slice(2)}`, []);

  function handleFile(ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ position: "relative", width: 64, height: 64 }}>
      <Avatar nome={nome} fotoUrl={fotoUrl} size={64} />
      <label
        htmlFor={inputId}
        style={{
          position: "absolute",
          right: -4,
          bottom: -4,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "var(--ink)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          border: "2px solid var(--surface)",
        }}
        title="Alterar foto"
      >
        <Camera size={13} />
      </label>
      <input id={inputId} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

function SeloBadge({ count, size = "normal" }) {
  const tier = tierSelo(count);
  if (!tier) return null;
  return (
    <span
      className="cd-badge cd-badge-accent"
      title={tier.desc}
      style={size === "small" ? { fontSize: 11.5, padding: "3px 9px" } : undefined}
    >
      <Award size={size === "small" ? 11 : 13} /> {tier.label} · {count} trabalho{count !== 1 ? "s" : ""}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    ABERTA: { cls: "cd-badge-neutral", label: STATUS_LABEL.ABERTA },
    EM_ANALISE: { cls: "cd-badge-amber", label: STATUS_LABEL.EM_ANALISE },
    EM_ANDAMENTO: { cls: "cd-badge-accent", label: STATUS_LABEL.EM_ANDAMENTO },
    CONCLUIDA: { cls: "cd-badge-dark", label: STATUS_LABEL.CONCLUIDA },
  };
  const item = map[status];
  return <span className={`cd-badge ${item.cls}`}>{item.label}</span>;
}

function StarsDisplay({ value, size = 15 }) {
  return (
    <span className="cd-star-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= Math.round(value) ? "#A8752F" : "none"}
          stroke={n <= Math.round(value) ? "#A8752F" : "#D8D5CC"}
        />
      ))}
    </span>
  );
}

function StarsInput({ value, onChange }) {
  return (
    <span className="cd-star-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className="cd-star-btn" onClick={() => onChange(n)}>
          <Star size={26} fill={n <= value ? "#A8752F" : "none"} stroke={n <= value ? "#A8752F" : "#D8D5CC"} />
        </button>
      ))}
    </span>
  );
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="cd-empty">
      <Icon size={26} color="#9CA3AF" style={{ marginBottom: 12 }} />
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: "var(--ink)" }}>{title}</div>
      <div style={{ fontSize: 13.5, maxWidth: 320, lineHeight: 1.5 }}>{text}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <div className="cd-field">
      <label className="cd-label">{label}</label>
      {children}
      {error ? <span className="cd-error">{error}</span> : hint ? <span className="cd-hint">{hint}</span> : null}
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="cd-skeleton" style={{ height: 88, borderRadius: 10 }} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   App principal
------------------------------------------------------------------------- */

export default function App() {
  const [users, setUsers] = useState(seedUsers);
  const [demandas, setDemandas] = useState(seedDemandas);
  const [propostas, setPropostas] = useState(seedPropostas);
  const [avaliacoes, setAvaliacoes] = useState(seedAvaliacoes);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [booting, setBooting] = useState(false);

  const [screen, setScreen] = useState("dashboard");
  const [selectedDemandaId, setSelectedDemandaId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avaliarAlvo, setAvaliarAlvo] = useState(null); // { demandaId, paraId, nome }

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [screen, selectedDemandaId]);

  function login(userId) {
    setBooting(true);
    setTimeout(() => {
      setCurrentUserId(userId);
      setScreen("dashboard");
      setBooting(false);
    }, 550);
  }

  function logout() {
    setCurrentUserId(null);
    setScreen("dashboard");
    setSelectedDemandaId(null);
  }

  /* ---------------- Ações de negócio (regras do MVP) ---------------- */

  function criarDemanda(dados) {
    const nova = {
      id: uid("d"),
      negocioId: currentUser.id,
      titulo: dados.titulo,
      descricao: dados.descricao,
      categoria: dados.categoria,
      prazo: dados.prazo,
      status: STATUS.ABERTA,
      criadoEm: now(),
      aceitaEm: null,
      concluidaEm: null,
      propostaAceitaId: null,
    };
    setDemandas((prev) => [nova, ...prev]);
    setSelectedDemandaId(nova.id);
    setScreen("demanda");
  }

  function jaEnviouProposta(demandaId, freelancerId) {
    return propostas.some((p) => p.demandaId === demandaId && p.freelancerId === freelancerId);
  }

  function enviarProposta(demandaId, dados) {
    const demanda = demandas.find((d) => d.id === demandaId);
    if (!demanda || demanda.status !== STATUS.ABERTA && demanda.status !== STATUS.EM_ANALISE) return;
    if (jaEnviouProposta(demandaId, currentUser.id)) return;

    const nova = {
      id: uid("p"),
      demandaId,
      freelancerId: currentUser.id,
      valor: dados.valor,
      prazo: dados.prazo,
      mensagem: dados.mensagem,
      status: "pendente",
      criadoEm: now(),
    };
    setPropostas((prev) => [nova, ...prev]);
    setDemandas((prev) =>
      prev.map((d) => (d.id === demandaId && d.status === STATUS.ABERTA ? { ...d, status: STATUS.EM_ANALISE } : d))
    );
  }

  function aceitarProposta(propostaId) {
    const proposta = propostas.find((p) => p.id === propostaId);
    if (!proposta) return;
    const demanda = demandas.find((d) => d.id === proposta.demandaId);
    if (!demanda || demanda.negocioId !== currentUser.id) return;
    if (demanda.status !== STATUS.ABERTA && demanda.status !== STATUS.EM_ANALISE) return;

    setPropostas((prev) =>
      prev.map((p) => {
        if (p.demandaId !== demanda.id) return p;
        if (p.id === propostaId) return { ...p, status: "aceita" };
        return { ...p, status: "nao_selecionada" };
      })
    );
    setDemandas((prev) =>
      prev.map((d) =>
        d.id === demanda.id
          ? { ...d, status: STATUS.EM_ANDAMENTO, propostaAceitaId: propostaId, aceitaEm: now() }
          : d
      )
    );
  }

  function concluirDemanda(demandaId) {
    const demanda = demandas.find((d) => d.id === demandaId);
    if (!demanda || demanda.negocioId !== currentUser.id) return;
    if (demanda.status !== STATUS.EM_ANDAMENTO) return;
    setDemandas((prev) => prev.map((d) => (d.id === demandaId ? { ...d, status: STATUS.CONCLUIDA, concluidaEm: now() } : d)));
  }

  function jaAvaliou(demandaId, deId) {
    return avaliacoes.some((a) => a.demandaId === demandaId && a.deId === deId);
  }

  function enviarAvaliacao({ demandaId, paraId, nota, comentario }) {
    const demanda = demandas.find((d) => d.id === demandaId);
    if (!demanda || demanda.status !== STATUS.CONCLUIDA) return;
    if (jaAvaliou(demandaId, currentUser.id)) return;
    const nova = {
      id: uid("a"),
      demandaId,
      deId: currentUser.id,
      paraId,
      nota,
      comentario,
      criadoEm: now(),
    };
    setAvaliacoes((prev) => [nova, ...prev]);
    setAvaliarAlvo(null);
  }

  function atualizarPerfil(dados) {
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...dados } : u)));
  }

  function cadastrar(dados) {
    if (users.some((u) => u.email === dados.email)) {
      return { error: "Já existe uma conta com este e-mail." };
    }
    const novo = { id: uid("u"), criadoEm: now(), ...dados };
    setUsers((prev) => [...prev, novo]);
    login(novo.id);
    return { error: null };
  }

  function autenticar(email, senha) {
    const user = users.find((u) => u.email === email && u.senha === senha);
    if (!user) return { error: "E-mail ou senha incorretos." };
    login(user.id);
    return { error: null };
  }

  /* ---------------- Helpers de leitura ---------------- */

  function ratingDe(userId) {
    const lista = avaliacoes.filter((a) => a.paraId === userId);
    if (lista.length === 0) return { media: 0, count: 0, lista: [] };
    const media = lista.reduce((s, a) => s + a.nota, 0) / lista.length;
    return { media, count: lista.length, lista };
  }

  /* ---------------- Render ---------------- */

  if (!currentUser) {
    return (
      <div className="cd-root">
        <GlobalStyles />
        <AuthScreen onLogin={autenticar} onCadastrar={cadastrar} users={users} onDemoLogin={login} booting={booting} />
      </div>
    );
  }

  const navItemsNegocio = [
    { key: "dashboard", label: "Minhas demandas", icon: Inbox },
    { key: "nova-demanda", label: "Nova demanda", icon: Plus },
    { key: "perfil", label: "Meu perfil", icon: Building2 },
  ];
  const navItemsFreelancer = [
    { key: "dashboard", label: "Demandas abertas", icon: Search },
    { key: "propostas", label: "Minhas propostas", icon: Inbox },
    { key: "perfil", label: "Meu perfil", icon: Briefcase },
  ];
  const navItems = currentUser.tipo === "negocio" ? navItemsNegocio : navItemsFreelancer;

  const ctx = {
    currentUser,
    users,
    demandas,
    propostas,
    avaliacoes,
    setScreen,
    selectedDemandaId,
    setSelectedDemandaId,
    criarDemanda,
    enviarProposta,
    aceitarProposta,
    concluirDemanda,
    jaEnviouProposta,
    jaAvaliou,
    setAvaliarAlvo,
    atualizarPerfil,
    ratingDe,
  };

  return (
    <div className="cd-root">
      <GlobalStyles />
      <div className="cd-shell">
        {/* Sidebar desktop */}
        <aside className="cd-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 10px 30px" }}>
            <span className="cd-serif" style={{ fontSize: 19, fontWeight: 600 }}>
              Conecta<span style={{ color: "var(--accent)" }}>Digital</span>
            </span>
          </div>
          <nav style={{ flex: 1 }}>
            {navItems.map((item) => (
              <div
                key={item.key}
                className={`cd-nav-item ${screen === item.key ? "active" : ""}`}
                onClick={() => {
                  setScreen(item.key);
                  setSelectedDemandaId(null);
                }}
              >
                <item.icon size={17} />
                {item.label}
              </div>
            ))}
          </nav>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar nome={currentUser.nome} fotoUrl={currentUser.fotoUrl} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser.nome}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                {currentUser.tipo === "negocio" ? "Negócio" : "Freelancer"}
              </div>
            </div>
            <button className="cd-btn cd-btn-ghost cd-btn-sm" onClick={logout} title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Topbar mobile */}
          <div className="cd-topbar-mobile">
            <span className="cd-serif" style={{ fontSize: 17, fontWeight: 600 }}>
              Conecta<span style={{ color: "var(--accent)" }}>Digital</span>
            </span>
            <button className="cd-btn cd-btn-ghost cd-btn-sm" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
          </div>

          <div className={`cd-drawer ${mobileMenuOpen ? "open" : ""}`}>
            <div className="cd-drawer-overlay" onClick={() => setMobileMenuOpen(false)} />
            <div className="cd-drawer-panel cd-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Avatar nome={currentUser.nome} fotoUrl={currentUser.fotoUrl} />
                <button className="cd-btn cd-btn-ghost cd-btn-sm" onClick={() => setMobileMenuOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{currentUser.nome}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 18 }}>
                {currentUser.tipo === "negocio" ? "Negócio" : "Freelancer"}
              </div>
              {navItems.map((item) => (
                <div
                  key={item.key}
                  className={`cd-nav-item ${screen === item.key ? "active" : ""}`}
                  onClick={() => {
                    setScreen(item.key);
                    setSelectedDemandaId(null);
                  }}
                >
                  <item.icon size={17} />
                  {item.label}
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <div className="cd-nav-item" onClick={logout}>
                <LogOut size={17} />
                Sair
              </div>
            </div>
          </div>

          <main className="cd-main">
            <ScreenRouter screen={screen} ctx={ctx} />
          </main>
        </div>
      </div>

      {avaliarAlvo && (
        <AvaliarModal
          alvo={avaliarAlvo}
          onClose={() => setAvaliarAlvo(null)}
          onSubmit={enviarAvaliacao}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Roteador simples de telas
------------------------------------------------------------------------- */

function ScreenRouter({ screen, ctx }) {
  if (screen === "demanda" && ctx.selectedDemandaId) {
    return <DemandaDetail ctx={ctx} />;
  }
  if (ctx.currentUser.tipo === "negocio") {
    if (screen === "nova-demanda") return <NovaDemandaForm ctx={ctx} />;
    if (screen === "perfil") return <PerfilNegocio ctx={ctx} />;
    return <DashboardNegocio ctx={ctx} />;
  } else {
    if (screen === "propostas") return <MinhasPropostas ctx={ctx} />;
    if (screen === "perfil") return <PerfilFreelancer ctx={ctx} />;
    return <DashboardFreelancer ctx={ctx} />;
  }
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 className="cd-serif" style={{ fontSize: 27, fontWeight: 600, margin: 0 }}>
          {title}
        </h1>
        {subtitle && <p style={{ color: "var(--ink-muted)", fontSize: 14.5, marginTop: 6, maxWidth: 480 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------
   NEGÓCIO — Dashboard, Nova demanda, Perfil
------------------------------------------------------------------------- */

function DashboardNegocio({ ctx }) {
  const minhas = ctx.demandas
    .filter((d) => d.negocioId === ctx.currentUser.id)
    .sort((a, b) => b.criadoEm - a.criadoEm);

  return (
    <div className="cd-fade-in">
      <PageHeader
        title="Minhas demandas"
        subtitle="Acompanhe as propostas recebidas e o andamento de cada demanda publicada."
        action={
          <button className="cd-btn cd-btn-primary" onClick={() => { ctx.setScreen("nova-demanda"); }}>
            <Plus size={16} /> Nova demanda
          </button>
        }
      />

      {minhas.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhuma demanda publicada ainda"
          text="Publique sua primeira demanda para começar a receber propostas de freelancers locais."
          action={
            <button className="cd-btn cd-btn-primary" onClick={() => ctx.setScreen("nova-demanda")}>
              <Plus size={16} /> Publicar demanda
            </button>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {minhas.map((d) => {
            const totalPropostas = ctx.propostas.filter((p) => p.demandaId === d.id).length;
            return (
              <div
                key={d.id}
                className="cd-card cd-card-hover"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  ctx.setSelectedDemandaId(d.id);
                  ctx.setScreen("demanda");
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 15.5 }}>{d.titulo}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>
                      {d.categoria} · Prazo {fmtPrazo(d.prazo)} · {totalPropostas} proposta{totalPropostas !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <ChevronRight size={19} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NovaDemandaForm({ ctx }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prazo, setPrazo] = useState("");
  const [errors, setErrors] = useState({});

  function validar() {
    const e = {};
    if (titulo.trim().length < 5) e.titulo = "Informe um título com pelo menos 5 caracteres.";
    if (descricao.trim().length < 20) e.descricao = "Descreva a demanda com pelo menos 20 caracteres.";
    if (!categoria) e.categoria = "Selecione uma categoria.";
    if (!prazo) e.prazo = "Informe o prazo desejado.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(ev) {
    ev.preventDefault();
    if (!validar()) return;
    ctx.criarDemanda({ titulo: titulo.trim(), descricao: descricao.trim(), categoria, prazo });
  }

  return (
    <div className="cd-fade-in" style={{ maxWidth: 560 }}>
      <PageHeader title="Nova demanda" subtitle="Descreva o que sua empresa precisa. Freelancers da categoria escolhida poderão enviar propostas." />
      <form onSubmit={submit}>
        <Field label="Título da demanda" error={errors.titulo}>
          <input className={`cd-input ${errors.titulo ? "cd-input-error" : ""}`} placeholder="Ex: Criação de logotipo para nova unidade" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </Field>
        <Field label="Descrição" error={errors.descricao} hint="Conte o contexto, o que espera como entrega e quaisquer detalhes importantes.">
          <textarea className={`cd-textarea ${errors.descricao ? "cd-input-error" : ""}`} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </Field>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <Field label="Categoria" error={errors.categoria}>
              <select className={`cd-select ${errors.categoria ? "cd-input-error" : ""}`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Selecione</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Prazo desejado" error={errors.prazo}>
              <input type="date" className={`cd-input ${errors.prazo ? "cd-input-error" : ""}`} value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button type="submit" className="cd-btn cd-btn-primary">Publicar demanda</button>
          <button type="button" className="cd-btn cd-btn-secondary" onClick={() => ctx.setScreen("dashboard")}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function PerfilNegocio({ ctx }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(ctx.currentUser.nome);
  const [fotoUrl, setFotoUrl] = useState(ctx.currentUser.fotoUrl || "");
  const [localizacao, setLocalizacao] = useState(ctx.currentUser.localizacao || "");
  const [setor, setSetor] = useState(ctx.currentUser.setor || "");
  const [descricaoNegocio, setDescricaoNegocio] = useState(ctx.currentUser.descricaoNegocio || "");
  const rating = ctx.ratingDe(ctx.currentUser.id);

  function salvar() {
    ctx.atualizarPerfil({ nome, fotoUrl, localizacao, setor, descricaoNegocio });
    setEditando(false);
  }

  return (
    <div className="cd-fade-in" style={{ maxWidth: 560 }}>
      <PageHeader
        title="Meu perfil"
        action={
          !editando && (
            <button className="cd-btn cd-btn-secondary" onClick={() => setEditando(true)}>
              <Pencil size={15} /> Editar
            </button>
          )
        }
      />
      <div className="cd-card" style={{ marginBottom: 24 }}>
        {editando ? (
          <>
            <div style={{ marginBottom: 18 }}>
              <AvatarEditable nome={nome || ctx.currentUser.nome} fotoUrl={fotoUrl} onChange={setFotoUrl} />
            </div>
            <Field label="Nome do negócio"><input className="cd-input" value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
            <Field label="Localização" hint="Bairro e cidade, ex: Centro, Sorocaba - SP">
              <input className="cd-input" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} />
            </Field>
            <Field label="Setor"><input className="cd-input" value={setor} onChange={(e) => setSetor(e.target.value)} /></Field>
            <Field label="Descrição curta"><textarea className="cd-textarea" value={descricaoNegocio} onChange={(e) => setDescricaoNegocio(e.target.value)} /></Field>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="cd-btn cd-btn-primary" onClick={salvar}>Salvar alterações</button>
              <button className="cd-btn cd-btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <Avatar nome={ctx.currentUser.nome} fotoUrl={ctx.currentUser.fotoUrl} size={52} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16.5 }}>{ctx.currentUser.nome}</div>
                <div style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>{ctx.currentUser.setor}</div>
                {ctx.currentUser.localizacao && (
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <MapPin size={12} /> {ctx.currentUser.localizacao}
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink)" }}>{ctx.currentUser.descricaoNegocio}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <StarsDisplay value={rating.media} />
              <span style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>
                {rating.count > 0 ? `${rating.media.toFixed(1)} · ${rating.count} avaliação${rating.count !== 1 ? "ões" : ""}` : "Ainda sem avaliações"}
              </span>
            </div>
          </>
        )}
      </div>

      <AvaliacoesHistorico rating={rating} users={ctx.users} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   FREELANCER — Dashboard, Minhas propostas, Perfil
------------------------------------------------------------------------- */

function DashboardFreelancer({ ctx }) {
  const [filtro, setFiltro] = useState("");
  const abertas = ctx.demandas
    .filter((d) => d.status === STATUS.ABERTA || d.status === STATUS.EM_ANALISE)
    .filter((d) => !filtro || d.categoria === filtro)
    .sort((a, b) => b.criadoEm - a.criadoEm);

  return (
    <div className="cd-fade-in">
      <PageHeader title="Demandas abertas" subtitle="Encontre demandas publicadas por negócios locais e envie sua proposta." />

      <div style={{ marginBottom: 22, maxWidth: 260 }}>
        <select className="cd-select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {abertas.length === 0 ? (
        <EmptyState icon={Search} title="Nenhuma demanda encontrada" text="Não há demandas abertas para essa categoria no momento. Tente outro filtro." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {abertas.map((d) => {
            const negocio = ctx.users.find((u) => u.id === d.negocioId);
            const enviada = ctx.jaEnviouProposta(d.id, ctx.currentUser.id);
            return (
              <div
                key={d.id}
                className="cd-card cd-card-hover"
                style={{ cursor: "pointer" }}
                onClick={() => { ctx.setSelectedDemandaId(d.id); ctx.setScreen("demanda"); }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 15.5 }}>{d.titulo}</span>
                      <span className="cd-badge cd-badge-neutral">{d.categoria}</span>
                      {enviada && <span className="cd-badge cd-badge-accent">Proposta enviada</span>}
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>
                      {negocio?.nome} · Prazo {fmtPrazo(d.prazo)}
                    </div>
                  </div>
                  <ChevronRight size={19} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MinhasPropostas({ ctx }) {
  const minhas = ctx.propostas
    .filter((p) => p.freelancerId === ctx.currentUser.id)
    .sort((a, b) => b.criadoEm - a.criadoEm);

  const statusMap = {
    pendente: { cls: "cd-badge-amber", label: "Pendente" },
    aceita: { cls: "cd-badge-accent", label: "Aceita" },
    nao_selecionada: { cls: "cd-badge-neutral", label: "Não selecionada" },
  };

  return (
    <div className="cd-fade-in">
      <PageHeader title="Minhas propostas" subtitle="Acompanhe o status de cada proposta enviada." />
      {minhas.length === 0 ? (
        <EmptyState icon={Inbox} title="Você ainda não enviou propostas" text="Explore as demandas abertas e envie sua primeira proposta." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {minhas.map((p) => {
            const demanda = ctx.demandas.find((d) => d.id === p.demandaId);
            if (!demanda) return null;
            const negocio = ctx.users.find((u) => u.id === demanda.negocioId);
            const podeAvaliar =
              demanda.status === STATUS.CONCLUIDA && p.status === "aceita" && !ctx.jaAvaliou(demanda.id, ctx.currentUser.id);
            const st = statusMap[p.status];
            return (
              <div key={p.id} className="cd-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span
                        style={{ fontWeight: 600, fontSize: 15.5, cursor: "pointer" }}
                        onClick={() => { ctx.setSelectedDemandaId(demanda.id); ctx.setScreen("demanda"); }}
                      >
                        {demanda.titulo}
                      </span>
                      <span className={`cd-badge ${st.cls}`}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>
                      {negocio?.nome} · R$ {p.valor} · Prazo {fmtPrazo(p.prazo)}
                    </div>
                  </div>
                  {podeAvaliar && (
                    <button
                      className="cd-btn cd-btn-secondary cd-btn-sm"
                      onClick={() => ctx.setAvaliarAlvo({ demandaId: demanda.id, paraId: negocio.id, nome: negocio.nome })}
                    >
                      <Star size={14} /> Avaliar negócio
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PerfilFreelancer({ ctx }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(ctx.currentUser.nome);
  const [fotoUrl, setFotoUrl] = useState(ctx.currentUser.fotoUrl || "");
  const [localizacao, setLocalizacao] = useState(ctx.currentUser.localizacao || "");
  const [especialidade, setEspecialidade] = useState(ctx.currentUser.especialidade || "");
  const [descricaoFreelancer, setDescricaoFreelancer] = useState(ctx.currentUser.descricaoFreelancer || "");
  const [faixaPreco, setFaixaPreco] = useState(ctx.currentUser.faixaPreco || "");
  const [formacao, setFormacao] = useState(ctx.currentUser.formacao || []);
  const rating = ctx.ratingDe(ctx.currentUser.id);
  const concluidos = trabalhosConcluidos(ctx.currentUser.id, ctx.demandas, ctx.propostas);

  function salvar() {
    ctx.atualizarPerfil({ nome, fotoUrl, localizacao, especialidade, descricaoFreelancer, faixaPreco, formacao });
    setEditando(false);
  }

  function addFormacao() {
    setFormacao((prev) => [...prev, { id: uid("f"), titulo: "", instituicao: "", ano: "" }]);
  }
  function updateFormacao(id, campo, valor) {
    setFormacao((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
  }
  function removerFormacao(id) {
    setFormacao((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="cd-fade-in" style={{ maxWidth: 560 }}>
      <PageHeader
        title="Meu perfil"
        action={
          !editando && (
            <button className="cd-btn cd-btn-secondary" onClick={() => setEditando(true)}>
              <Pencil size={15} /> Editar
            </button>
          )
        }
      />
      <div className="cd-card" style={{ marginBottom: 24 }}>
        {editando ? (
          <>
            <div style={{ marginBottom: 18 }}>
              <AvatarEditable nome={nome || ctx.currentUser.nome} fotoUrl={fotoUrl} onChange={setFotoUrl} />
            </div>
            <Field label="Nome"><input className="cd-input" value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
            <Field label="Localização" hint="Bairro e cidade, ex: Centro, Sorocaba - SP">
              <input className="cd-input" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} />
            </Field>
            <Field label="Especialidade">
              <select className="cd-select" value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}>
                <option value="">Selecione</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Descrição / portfólio"><textarea className="cd-textarea" value={descricaoFreelancer} onChange={(e) => setDescricaoFreelancer(e.target.value)} /></Field>
            <Field label="Faixa de preço" hint="Ex: R$ 300 – R$ 1.000"><input className="cd-input" value={faixaPreco} onChange={(e) => setFaixaPreco(e.target.value)} /></Field>

            <div className="cd-field">
              <label className="cd-label">Formação e certificados</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
                {formacao.map((f) => (
                  <div key={f.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <input className="cd-input" placeholder="Curso ou certificado" value={f.titulo} onChange={(e) => updateFormacao(f.id, "titulo", e.target.value)} />
                      <div style={{ display: "flex", gap: 6 }}>
                        <input className="cd-input" placeholder="Instituição" value={f.instituicao} onChange={(e) => updateFormacao(f.id, "instituicao", e.target.value)} />
                        <input className="cd-input" placeholder="Ano" style={{ maxWidth: 90 }} value={f.ano} onChange={(e) => updateFormacao(f.id, "ano", e.target.value)} />
                      </div>
                    </div>
                    <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={() => removerFormacao(f.id)} title="Remover">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="cd-btn cd-btn-secondary cd-btn-sm" style={{ marginTop: 10 }} onClick={addFormacao}>
                <Plus size={14} /> Adicionar formação
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button className="cd-btn cd-btn-primary" onClick={salvar}>Salvar alterações</button>
              <button className="cd-btn cd-btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <Avatar nome={ctx.currentUser.nome} fotoUrl={ctx.currentUser.fotoUrl} size={52} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16.5 }}>{ctx.currentUser.nome}</div>
                <div style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>{ctx.currentUser.especialidade}</div>
                {ctx.currentUser.localizacao && (
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <MapPin size={12} /> {ctx.currentUser.localizacao}
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.6 }}>{ctx.currentUser.descricaoFreelancer}</p>
            <div style={{ fontSize: 13.5, color: "var(--ink-muted)", marginTop: 4 }}>
              <Banknote size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
              {ctx.currentUser.faixaPreco}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <StarsDisplay value={rating.media} />
              <span style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>
                {rating.count > 0 ? `${rating.media.toFixed(1)} · ${rating.count} avaliação${rating.count !== 1 ? "ões" : ""}` : "Ainda sem avaliações"}
              </span>
              <SeloBadge count={concluidos} />
            </div>

            {formacao.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <GraduationCap size={15} /> Formação e certificados
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {formacao.map((f) => (
                    <div key={f.id} style={{ fontSize: 13.5 }}>
                      <span style={{ fontWeight: 500 }}>{f.titulo}</span>
                      {f.instituicao && <span style={{ color: "var(--ink-muted)" }}> · {f.instituicao}</span>}
                      {f.ano && <span style={{ color: "var(--ink-faint)" }}> · {f.ano}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <AvaliacoesHistorico rating={rating} users={ctx.users} />
    </div>
  );
}

function AvaliacoesHistorico({ rating, users }) {
  return (
    <div>
      <h3 style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 12 }}>Avaliações recebidas</h3>
      {rating.count === 0 ? (
        <EmptyState icon={Star} title="Sem avaliações ainda" text="As avaliações aparecerão aqui após a conclusão de contratações." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rating.lista.map((a) => {
            const de = users.find((u) => u.id === a.deId);
            return (
              <div key={a.id} className="cd-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{de?.nome}</span>
                  <StarsDisplay value={a.nota} size={13} />
                </div>
                <p style={{ fontSize: 13.5, color: "var(--ink-muted)", lineHeight: 1.5, margin: 0 }}>{a.comentario}</p>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 8 }}>{fmtDate(a.criadoEm)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Detalhe da demanda (visão negócio e freelancer)
------------------------------------------------------------------------- */

function DemandaDetail({ ctx }) {
  const demanda = ctx.demandas.find((d) => d.id === ctx.selectedDemandaId);
  if (!demanda) return null;
  const negocio = ctx.users.find((u) => u.id === demanda.negocioId);
  const isDono = ctx.currentUser.tipo === "negocio" && demanda.negocioId === ctx.currentUser.id;
  const isFreelancer = ctx.currentUser.tipo === "freelancer";

  const propostasDemanda = ctx.propostas
    .filter((p) => p.demandaId === demanda.id)
    .sort((a, b) => b.criadoEm - a.criadoEm);

  return (
    <div className="cd-fade-in" style={{ maxWidth: 620 }}>
      <button
        className="cd-btn cd-btn-ghost cd-btn-sm"
        style={{ marginBottom: 18, paddingLeft: 4 }}
        onClick={() => { ctx.setScreen("dashboard"); ctx.setSelectedDemandaId(null); }}
      >
        <ChevronLeft size={16} /> Voltar
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <h1 className="cd-serif" style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{demanda.titulo}</h1>
        <StatusBadge status={demanda.status} />
      </div>
      <div style={{ fontSize: 13.5, color: "var(--ink-muted)", marginBottom: 20 }}>
        {negocio?.nome} · {demanda.categoria} · Prazo {fmtPrazo(demanda.prazo)}
      </div>

      <div className="cd-card" style={{ marginBottom: 26 }}>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{demanda.descricao}</p>
      </div>

      {isDono && demanda.status === STATUS.EM_ANDAMENTO && (
        <div className="cd-card" style={{ marginBottom: 26, background: "var(--accent-soft)", border: "1px solid var(--accent-soft)" }}>
          <div style={{ fontSize: 14, marginBottom: 10 }}>Esta demanda está em andamento com a proposta aceita abaixo.</div>
          <button className="cd-btn cd-btn-primary" onClick={() => ctx.concluirDemanda(demanda.id)}>
            <Check size={16} /> Marcar como concluída
          </button>
        </div>
      )}

      {isDono && demanda.status === STATUS.CONCLUIDA && (
        <ConcluidaAvaliarBloco ctx={ctx} demanda={demanda} propostasDemanda={propostasDemanda} />
      )}

      {isDono ? (
        <PropostasNegocio ctx={ctx} demanda={demanda} propostasDemanda={propostasDemanda} />
      ) : isFreelancer ? (
        <PropostaFreelancerBloco ctx={ctx} demanda={demanda} />
      ) : null}
    </div>
  );
}

function ConcluidaAvaliarBloco({ ctx, demanda, propostasDemanda }) {
  const aceita = propostasDemanda.find((p) => p.id === demanda.propostaAceitaId);
  if (!aceita) return null;
  const freelancer = ctx.users.find((u) => u.id === aceita.freelancerId);
  const jaAvaliou = ctx.jaAvaliou(demanda.id, ctx.currentUser.id);

  return (
    <div className="cd-card" style={{ marginBottom: 26 }}>
      <div style={{ fontSize: 14, marginBottom: jaAvaliou ? 0 : 10 }}>
        {jaAvaliou ? `Você já avaliou ${freelancer?.nome} por esta contratação.` : `Demanda concluída. Avalie o trabalho de ${freelancer?.nome}.`}
      </div>
      {!jaAvaliou && (
        <button
          className="cd-btn cd-btn-secondary"
          onClick={() => ctx.setAvaliarAlvo({ demandaId: demanda.id, paraId: freelancer.id, nome: freelancer.nome })}
        >
          <Star size={15} /> Avaliar freelancer
        </button>
      )}
    </div>
  );
}

function PropostasNegocio({ ctx, demanda, propostasDemanda }) {
  return (
    <div>
      <h3 style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 14 }}>
        Propostas recebidas {propostasDemanda.length > 0 && `(${propostasDemanda.length})`}
      </h3>
      {propostasDemanda.length === 0 ? (
        <EmptyState icon={Inbox} title="Nenhuma proposta ainda" text="Assim que um freelancer enviar uma proposta, ela aparecerá aqui." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {propostasDemanda.map((p) => {
            const freelancer = ctx.users.find((u) => u.id === p.freelancerId);
            const rating = ctx.ratingDe(freelancer.id);
            const podeAceitar = demanda.status === STATUS.ABERTA || demanda.status === STATUS.EM_ANALISE;
            return (
              <div key={p.id} className="cd-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Avatar nome={freelancer.nome} fotoUrl={freelancer.fotoUrl} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>{freelancer.nome}</div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-muted)", marginBottom: 4 }}>{freelancer.especialidade}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <StarsDisplay value={rating.media} size={12} />
                        <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                          {rating.count > 0 ? `${rating.media.toFixed(1)} (${rating.count})` : "Sem avaliações"}
                        </span>
                        <SeloBadge count={trabalhosConcluidos(freelancer.id, ctx.demandas, ctx.propostas)} size="small" />
                      </div>
                    </div>
                  </div>
                  {p.status === "aceita" && <span className="cd-badge cd-badge-accent">Aceita</span>}
                  {p.status === "nao_selecionada" && <span className="cd-badge cd-badge-neutral">Não selecionada</span>}
                </div>

                <div style={{ display: "flex", gap: 18, margin: "14px 0 10px", fontSize: 13.5, color: "var(--ink)" }}>
                  <span><Banknote size={14} style={{ verticalAlign: -2, marginRight: 4 }} />R$ {p.valor}</span>
                  <span><Clock size={14} style={{ verticalAlign: -2, marginRight: 4 }} />{fmtPrazo(p.prazo)}</span>
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-muted)", margin: "0 0 12px" }}>{p.mensagem}</p>

                {podeAceitar && p.status === "pendente" && (
                  <button className="cd-btn cd-btn-primary cd-btn-sm" onClick={() => ctx.aceitarProposta(p.id)}>
                    <Check size={14} /> Aceitar proposta
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PropostaFreelancerBloco({ ctx, demanda }) {
  const minhaProposta = ctx.propostas.find((p) => p.demandaId === demanda.id && p.freelancerId === ctx.currentUser.id);

  if (minhaProposta) {
    const statusMap = {
      pendente: { cls: "cd-badge-amber", label: "Aguardando resposta do negócio" },
      aceita: { cls: "cd-badge-accent", label: "Sua proposta foi aceita" },
      nao_selecionada: { cls: "cd-badge-neutral", label: "Não selecionada desta vez" },
    };
    const st = statusMap[minhaProposta.status];
    return (
      <div className="cd-card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Sua proposta</h3>
        <span className={`cd-badge ${st.cls}`} style={{ marginBottom: 12 }}>{st.label}</span>
        <div style={{ display: "flex", gap: 18, margin: "12px 0 10px", fontSize: 13.5 }}>
          <span><Banknote size={14} style={{ verticalAlign: -2, marginRight: 4 }} />R$ {minhaProposta.valor}</span>
          <span><Clock size={14} style={{ verticalAlign: -2, marginRight: 4 }} />{fmtPrazo(minhaProposta.prazo)}</span>
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-muted)", margin: 0 }}>{minhaProposta.mensagem}</p>
      </div>
    );
  }

  if (demanda.status !== STATUS.ABERTA && demanda.status !== STATUS.EM_ANALISE) {
    return (
      <EmptyState icon={X} title="Esta demanda não está mais recebendo propostas" text="O negócio já avançou para a próxima etapa do processo." />
    );
  }

  return <EnviarPropostaForm ctx={ctx} demanda={demanda} />;
}

function EnviarPropostaForm({ ctx, demanda }) {
  const [valor, setValor] = useState("");
  const [prazo, setPrazo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [errors, setErrors] = useState({});

  function validar() {
    const e = {};
    const valorNum = Number(valor);
    if (!valor || isNaN(valorNum) || valorNum <= 0) e.valor = "Informe um valor válido.";
    if (!prazo) e.prazo = "Informe o prazo que você propõe.";
    if (mensagem.trim().length < 10) e.mensagem = "Escreva uma mensagem com pelo menos 10 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(ev) {
    ev.preventDefault();
    if (!validar()) return;
    ctx.enviarProposta(demanda.id, { valor: Number(valor), prazo, mensagem: mensagem.trim() });
  }

  return (
    <div className="cd-card">
      <h3 style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 14 }}>Enviar proposta</h3>
      <form onSubmit={submit}>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <Field label="Valor (R$)" error={errors.valor}>
              <input className={`cd-input ${errors.valor ? "cd-input-error" : ""}`} type="number" min="1" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="800" />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Prazo de entrega" error={errors.prazo}>
              <input className={`cd-input ${errors.prazo ? "cd-input-error" : ""}`} type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </Field>
          </div>
        </div>
        <Field label="Mensagem" error={errors.mensagem} hint="Explique como você pretende resolver a demanda.">
          <textarea className={`cd-textarea ${errors.mensagem ? "cd-input-error" : ""}`} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        </Field>
        <button type="submit" className="cd-btn cd-btn-primary">
          Enviar proposta <ArrowRight size={15} />
        </button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Modal de avaliação
------------------------------------------------------------------------- */

function AvaliarModal({ alvo, onClose, onSubmit }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (nota === 0) { setError("Selecione uma nota de 1 a 5."); return; }
    onSubmit({ demandaId: alvo.demandaId, paraId: alvo.paraId, nota, comentario: comentario.trim() });
  }

  return (
    <div className="cd-modal-overlay" onClick={onClose}>
      <div className="cd-modal cd-fade-in" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Avaliar {alvo.nome}</h3>
          <button className="cd-btn cd-btn-ghost cd-btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div className="cd-label" style={{ marginBottom: 8 }}>Nota</div>
          <StarsInput value={nota} onChange={setNota} />
          {error && <div className="cd-error" style={{ marginTop: 6 }}>{error}</div>}
        </div>
        <Field label="Comentário (opcional)">
          <textarea className="cd-textarea" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Como foi a experiência?" />
        </Field>
        <button className="cd-btn cd-btn-primary cd-btn-full" onClick={submit}>Enviar avaliação</button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Autenticação — Login / Cadastro
------------------------------------------------------------------------- */

function AuthScreen({ onLogin, onCadastrar, users, onDemoLogin, booting }) {
  const [mode, setMode] = useState("login"); // 'login' | 'cadastro'

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <div className="cd-serif" style={{ fontSize: 22, fontWeight: 600 }}>
          Conecta<span style={{ color: "var(--accent)" }}>Digital</span>
        </div>
        <SkeletonBlock />
        <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>Carregando seu painel…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }} className="cd-fade-in">
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div className="cd-serif" style={{ fontSize: 26, fontWeight: 600, marginBottom: 8 }}>
            Conecta<span style={{ color: "var(--accent)" }}>Digital</span>
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-muted)" }}>
            Freelancers e pequenos negócios de Sorocaba, conectados.
          </div>
        </div>

        <div className="cd-tabs" style={{ justifyContent: "center" }}>
          <div className={`cd-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")} style={{ cursor: "pointer" }}>Entrar</div>
          <div className={`cd-tab ${mode === "cadastro" ? "active" : ""}`} onClick={() => setMode("cadastro")} style={{ cursor: "pointer" }}>Criar conta</div>
        </div>

        {mode === "login" ? (
          <LoginForm onLogin={onLogin} />
        ) : (
          <CadastroForm onCadastrar={onCadastrar} />
        )}

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 10, textAlign: "center" }}>
            Testar rapidamente com uma conta de demonstração
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cd-btn cd-btn-secondary cd-btn-full cd-btn-sm" onClick={() => onDemoLogin("u_negocio_1")}>
              <Building2 size={14} /> Como negócio
            </button>
            <button className="cd-btn cd-btn-secondary cd-btn-full cd-btn-sm" onClick={() => onDemoLogin("u_free_2")}>
              <Briefcase size={14} /> Como freelancer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  function submit(ev) {
    ev.preventDefault();
    const res = onLogin(email.trim(), senha);
    if (res.error) setError(res.error);
  }

  return (
    <form onSubmit={submit}>
      <Field label="E-mail"><input className="cd-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" /></Field>
      <Field label="Senha" error={error}><input className={`cd-input ${error ? "cd-input-error" : ""}`} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></Field>
      <button type="submit" className="cd-btn cd-btn-primary cd-btn-full">Entrar</button>
    </form>
  );
}

function CadastroForm({ onCadastrar }) {
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errors, setErrors] = useState({});

  const [setor, setSetor] = useState("");
  const [descricaoNegocio, setDescricaoNegocio] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [descricaoFreelancer, setDescricaoFreelancer] = useState("");
  const [faixaPreco, setFaixaPreco] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [finalError, setFinalError] = useState("");

  function validarStep1() {
    const e = {};
    if (!tipo) e.tipo = "Escolha um tipo de perfil.";
    if (nome.trim().length < 2) e.nome = "Informe seu nome ou o nome do negócio.";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Informe um e-mail válido.";
    if (senha.length < 6) e.senha = "A senha deve ter pelo menos 6 caracteres.";
    if (localizacao.trim().length < 3) e.localizacao = "Informe bairro e cidade.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function irParaStep2(ev) {
    ev.preventDefault();
    if (validarStep1()) setStep(2);
  }

  function finalizar(ev) {
    ev.preventDefault();
    const e = {};
    if (tipo === "negocio") {
      if (!setor.trim()) e.setor = "Informe o setor do seu negócio.";
      if (descricaoNegocio.trim().length < 15) e.descricaoNegocio = "Escreva uma descrição curta (mín. 15 caracteres).";
    } else {
      if (!especialidade) e.especialidade = "Selecione sua especialidade.";
      if (descricaoFreelancer.trim().length < 15) e.descricaoFreelancer = "Escreva uma breve descrição (mín. 15 caracteres).";
      if (!faixaPreco.trim()) e.faixaPreco = "Informe sua faixa de preço.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const dados =
      tipo === "negocio"
        ? { tipo, nome: nome.trim(), email: email.trim(), senha, localizacao: localizacao.trim(), setor: setor.trim(), descricaoNegocio: descricaoNegocio.trim(), fotoUrl: "" }
        : { tipo, nome: nome.trim(), email: email.trim(), senha, localizacao: localizacao.trim(), especialidade, descricaoFreelancer: descricaoFreelancer.trim(), faixaPreco: faixaPreco.trim(), fotoUrl: "", formacao: [] };

    const res = onCadastrar(dados);
    if (res.error) setFinalError(res.error);
  }

  if (step === 1) {
    return (
      <form onSubmit={irParaStep2}>
        <div className="cd-field">
          <label className="cd-label">Você é...</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button
              type="button"
              className="cd-card"
              style={{ flex: 1, textAlign: "left", borderColor: tipo === "negocio" ? "var(--accent)" : "var(--border)", background: tipo === "negocio" ? "var(--accent-soft)" : "var(--surface)" }}
              onClick={() => setTipo("negocio")}
            >
              <Building2 size={18} color={tipo === "negocio" ? "var(--accent)" : "var(--ink-muted)"} />
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>Negócio</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>Quero publicar demandas</div>
            </button>
            <button
              type="button"
              className="cd-card"
              style={{ flex: 1, textAlign: "left", borderColor: tipo === "freelancer" ? "var(--accent)" : "var(--border)", background: tipo === "freelancer" ? "var(--accent-soft)" : "var(--surface)" }}
              onClick={() => setTipo("freelancer")}
            >
              <Briefcase size={18} color={tipo === "freelancer" ? "var(--accent)" : "var(--ink-muted)"} />
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>Freelancer</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>Quero enviar propostas</div>
            </button>
          </div>
          {errors.tipo && <div className="cd-error" style={{ marginTop: 6 }}>{errors.tipo}</div>}
        </div>

        <Field label={tipo === "negocio" ? "Nome do negócio" : "Seu nome"} error={errors.nome}>
          <input className={`cd-input ${errors.nome ? "cd-input-error" : ""}`} value={nome} onChange={(e) => setNome(e.target.value)} />
        </Field>
        <Field label="E-mail" error={errors.email}>
          <input className={`cd-input ${errors.email ? "cd-input-error" : ""}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha" error={errors.senha} hint="Mínimo de 6 caracteres.">
          <input className={`cd-input ${errors.senha ? "cd-input-error" : ""}`} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </Field>
        <Field label="Localização" error={errors.localizacao} hint="Bairro e cidade, ex: Centro, Sorocaba - SP">
          <input className={`cd-input ${errors.localizacao ? "cd-input-error" : ""}`} value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} />
        </Field>
        <button type="submit" className="cd-btn cd-btn-primary cd-btn-full">Continuar</button>
      </form>
    );
  }

  return (
    <form onSubmit={finalizar}>
      {tipo === "negocio" ? (
        <>
          <Field label="Setor" error={errors.setor}>
            <input className={`cd-input ${errors.setor ? "cd-input-error" : ""}`} value={setor} onChange={(e) => setSetor(e.target.value)} placeholder="Ex: Alimentação, Varejo, Saúde" />
          </Field>
          <Field label="Descrição curta" error={errors.descricaoNegocio}>
            <textarea className={`cd-textarea ${errors.descricaoNegocio ? "cd-input-error" : ""}`} value={descricaoNegocio} onChange={(e) => setDescricaoNegocio(e.target.value)} />
          </Field>
        </>
      ) : (
        <>
          <Field label="Especialidade" error={errors.especialidade}>
            <select className={`cd-select ${errors.especialidade ? "cd-input-error" : ""}`} value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}>
              <option value="">Selecione</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Descrição ou breve portfólio" error={errors.descricaoFreelancer}>
            <textarea className={`cd-textarea ${errors.descricaoFreelancer ? "cd-input-error" : ""}`} value={descricaoFreelancer} onChange={(e) => setDescricaoFreelancer(e.target.value)} />
          </Field>
          <Field label="Faixa de preço" error={errors.faixaPreco} hint="Ex: R$ 300 – R$ 1.000">
            <input className={`cd-input ${errors.faixaPreco ? "cd-input-error" : ""}`} value={faixaPreco} onChange={(e) => setFaixaPreco(e.target.value)} />
          </Field>
        </>
      )}
      {finalError && <div className="cd-error" style={{ marginBottom: 12 }}>{finalError}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="cd-btn cd-btn-secondary" onClick={() => setStep(1)}><ChevronLeft size={15} /> Voltar</button>
        <button type="submit" className="cd-btn cd-btn-primary" style={{ flex: 1 }}>Criar conta</button>
      </div>
    </form>
  );
}
