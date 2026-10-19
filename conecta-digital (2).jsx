import React, { useState, useEffect, useMemo, useId } from "react";
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
  ArrowRight,
  Inbox,
  Search,
  Pencil,
  MapPin,
  Award,
  Camera,
  GraduationCap,
  Trash2,
  Newspaper,
  Heart,
  UserPlus,
  Send,
  Lock,
  Mail,
  MessageCircle,
  ImagePlus,
  Users,
  Flag,
  ShieldCheck,
  Download,
  FileText,
  RotateCcw,
  UserX,
  Scale,
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

const fmtRelativo = (ts) => {
  const min = Math.floor((now() - ts) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} dia${d !== 1 ? "s" : ""}`;
  return fmtDate(ts);
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
  if (count >= 10) return { nivel: "ouro", label: "Selo ouro", desc: "10+ trabalhos concluídos" };
  if (count >= 5) return { nivel: "prata", label: "Selo prata", desc: "5+ trabalhos concluídos" };
  if (count >= 1) return { nivel: "bronze", label: "Selo bronze", desc: "1º trabalho concluído" };
  return null;
}

/* Cada usuário recebe uma matiz fixa derivada do nome (usada nos avatares) */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const MATIZES = [158, 212, 262, 18, 338, 190, 38, 235];
const matizDe = (nome) => MATIZES[hashStr(nome || "") % MATIZES.length];
const capaDe = (nome) => {
  const m = matizDe(nome);
  return `radial-gradient(120% 140% at 100% 0%, hsl(${(m + 28) % 360} 60% 46% / 0.55), transparent 55%), linear-gradient(135deg, hsl(${m} 48% 34%), hsl(${m} 52% 22%))`;
};

/* -------------------------------------------------------------------------
   Contato: WhatsApp e e-mail, liberados só entre quem tem contratação
------------------------------------------------------------------------- */

const soDigitos = (v) => (v || "").replace(/\D/g, "");

function mascaraTelefone(v) {
  const d = soDigitos(v).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const telefoneValido = (v) => {
  const d = soDigitos(v);
  return d.length === 10 || d.length === 11;
};
const emailValido = (v) => /^\S+@\S+\.\S+$/.test(v);
const waLink = (digitos, mensagem) => `https://wa.me/55${soDigitos(digitos)}?text=${encodeURIComponent(mensagem)}`;

// Valida e normaliza o contato (o mesmo código deve rodar no backend)
function validarContato(c) {
  const erros = {};
  const valores = { whatsapp: soDigitos(c.whatsapp), emailContato: (c.emailContato || "").trim() };
  if (valores.whatsapp && !telefoneValido(valores.whatsapp)) erros.whatsapp = "Informe DDD e número, ex: (15) 99999-9999.";
  if (valores.emailContato && !emailValido(valores.emailContato)) erros.emailContato = "Informe um e-mail válido.";
  return { erros, valores };
}

const contatoInicial = (u) => ({ whatsapp: mascaraTelefone(u.whatsapp || ""), emailContato: u.emailContato || "" });

// Existe contratação em andamento ou concluída entre as duas contas (em qualquer direção)?
function temContratoEntre(aId, bId, demandas, propostas) {
  return demandas.some((d) => {
    if (!d.propostaAceitaId) return false;
    if (d.status !== STATUS.EM_ANDAMENTO && d.status !== STATUS.CONCLUIDA) return false;
    const p = propostas.find((x) => x.id === d.propostaAceitaId);
    if (!p) return false;
    return (d.negocioId === aId && p.freelancerId === bId) || (d.negocioId === bId && p.freelancerId === aId);
  });
}

// Regra de privacidade: o dono sempre vê; os demais só com contratação entre as duas contas
function podeVerContato(viewer, dono, demandas, propostas) {
  if (!viewer || !dono) return false;
  if (viewer.id === dono.id) return true;
  return temContratoEntre(viewer.id, dono.id, demandas, propostas);
}

function listaContatos(u) {
  const itens = [];
  if (u.whatsapp) {
    itens.push({ key: "whatsapp", texto: mascaraTelefone(u.whatsapp), href: waLink(u.whatsapp, `Olá, ${u.nome}! Falo pela ConectaDigital, sobre a nossa contratação.`) });
  }
  if (u.emailContato) itens.push({ key: "email", texto: u.emailContato, href: `mailto:${u.emailContato}` });
  return itens;
}


/* ---------- Imagens: leitura, validação e compressão no navegador ---------- */

const MAX_FOTOS = 4;
const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];

function lerImagem(file, { max = 1280, qualidade = 0.82, quadrado = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !TIPOS_IMAGEM.includes(file.type)) {
      reject(new Error("Formato não aceito. Envie imagens JPG, PNG ou WebP."));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("Imagem muito grande. O limite é de 12 MB por foto."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;
      if (quadrado) {
        const lado = Math.min(sw, sh);
        sx = (sw - lado) / 2;
        sy = (sh - lado) / 2;
        sw = lado;
        sh = lado;
      }
      const escala = Math.min(1, max / Math.max(sw, sh));
      const w = Math.max(1, Math.round(sw * escala));
      const h = Math.max(1, Math.round(sh * escala));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const c = canvas.getContext("2d");
      c.fillStyle = "#fff";
      c.fillRect(0, 0, w, h);
      c.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", qualidade));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível abrir essa imagem."));
    };
    img.src = url;
  });
}

/* -------------------------------------------------------------------------
   Dados iniciais (seed) — simula um marketplace já com alguma atividade,
   para que o fluxo possa ser testado dos dois lados desde o primeiro acesso.
------------------------------------------------------------------------- */

/* Datas relativas a "agora": a base sempre parece recente, não importa quando for aberta. */
const DIA = 1000 * 60 * 60 * 24;
const atras = (dias) => now() - Math.round(dias * DIA);
const dataStr = (ts) => new Date(ts).toISOString().slice(0, 10);

const negId = (n) => `u_negocio_${n}`;
const freId = (n) => `u_free_${n}`;

function neg(n, nome, email, setor, descricaoNegocio, localizacao, dias) {
  return {
    id: negId(n),
    tipo: "negocio",
    nome,
    email,
    senha: "123456",
    setor,
    descricaoNegocio,
    localizacao,
    fotoUrl: "",
    criadoEm: atras(dias),
  };
}

function fre(n, nome, email, especialidade, descricaoFreelancer, faixaPreco, localizacao, formacao, dias) {
  return {
    id: freId(n),
    tipo: "freelancer",
    nome,
    email,
    senha: "123456",
    especialidade,
    descricaoFreelancer,
    faixaPreco,
    localizacao,
    fotoUrl: "",
    formacao: formacao.map(([titulo, instituicao, ano], i) => ({ id: `f_${n}_${i + 1}`, titulo, instituicao, ano })),
    criadoEm: atras(dias),
  };
}

/* ------------------------------ Negócios ------------------------------ */

const seedNegocios = [
  neg(1, "Padaria Trigo Nosso", "contato@trigonosso.com.br", "Alimentação", "Padaria de bairro em Sorocaba, aberta há 12 anos, buscando modernizar o atendimento e a presença digital.", "Centro, Sorocaba - SP", 280),
  neg(2, "Studio Vitta Pilates", "contato@vittapilates.com.br", "Saúde e Bem-estar", "Estúdio de pilates com duas unidades em Sorocaba, foco em atendimento personalizado.", "Campolim, Sorocaba - SP", 250),
  neg(3, "Clínica Odonto Sorriso", "contato@odontosorriso.com.br", "Saúde", "Clínica odontológica familiar com cinco consultórios, atendimento por convênios e particular.", "Jardim Paulistano, Sorocaba - SP", 210),
  neg(4, "Pet Shop Amigo Fiel", "contato@amigofielpet.com.br", "Pet", "Banho e tosa, ração e acessórios. Atendemos a vizinhança há 8 anos.", "Vila Hortência, Sorocaba - SP", 220),
  neg(5, "Barbearia Dom Navalha", "contato@domnavalha.com.br", "Beleza", "Barbearia clássica com atendimento por agendamento e clube de assinatura.", "Centro, Sorocaba - SP", 230),
  neg(6, "Café Grão & Prosa", "contato@graoeprosa.com.br", "Alimentação", "Cafeteria de especialidade com salgados artesanais e espaço para coworking.", "Santa Rosália, Sorocaba - SP", 200),
  neg(7, "Oficina Irmãos Silva", "contato@oficinairmaossilva.com.br", "Automotivo", "Oficina mecânica multimarcas com mais de 20 anos de tradição na cidade.", "Éden, Sorocaba - SP", 130),
  neg(8, "Boutique Flor de Lis", "contato@flordelisboutique.com.br", "Moda", "Moda feminina casual e festa, com peças selecionadas de pequenos ateliês.", "Jardim Europa, Sorocaba - SP", 200),
  neg(9, "Academia Corpo em Movimento", "contato@corpoemmovimento.com.br", "Fitness", "Academia de bairro com musculação, treino funcional e aulas em grupo.", "Alto da Boa Vista, Sorocaba - SP", 150),
  neg(10, "Imobiliária Casa Nova", "contato@casanovaimoveis.com.br", "Imobiliário", "Imobiliária focada em aluguel e venda de imóveis residenciais na região de Sorocaba.", "Campolim, Sorocaba - SP", 220),
  neg(11, "Escola de Idiomas Fluent", "contato@fluentidiomas.com.br", "Educação", "Escola de inglês e espanhol com turmas pequenas e aulas particulares.", "Vila Carvalho, Sorocaba - SP", 140),
  neg(12, "Floricultura Jardim Encantado", "contato@jardimencantado.com.br", "Varejo", "Flores, arranjos e presentes para todas as ocasiões, com entrega na cidade.", "Mangal, Sorocaba - SP", 100),
  neg(13, "Hamburgueria Brasa Viva", "contato@brasaviva.com.br", "Alimentação", "Hambúrgueres artesanais com delivery próprio e salão para 40 pessoas.", "Wanel Ville, Sorocaba - SP", 150),
  neg(14, "Ótica Visão Clara", "contato@oticavisaoclara.com.br", "Varejo", "Ótica com armações nacionais e importadas, exame de vista e conserto no balcão.", "Centro, Sorocaba - SP", 5),
  neg(15, "Papelaria Cores & Letras", "contato@coreseletras.com.br", "Varejo", "Papelaria, material escolar e presentes criativos, com atendimento para empresas.", "Jardim Simus, Sorocaba - SP", 100),
  neg(16, "Buffet Infantil Pula Pula", "contato@pulapula.com.br", "Eventos", "Buffet infantil com espaço próprio, brinquedoteca e pacotes completos de festa.", "Parque Campolim, Sorocaba - SP", 200),
];

/* ------------------------------ Freelancers ------------------------------ */

const seedFreelancers = [
  fre(1, "Marina Lopes", "marina.lopes@email.com", "Design", "Designer gráfica especializada em identidade visual para pequenos negócios locais.", "R$ 400 – R$ 1.500", "Centro, Sorocaba - SP", [["Design Gráfico", "Centro Universitário Facens", "2023"]], 300),
  fre(2, "Rafael Nogueira", "rafael.nog@email.com", "Desenvolvimento", "Desenvolvedor front-end, foco em sites institucionais e landing pages rápidas.", "R$ 800 – R$ 3.000", "Campolim, Sorocaba - SP", [["Análise e Desenvolvimento de Sistemas", "Centro Universitário Facens", "2024"]], 260),
  fre(3, "Camila Duarte", "camila.duarte@email.com", "Marketing Digital", "Gestão de redes sociais e tráfego pago para negócios locais em Sorocaba e região.", "R$ 500 – R$ 2.000", "Éden, Sorocaba - SP", [["Marketing Digital", "Centro Universitário Facens", "2022"], ["Certificado Google Ads – Pesquisa", "Google Skillshop", "2023"]], 240),
  fre(4, "Bruno Takahashi", "bruno.takahashi@email.com", "Fotografia", "Fotógrafo de produto e gastronomia. Estúdio próprio no Centro, entrega em até 5 dias.", "R$ 300 – R$ 1.200", "Centro, Sorocaba - SP", [["Fotografia", "Senac Sorocaba", "2021"]], 150),
  fre(5, "Larissa Menezes", "larissa.menezes@email.com", "Vídeo", "Videomaker e editora. Reels, institucionais curtos e cobertura de eventos.", "R$ 400 – R$ 2.500", "Jardim Paulistano, Sorocaba - SP", [["Publicidade e Propaganda", "Uniso", "2022"]], 200),
  fre(6, "Thiago Ferraz", "thiago.ferraz@email.com", "Contabilidade", "Contador com foco em MEI e Simples Nacional: abertura de empresa, guias mensais e planejamento tributário básico.", "R$ 250 – R$ 1.500", "Vila Hortência, Sorocaba - SP", [["Ciências Contábeis", "Unip Sorocaba", "2020"], ["CRC ativo", "Conselho Regional de Contabilidade", "2021"]], 200),
  fre(7, "Fernanda Oliveira", "fernanda.oliveira@email.com", "Redação", "Redatora e revisora. Textos para site, blog, e-mail marketing e legendas.", "R$ 150 – R$ 900", "Alto da Boa Vista, Sorocaba - SP", [["Letras", "Uniso", "2019"]], 140),
  fre(8, "Diego Martins", "diego.martins@email.com", "Tecnologia", "Suporte e infraestrutura para pequenas empresas: redes, Wi-Fi, backup, câmeras e automação de PDV.", "R$ 200 – R$ 2.000", "Éden, Sorocaba - SP", [["Engenharia de Computação", "Centro Universitário Facens", "2021"], ["Técnico em Redes", "Senac Sorocaba", "2018"]], 120),
  fre(9, "Patrícia Almeida", "patricia.almeida@email.com", "Administrativo", "Assistente administrativa remota: planilhas, organização de documentos, atendimento e rotinas financeiras.", "R$ 120 – R$ 800", "Santa Rosália, Sorocaba - SP", [["Administração", "Uniso", "2018"]], 100),
  fre(10, "Gustavo Rocha", "gustavo.rocha@email.com", "Consultoria", "Consultor de gestão para pequenos negócios: processos, precificação e planejamento de vendas.", "R$ 500 – R$ 3.000", "Campolim, Sorocaba - SP", [["Engenharia de Produção", "Centro Universitário Facens", "2017"], ["Gestão para pequenos negócios", "Sebrae", "2023"]], 140),
  fre(11, "Aline Souza", "aline.souza@email.com", "Eventos", "Cerimonialista e produtora de eventos corporativos e confraternizações.", "R$ 600 – R$ 4.000", "Jardim Europa, Sorocaba - SP", [["Eventos", "Senac Sorocaba", "2019"]], 120),
  fre(12, "Henrique Barbosa", "henrique.barbosa@email.com", "Desenvolvimento", "Dev full-stack: sistemas de agendamento, lojas virtuais e integrações com WhatsApp.", "R$ 1.200 – R$ 5.000", "Vila Carvalho, Sorocaba - SP", [["Engenharia de Computação", "Centro Universitário Facens", "2022"]], 250),
  fre(13, "Beatriz Campos", "beatriz.campos@email.com", "Design", "Designer de embalagens e materiais impressos: cardápios, rótulos e papelaria.", "R$ 250 – R$ 1.800", "Mangal, Sorocaba - SP", [["Design Gráfico", "Uniso", "2021"]], 160),
  fre(14, "Vinícius Lima", "vinicius.lima@email.com", "Marketing Digital", "Tráfego pago e Google Meu Negócio para comércio local, com foco em resultado mensurável.", "R$ 600 – R$ 2.500", "Wanel Ville, Sorocaba - SP", [["Gestão de Marketing", "Uniso", "2020"]], 120),
  fre(15, "Isabela Fontana", "isabela.fontana@email.com", "Fotografia", "Fotógrafa de eventos, retratos corporativos e ensaios de equipe.", "R$ 350 – R$ 1.500", "Jardim Simus, Sorocaba - SP", [["Fotografia", "Senac Sorocaba", "2020"]], 120),
  fre(16, "Mateus Carvalho", "mateus.carvalho@email.com", "Vídeo", "Motion designer e editor: vinhetas, anúncios curtos e vídeos explicativos animados.", "R$ 500 – R$ 3.000", "Parque Campolim, Sorocaba - SP", [["Produção Audiovisual", "Uniso", "2021"]], 100),
  fre(17, "Renata Gomes", "renata.gomes@email.com", "Redação", "Copywriter com experiência em e-commerce: descrições de produto, roteiros e SEO.", "R$ 200 – R$ 1.200", "Centro, Sorocaba - SP", [["Jornalismo", "Uniso", "2018"]], 110),
  fre(18, "Caio Andrade", "caio.andrade@email.com", "Tecnologia", "Automação com planilhas, dashboards e integrações no-code para a rotina de pequenas empresas.", "R$ 300 – R$ 1.800", "Vila Barcelona, Sorocaba - SP", [["Análise e Desenvolvimento de Sistemas", "Centro Universitário Facens", "2026 (cursando)"]], 80),
  fre(19, "Júlia Mendes", "julia.mendes@email.com", "Design", "Designer de interfaces: protótipos de apps e sites, revisão de usabilidade para comércio local.", "R$ 500 – R$ 2.500", "Éden, Sorocaba - SP", [["Design de Produto Digital", "Senac Sorocaba", "2023"], ["Google UX Design Certificate", "Coursera", "2024"]], 7),
  fre(20, "Eduardo Sanches", "eduardo.sanches@email.com", "Consultoria", "Planejamento financeiro e fluxo de caixa para pequenos negócios que querem entender para onde o dinheiro vai.", "R$ 400 – R$ 2.000", "Campolim, Sorocaba - SP", [["Ciências Econômicas", "Uniso", "2019"]], 9),
];

const seedUsers = [...seedNegocios, ...seedFreelancers];
/* Contatos fictícios de demonstração: o WhatsApp é propositalmente inválido (após o 9 vem 0000),
   para que nenhum link de exemplo chegue a uma pessoa real. */
seedUsers.forEach((u, i) => {
  u.whatsapp = `1590000${String(i + 1).padStart(4, "0")}`;
  u.emailContato = u.email;
});
const TODOS_IDS = seedUsers.map((u) => u.id);

/* ------------------------------ Demandas, propostas e avaliações ------------------------------ */

const seedDemandas = [];
const seedPropostas = [];
const seedAvaliacoes = [];
let _d = 0;
let _p = 0;
let _a = 0;

const DESC_PADRAO = {
  Design: "Criação e entrega de peças de design alinhadas à marca do negócio, com arquivos finais para uso digital e impresso.",
  "Marketing Digital": "Planejamento e execução de ações de marketing digital para o negócio, com acompanhamento de resultados.",
  Desenvolvimento: "Desenvolvimento de solução web sob medida para a rotina do negócio, com entrega testada e orientação de uso.",
  Fotografia: "Sessão fotográfica profissional com tratamento de imagem e entrega dos arquivos prontos para uso.",
  Vídeo: "Produção e edição de vídeo para divulgação do negócio nas redes sociais e no site.",
  Contabilidade: "Serviço contábil e orientação tributária para regularização e acompanhamento do negócio.",
  Administrativo: "Organização de rotinas administrativas, documentos e controles do negócio.",
  Consultoria: "Consultoria de gestão com diagnóstico, plano de ação e acompanhamento das primeiras etapas.",
  Eventos: "Planejamento e coordenação de evento, do cronograma à execução no dia.",
  Redação: "Produção de textos profissionais com revisão, no tom de voz do negócio.",
  Tecnologia: "Configuração e suporte de tecnologia para a operação do negócio.",
};

const MSG_VENCEDORA = [
  "Tenho experiência com esse tipo de projeto no comércio local e posso começar já. Alinho tudo por WhatsApp para agilizar.",
  "Posso entregar em etapas, com validação a cada passo, para você acompanhar o andamento.",
  "Já fiz projetos parecidos em Sorocaba e consigo manter o valor dentro do orçamento.",
  "Entendi bem a necessidade. Envio um rascunho inicial em poucos dias para alinharmos o rumo.",
  "Posso começar nesta semana e reservo horários fixos de acompanhamento até a entrega final.",
];
const MSG_PERDEDORA = [
  "Posso fazer com um escopo mais enxuto e custo menor, deixando extras para uma segunda fase.",
  "Tenho agenda livre e consigo entregar rápido, com uma rodada de ajustes incluída.",
  "Trabalho com esse formato há alguns anos e posso mostrar exemplos antes de começar.",
];

const COM_NEGOCIO = {
  5: [
    "Entregou tudo no prazo e entendeu muito bem o que o negócio precisava. Recontrataria sem pensar.",
    "Profissional atencioso, comunicação clara e resultado acima do esperado.",
    "Excelente trabalho! Fez perguntas certas no começo e o resultado final refletiu isso.",
    "Cumpriu o combinado, foi educado(a) com a equipe e ainda sugeriu melhorias que não tínhamos pensado.",
    "Muito bom contar com alguém da própria cidade: reunimos pessoalmente e tudo andou mais rápido.",
    "Qualidade profissional, preço justo e zero dor de cabeça. Já indiquei para outros comércios.",
    "Superou as expectativas. O resultado já está rendendo retorno para o negócio.",
    "Organizado(a), pontual e muito paciente(a) com os nossos pedidos de ajuste.",
  ],
  4: [
    "Bom trabalho e boa comunicação. Tivemos um pequeno atraso, mas o resultado final ficou ótimo.",
    "Entrega sólida. Poderia ter perguntado um pouco mais no começo, mas resolveu tudo com rapidez.",
    "Gostamos do resultado e recomendamos. Só faltou um pouco mais de agilidade nas primeiras respostas.",
  ],
};
const COM_FREELANCER = {
  5: [
    "Cliente muito claro no que queria e rápido para aprovar as etapas. Foi um prazer trabalhar.",
    "Comunicação ótima, pagamento em dia e respeito com o prazo combinado.",
    "Negócio organizado e aberto a sugestões. Gostaria de trabalhar de novo.",
    "Equipe educada e participativa durante todo o projeto.",
    "Briefing bem feito e feedback rápido, o que ajudou muito a entregar no prazo.",
  ],
  4: [
    "Boa experiência no geral. Algumas mudanças de escopo no meio do caminho, mas resolvemos numa boa conversa.",
    "Cliente simpático e correto. As aprovações demoraram um pouco mais do que o previsto.",
  ],
};

function addDemanda({ n, t, d, c, st = "CONCLUIDA", criado, prazo, props = [], win = 0, acc = 3, dur = 10, av = null, comN = null, comF = null }) {
  const dId = `d_${++_d}`;
  const criadoEm = atras(criado) - _d * 7 * 60 * 1000;
  const aceitaEm = criadoEm + acc * DIA;
  const concluidaEm = aceitaEm + dur * DIA;

  const lista = props.map((p) => ({ f: p[0], valor: p[1], dias: p[2], msg: p[3] }));

  // Em demandas concluídas, às vezes houve concorrência: uma proposta não selecionada
  if (st === "CONCLUIDA" && lista.length === 1 && _d % 2 === 0) {
    const vencedor = lista[0];
    const cat = seedFreelancers.filter((u) => u.especialidade === c && u.id !== freId(vencedor.f) && u.criadoEm < criadoEm);
    if (cat.length > 0) {
      const outro = cat[_d % cat.length];
      lista.push({
        f: Number(outro.id.replace("u_free_", "")),
        valor: Math.round((vencedor.valor * 1.15) / 10) * 10,
        dias: vencedor.dias + 3,
        msg: MSG_PERDEDORA[_d % MSG_PERDEDORA.length],
      });
    }
  }

  let propostaAceitaId = null;
  lista.forEach((p, k) => {
    const pId = `p_${++_p}`;
    const criadaProp = criadoEm + (k + 1) * 0.4 * DIA;
    const ganhou = st === "EM_ANDAMENTO" || st === "CONCLUIDA" ? k === win : false;
    if (ganhou) propostaAceitaId = pId;
    seedPropostas.push({
      id: pId,
      demandaId: dId,
      freelancerId: freId(p.f),
      valor: p.valor,
      prazo: dataStr(criadaProp + p.dias * DIA),
      mensagem: p.msg,
      status: st === "ABERTA" || st === "EM_ANALISE" ? "pendente" : ganhou ? "aceita" : "nao_selecionada",
      criadoEm: criadaProp,
    });
  });

  seedDemandas.push({
    id: dId,
    negocioId: negId(n),
    titulo: t,
    descricao: d || DESC_PADRAO[c],
    categoria: c,
    prazo: st === "CONCLUIDA" ? dataStr(concluidaEm + 2 * DIA) : dataStr(now() + prazo * DIA),
    status: st,
    criadoEm,
    aceitaEm: st === "EM_ANDAMENTO" || st === "CONCLUIDA" ? aceitaEm : null,
    concluidaEm: st === "CONCLUIDA" ? concluidaEm : null,
    propostaAceitaId,
  });

  if (st === "CONCLUIDA" && av && propostaAceitaId) {
    const vencedora = seedPropostas.find((p) => p.id === propostaAceitaId);
    const [notaN, notaF] = av;
    if (notaN) {
      _a++;
      const pool = COM_NEGOCIO[notaN];
      seedAvaliacoes.push({
        id: `a_${_a}`,
        demandaId: dId,
        deId: negId(n),
        paraId: vencedora.freelancerId,
        nota: notaN,
        comentario: comN || pool[_a % pool.length],
        criadoEm: concluidaEm + 0.5 * DIA,
      });
    }
    if (notaF) {
      _a++;
      const pool = COM_FREELANCER[notaF];
      seedAvaliacoes.push({
        id: `a_${_a}`,
        demandaId: dId,
        deId: vencedora.freelancerId,
        paraId: negId(n),
        nota: notaF,
        comentario: comF || pool[_a % pool.length],
        criadoEm: concluidaEm + 1 * DIA,
      });
    }
  }
}

/* --- Abertas (ainda sem propostas) --- */
addDemanda({ n: 3, t: "Fotos profissionais da equipe e da clínica", d: "Queremos renovar as fotos do site e das redes: retratos individuais da equipe e imagens dos consultórios e da recepção.", c: "Fotografia", st: "ABERTA", criado: 1, prazo: 20 });
addDemanda({ n: 5, t: "Cartão de visita e papelaria da barbearia", d: "Cartão de visita, cartão fidelidade e adesivos com a marca da barbearia, prontos para impressão.", c: "Design", st: "ABERTA", criado: 2, prazo: 18 });
addDemanda({ n: 9, t: "Campanha de matrículas para janeiro", d: "Planejamento e execução de uma campanha de captação de alunos para o início do ano, com anúncios locais e conteúdo para Instagram.", c: "Marketing Digital", st: "ABERTA", criado: 1.2, prazo: 45 });
addDemanda({ n: 14, t: "Site institucional com catálogo de armações", d: "Site simples com endereço, horários, WhatsApp e catálogo de armações com fotos, fácil de atualizar pela equipe.", c: "Desenvolvimento", st: "ABERTA", criado: 0.4, prazo: 40 });
addDemanda({ n: 16, t: "Vídeo promocional de 60 segundos do espaço", d: "Vídeo curto mostrando brinquedoteca, salão e uma festa em andamento, para usar no Instagram e no Google.", c: "Vídeo", st: "ABERTA", criado: 2.5, prazo: 30 });
addDemanda({ n: 11, t: "Artigos para o blog sobre aprendizado de idiomas", d: "Oito artigos de 600 a 800 palavras, com foco em dicas práticas para quem estuda inglês e espanhol e boa otimização para buscas.", c: "Redação", st: "ABERTA", criado: 3, prazo: 35 });
addDemanda({ n: 7, t: "Organização da planilha de ordens de serviço", d: "Hoje as ordens de serviço ficam espalhadas em planilhas e papéis. Precisamos de uma estrutura única, com status e histórico por veículo.", c: "Administrativo", st: "ABERTA", criado: 1.1, prazo: 14 });

/* --- Em análise (já recebendo propostas) --- */
addDemanda({ n: 1, t: "Cardápio digital com QR Code", d: "Precisamos de um cardápio digital acessível por QR code nas mesas, com fotos dos produtos e atualização fácil.", c: "Desenvolvimento", st: "EM_ANALISE", criado: 3, prazo: 5, props: [
  [2, 950, 7, "Posso entregar em WordPress com um painel simples para vocês editarem o cardápio sozinhos."],
  [12, 1400, 10, "Faço um cardápio web otimizado para celular, com painel de edição e integração com pedido por WhatsApp."],
  [18, 700, 8, "Estou em fase de estudo e entrego uma versão enxuta, com QR Code e atualização por planilha."],
] });
addDemanda({ n: 4, t: "Loja virtual com agendamento de banho e tosa", d: "Queremos vender ração e acessórios online e permitir que o cliente agende banho e tosa pelo site, com confirmação por WhatsApp.", c: "Desenvolvimento", st: "EM_ANALISE", criado: 6, prazo: 40, props: [
  [12, 3200, 30, "Posso montar loja virtual com agenda integrada, painel de pedidos e aviso por WhatsApp. Entrego em duas etapas."],
  [2, 2400, 28, "Consigo uma loja enxuta com pagamento online e formulário de agendamento. Atualizações simples pelo painel."],
] });
addDemanda({ n: 6, t: "Fotos do cardápio de verão e do ambiente", d: "Cerca de 25 fotos de bebidas geladas, salgados e do espaço, com luz natural, para cardápio e redes sociais.", c: "Fotografia", st: "EM_ANALISE", criado: 4, prazo: 15, props: [
  [4, 650, 5, "Já fotografei o espaço antes e conheço a luz do café. Faço sessão de 3 horas e entrego tratadas em 5 dias."],
  [15, 580, 6, "Faço sessão com estilização leve de bancada e entrego 30 fotos tratadas, otimizadas para cardápio digital."],
] });
addDemanda({ n: 8, t: "Gestão de Instagram e Reels da coleção de verão", d: "Calendário de conteúdo, 3 Reels por semana e stories de bastidores durante o lançamento da coleção de verão.", c: "Marketing Digital", st: "EM_ANALISE", criado: 5, prazo: 25, props: [
  [3, 1100, 30, "Já fiz o calendário de campanha de moda aqui na plataforma. Proponho 12 posts, 12 Reels e relatório mensal."],
  [14, 900, 30, "Foco em resultado: conteúdo e pequenos impulsionamentos para a vizinhança, com relatório simples de alcance."],
] });
addDemanda({ n: 12, t: "Ensaio fotográfico dos arranjos de Natal", d: "Fotografias de 15 arranjos e cestas de Natal para o catálogo digital e para as redes sociais, até a primeira semana de novembro.", c: "Fotografia", st: "EM_ANALISE", criado: 2, prazo: 22, props: [
  [15, 700, 6, "Ensaio em estúdio com fundo neutro e algumas fotos de contexto. Entrego em até 6 dias."],
  [4, 820, 5, "Trabalho com cenário temático e iluminação própria. Tudo tratado e pronto para catálogo."],
] });
addDemanda({ n: 10, t: "Revisão do fluxo de caixa e da política de comissões", d: "Mapear receitas e despesas do último ano, criar um fluxo de caixa mensal simples e revisar a política de comissões dos corretores.", c: "Consultoria", st: "EM_ANALISE", criado: 7, prazo: 35, props: [
  [10, 1800, 25, "Faço diagnóstico, planilha de fluxo de caixa e uma proposta de política de comissões. Três reuniões de 1h."],
  [20, 1500, 21, "Foco em clareza financeira: estruturo o fluxo de caixa e treino a equipe para manter tudo atualizado."],
] });
addDemanda({ n: 13, t: "Rótulos e embalagens para o delivery", d: "Adesivos de lacre, sacolas e caixas com a marca da hamburgueria, pensados para boa aparência nas fotos de delivery.", c: "Design", st: "EM_ANALISE", criado: 4, prazo: 28, props: [
  [13, 850, 12, "Já fiz o cardápio da casa e sigo a mesma linha visual. Entrego arquivos prontos para a gráfica."],
  [1, 1000, 15, "Crio a linha completa de embalagens e um manual rápido de uso da marca."],
  [19, 780, 14, "Proponho três direções visuais para vocês escolherem, com ajustes incluídos."],
] });
addDemanda({ n: 15, t: "Rede Wi-Fi e câmeras de segurança da loja", d: "Reorganizar a rede Wi-Fi, instalar 4 câmeras com gravação em nuvem e deixar o acesso remoto configurado no celular.", c: "Tecnologia", st: "EM_ANALISE", criado: 3, prazo: 20, props: [
  [8, 900, 7, "Faço visita técnica, instalo e configuro tudo no mesmo dia, com garantia de 90 dias."],
  [18, 650, 10, "Configuro rede e câmeras com equipamento que vocês já possuem, para reduzir custo."],
] });

/* --- Em andamento --- */
addDemanda({ n: 2, t: "Identidade visual para nova unidade", d: "Vamos abrir uma segunda unidade e precisamos adaptar a identidade visual atual: logo, paleta e materiais de recepção.", c: "Design", st: "EM_ANDAMENTO", criado: 10, acc: 4, prazo: 12, win: 0, props: [
  [1, 1200, 15, "Trabalho com identidade visual para negócios locais há 4 anos. Posso enviar um moodboard inicial em 3 dias."],
  [13, 1050, 18, "Posso adaptar a identidade atual e criar a sinalização da nova unidade com custo mais enxuto."],
] });
addDemanda({ n: 1, t: "Formulário de encomendas de bolos e salgados", d: "Formulário online para os clientes encomendarem bolos e salgados de festa, ligado a uma planilha, com aviso por WhatsApp.", c: "Desenvolvimento", st: "EM_ANDAMENTO", criado: 6, prazo: 9, win: 0, props: [
  [2, 800, 10, "Faço um formulário online ligado a uma planilha e aviso por WhatsApp quando entrar encomenda nova."],
] });
addDemanda({ n: 3, t: "Abertura da nova unidade e contabilidade mensal", d: "Abrir o CNPJ da nova unidade, regularizar alvarás e assumir a contabilidade mensal das duas unidades.", c: "Contabilidade", st: "EM_ANDAMENTO", criado: 11, prazo: 25, win: 0, props: [
  [6, 600, 30, "Cuido da abertura, alvarás e do fechamento mensal. Primeiro mês de acompanhamento incluso."],
  [9, 450, 30, "Posso apoiar na parte administrativa e documental enquanto vocês escolhem o contador."],
] });
addDemanda({ n: 9, t: "Vídeos curtos de treinos para redes sociais", d: "Seis vídeos de até 30 segundos mostrando treinos funcionais e a estrutura da academia, em formato vertical.", c: "Vídeo", st: "EM_ANDAMENTO", criado: 9, prazo: 8, win: 0, props: [
  [5, 1800, 14, "Gravo em uma manhã e edito com legendas e trilha licenciada. Entrego os seis vídeos em 14 dias."],
  [16, 1500, 16, "Edição com motion para dar mais energia aos vídeos. Posso gravar com meu equipamento."],
] });
addDemanda({ n: 16, t: "Organização da festa de 10 anos do buffet", d: "Planejamento e coordenação da festa de aniversário de 10 anos do buffet, com 120 convidados, atrações e decoração.", c: "Eventos", st: "EM_ANDAMENTO", criado: 12, prazo: 30, win: 0, props: [
  [11, 3500, 40, "Cuido do cronograma, fornecedores e do dia do evento. Reunião semanal para alinharmos cada detalhe."],
] });
addDemanda({ n: 11, t: "Sistema de matrícula e agendamento de aulas", d: "Sistema web para matrícula online, agendamento de aulas particulares e controle de presença por turma.", c: "Desenvolvimento", st: "EM_ANDAMENTO", criado: 14, prazo: 35, win: 0, props: [
  [12, 4200, 45, "Desenvolvo em etapas quinzenais, com painel administrativo e área do aluno. Já entreguei algo parecido para uma imobiliária."],
  [2, 3600, 40, "Posso entregar uma versão mais enxuta com matrícula e agenda, deixando presença para uma segunda fase."],
] });
addDemanda({ n: 6, t: "Textos para o cardápio e as redes sociais", d: "Descrições dos itens do cardápio e uma série de legendas para o Instagram com o tom leve e acolhedor do café.", c: "Redação", st: "EM_ANDAMENTO", criado: 8, prazo: 12, win: 0, props: [
  [7, 480, 10, "Escrevo com o tom do café, em duas rodadas de revisão. Já conheço o cardápio atual."],
  [17, 520, 10, "Foco em descrições que dão vontade de pedir, com palavras sensoriais e pouco clichê."],
] });

/* --- Concluídas: [negócio, título, categoria, freelancer, valor, criada há (dias), duração (dias), nota negócio→free, nota free→negócio, comentários opcionais] --- */
const concluidas = [
  // Marina Lopes (Design)
  [1, "Redesign da logo e da fachada da padaria", "Design", 1, 1100, 120, 25, 5, 5],
  [2, "Folder de planos e valores", "Design", 1, 450, 100, 8, 5, 4],
  [6, "Cardápio impresso e display de mesa", "Design", 1, 600, 90, 12, 5, 5],
  [8, "Etiquetas e tags da coleção de outono", "Design", 1, 380, 80, 7, 4, null],
  [12, "Cartão e embalagem para arranjos", "Design", 1, 520, 70, 10, 5, 5],
  [5, "Identidade visual da barbearia", "Design", 1, 1300, 150, 20, 5, 5],
  [1, "Banner digital da promoção de aniversário", "Design", 1, 350, 14, 5, null, null],
  // Camila Duarte (Marketing Digital)
  [1, "Gestão de Instagram por 1 mês", "Marketing Digital", 3, 700, 45, 28, 5, 5, "Camila entregou tudo no prazo e entendeu muito bem o tom da nossa padaria. Recontrataria sem pensar.", "Comunicação muito boa e feedback rápido durante todo o mês."],
  [2, "Campanha de matrículas de pilates", "Marketing Digital", 3, 900, 160, 30, 5, 5],
  [3, "Gestão de redes sociais por 2 meses", "Marketing Digital", 3, 1500, 170, 55, 5, 5],
  [4, "Tráfego pago para banho e tosa", "Marketing Digital", 3, 800, 140, 30, 4, 5],
  [5, "Calendário de conteúdo da barbearia", "Marketing Digital", 3, 650, 135, 25, 5, null],
  [6, "Campanha de inauguração do café", "Marketing Digital", 3, 1000, 125, 20, 5, 5],
  [8, "Campanha de Dia das Mães", "Marketing Digital", 3, 950, 155, 20, 5, 5],
  [9, "Desafio de 21 dias para engajar alunos", "Marketing Digital", 3, 800, 110, 25, 5, 4],
  [13, "Google Meu Negócio e anúncios locais", "Marketing Digital", 3, 600, 100, 15, 5, 5],
  [16, "Divulgação da temporada de festas", "Marketing Digital", 3, 700, 75, 20, 4, 5],
  // Rafael Nogueira (Desenvolvimento)
  [1, "Site institucional da padaria", "Desenvolvimento", 2, 1800, 130, 30, 5, 5],
  [7, "Landing page da oficina com botão de WhatsApp", "Desenvolvimento", 2, 900, 95, 12, 5, 5],
  [11, "Página de inscrição para aula experimental", "Desenvolvimento", 2, 700, 60, 9, 4, 5],
  [1, "Ajustes e correções no site da padaria", "Desenvolvimento", 2, 400, 13, 4, null, null],
  // Henrique Barbosa (Desenvolvimento)
  [10, "Sistema de simulação de aluguel e agendamento de visitas", "Desenvolvimento", 12, 3800, 140, 45, 5, 5],
  [2, "Sistema de agendamento de aulas de pilates", "Desenvolvimento", 12, 2900, 105, 38, 5, 4],
  // Fotografia
  [6, "Ensaio fotográfico do café", "Fotografia", 4, 600, 85, 6, 5, 5],
  [13, "Fotos dos hambúrgueres para o cardápio digital", "Fotografia", 4, 750, 65, 7, 5, 5],
  [1, "Fotos de produtos da padaria", "Fotografia", 4, 520, 50, 5, 4, 5],
  [9, "Retratos da equipe de professores", "Fotografia", 15, 800, 70, 8, 5, 5],
  [3, "Cobertura da inauguração da clínica", "Fotografia", 15, 950, 55, 3, 5, null],
  // Vídeo
  [16, "Vídeo de apresentação do buffet", "Vídeo", 5, 1600, 110, 21, 5, 5],
  [2, "Reels de depoimentos de alunas", "Vídeo", 5, 1100, 40, 15, 5, 4],
  [13, "Vinheta animada para o delivery", "Vídeo", 16, 800, 60, 10, 4, 5],
  // Contabilidade
  [2, "Orientação tributária e abertura de MEI", "Contabilidade", 6, 400, 125, 10, 5, 5],
  [8, "Enquadramento no Simples Nacional", "Contabilidade", 6, 650, 80, 14, 5, 5],
  // Redação
  [11, "Textos da página de matrícula", "Redação", 7, 450, 95, 7, 5, 5],
  [3, "Textos do site institucional da clínica", "Redação", 7, 600, 60, 10, 5, 5],
  [8, "Descrições de produtos do e-commerce", "Redação", 17, 700, 90, 14, 4, 5],
  // Tecnologia
  [7, "Rede Wi-Fi e câmeras da oficina", "Tecnologia", 8, 1200, 75, 6, 5, 5],
  [3, "Backup em nuvem e rede da clínica", "Tecnologia", 8, 800, 45, 5, 5, null],
  [15, "Dashboard de vendas em planilha", "Tecnologia", 18, 450, 50, 8, 5, 5],
  // Administrativo
  [10, "Organização e digitalização de contratos", "Administrativo", 9, 550, 60, 18, 5, 5],
  [7, "Planilha de controle de estoque de peças", "Administrativo", 9, 380, 35, 7, 5, 4],
  // Consultoria
  [8, "Precificação da coleção e cálculo de margem", "Consultoria", 10, 1500, 85, 20, 5, 5],
  [6, "Plano de vendas para eventos corporativos", "Consultoria", 10, 1200, 50, 15, 5, 5],
  // Eventos
  [9, "Evento de aniversário da academia", "Eventos", 11, 2100, 75, 20, 5, 5],
  [2, "Workshop de bem-estar para alunas", "Eventos", 11, 1500, 90, 14, 5, 5],
  // Design (outros)
  [13, "Cardápio impresso e adesivos de delivery", "Design", 13, 800, 105, 12, 5, 5],
  [15, "Sacolas e etiquetas personalizadas", "Design", 13, 900, 70, 15, 5, 5],
  // Marketing Digital (outros)
  [7, "Google Meu Negócio e anúncios locais da oficina", "Marketing Digital", 14, 700, 90, 20, 5, 5],
  [4, "Anúncios da promoção de aniversário do pet shop", "Marketing Digital", 14, 600, 55, 15, 4, 5],
];

concluidas.forEach(([n, t, c, f, valor, criado, dur, nN, nF, comN, comF]) => {
  addDemanda({
    n,
    t,
    c,
    criado,
    dur,
    props: [[f, valor, dur + 2, MSG_VENCEDORA[(_d + f) % MSG_VENCEDORA.length]]],
    av: nN || nF ? [nN, nF] : null,
    comN: comN || null,
    comF: comF || null,
  });
});

/* Imagens de exemplo dos posts: ilustrações abstratas geradas em SVG (não são fotos reais). */
function arteSvg(estilo, seed) {
  const h = (seed * 47) % 360;
  const c1 = `hsl(${h} 58% 62%)`;
  const c2 = `hsl(${(h + 40) % 360} 62% 44%)`;
  const c3 = `hsl(${(h + 200) % 360} 50% 90%)`;
  let corpo = "";
  switch (estilo) {
    case "design":
      corpo = `<rect width="800" height="600" fill="${c3}"/><circle cx="300" cy="300" r="190" fill="${c1}"/><rect x="330" y="150" width="320" height="300" rx="36" fill="${c2}" opacity=".85"/><circle cx="560" cy="430" r="90" fill="#fff" opacity=".92"/>`;
      break;
    case "foto":
      corpo = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c3}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="560" cy="190" r="70" fill="#fff" opacity=".92"/><path d="M0 430 Q200 330 400 420 T800 400 V600 H0Z" fill="${c2}"/><path d="M0 500 Q250 430 480 500 T800 480 V600 H0Z" fill="#0b0f14" opacity=".3"/>`;
      break;
    case "video":
      corpo = `<rect width="800" height="600" fill="hsl(${h} 35% 16%)"/><rect x="60" y="60" width="680" height="480" rx="24" fill="${c2}" opacity=".35"/><circle cx="400" cy="300" r="92" fill="#fff" opacity=".95"/><path d="M372 250 L372 350 L460 300Z" fill="${c2}"/>`;
      break;
    case "evento": {
      let pontos = "";
      for (let i = 0; i < 30; i++) {
        const x = (i * 97 + seed * 13) % 800;
        const y = (i * 61 + seed * 29) % 600;
        const r = 8 + ((i * 7) % 22);
        pontos += `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 3 === 0 ? c2 : i % 3 === 1 ? c1 : "#fff"}" opacity=".85"/>`;
      }
      corpo = `<rect width="800" height="600" fill="${c3}"/>${pontos}`;
      break;
    }
    case "retrato":
      corpo = `<rect width="800" height="600" fill="${c3}"/><circle cx="400" cy="240" r="110" fill="${c1}"/><path d="M170 600 Q400 320 630 600Z" fill="${c2}"/>`;
      break;
    default: {
      // cardápio: blocos de texto estilizados
      let linhas = "";
      for (let i = 0; i < 7; i++) {
        linhas += `<rect x="120" y="${120 + i * 56}" width="${260 + ((i * 53) % 200)}" height="18" rx="9" fill="${i % 3 === 0 ? c2 : c1}" opacity="${i % 3 === 0 ? 1 : 0.55}"/><rect x="600" y="${120 + i * 56}" width="80" height="18" rx="9" fill="${c2}" opacity=".7"/>`;
      }
      corpo = `<rect width="800" height="600" fill="${c3}"/><rect x="70" y="60" width="660" height="480" rx="28" fill="#fff" opacity=".85"/>${linhas}`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">${corpo}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}


/* ------------------------------ Posts do feed ------------------------------ */

function pickLikes(seed, qty, exclude) {
  const pool = TODOS_IDS.filter((id) => id !== exclude);
  const out = [];
  let s = seed * 9301 + 49297;
  while (out.length < Math.min(qty, pool.length)) {
    s = (s * 9301 + 49297) % 233280;
    const id = pool[s % pool.length];
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

const seedPosts = [];
function addPost(autorId, tipo, texto, dias, curtidas) {
  const n = seedPosts.length + 1;
  seedPosts.push({
    id: `post_${n}`,
    autorId,
    tipo,
    texto,
    criadoEm: atras(dias),
    curtidas: pickLikes(n, curtidas, autorId),
    imagens: [],
  });
}

addPost(negId(14), "procuro", "Acabamos de chegar à plataforma! Procuramos um desenvolvedor aqui de Sorocaba para fazer o site da ótica, com catálogo de armações. A demanda já está aberta.", 0.3, 4);
addPost(freId(1), "dica", "Dica para quem tem negócio local: antes de pedir um logo, junte 3 marcas que você admira e 3 que você não quer parecer. Isso economiza duas rodadas de ajustes e deixa o resultado muito mais a sua cara.", 0.4, 14);
addPost(negId(1), "novidade", "Pão de queijo novo na vitrine e cardápio digital a caminho! Se você é dev aqui em Sorocaba, a demanda já está aberta na plataforma.", 0.8, 11);
addPost(negId(7), "procuro", "A planilha de ordens de serviço da oficina virou bagunça. Preciso de alguém que organize isso com status e histórico por veículo. Quem faz?", 1.1, 6);
addPost(freId(3), "portfolio", "Fechamos o último mês de gestão do Instagram de uma padaria de bairro com bom aumento de alcance orgânico, só com calendário de conteúdo e stories de bastidores. O que mais funcionou: vídeo curto do pão saindo do forno.", 1.2, 18);
addPost(negId(6), "procuro", "Procurando fotógrafo(a) para as fotos do cardápio de verão do café. Já abrimos a demanda aqui, é só mandar proposta.", 1.5, 7);
addPost(freId(4), "dica", "Foto de comida: luz natural de janela, prato levemente inclinado e rapidez. A comida muda de cara em poucos minutos, então deixe tudo pronto antes de montar o prato.", 2, 12);
addPost(negId(11), "procuro", "Estamos reunindo ideias para um blog sobre aprendizado de idiomas e precisamos de redatores. Oito artigos, tema livre dentro de inglês e espanhol.", 2.5, 5);
addPost(freId(2), "dica", "Todo comércio devia ter pelo menos: um site simples com endereço e horário, botão de WhatsApp e perfil no Google Meu Negócio. Isso resolve boa parte da presença digital e custa pouco.", 3, 16);
addPost(negId(2), "novidade", "A segunda unidade do estúdio está em obras! Obrigada à Marina pela nova identidade visual: a recepção já está ganhando a cara da marca.", 3.2, 13);
addPost(freId(6), "dica", "MEI: o DAS vence todo dia 20. Quem esquece paga multa e juros e ainda pode perder benefícios previdenciários. Coloque um lembrete no celular hoje.", 4, 15);
addPost(negId(9), "novidade", "Os primeiros vídeos curtos do treino funcional já estão no ar! Valeu, Larissa, ficou com a energia que a gente queria.", 4.2, 9);
addPost(freId(5), "portfolio", "Primeiro lote de vídeos da Academia Corpo em Movimento entregue: vídeos verticais de 30 segundos para stories e reels, todos com legenda.", 4.5, 10);
addPost(negId(4), "procuro", "Queremos vender ração e acessórios online para a vizinhança. Já tem proposta de dev chegando, mas quem mais quiser participar é bem-vindo.", 5, 6);
addPost(freId(7), "dica", "Texto de site que vende começa pelo problema do cliente, não pela história da empresa. Ninguém quer saber há quanto tempo você existe antes de saber se você resolve o problema dele.", 5.5, 11);
addPost(negId(8), "novidade", "Nova coleção de verão chegando na Flor de Lis! Em breve, campanha nas redes e muitas novidades para o Natal.", 6, 8);
addPost(freId(19), "novidade", "Cheguei na ConectaDigital! Sou designer de interfaces e estou abrindo agenda para revisão de usabilidade de sites e apps de comércio local.", 6.5, 9);
addPost(freId(8), "dica", "Backup 3-2-1 para pequena empresa: 3 cópias, 2 mídias diferentes, 1 fora do local. Se o computador do caixa pifar hoje, você volta a operar amanhã?", 7, 13);
addPost(freId(10), "dica", "Precificação: se você calcula preço só somando custo e um pouquinho a mais, provavelmente perde margem. Comece pelo custo fixo por hora trabalhada.", 8, 12);
addPost(freId(20), "novidade", "Novo por aqui! Ajudo pequenos negócios a organizar o fluxo de caixa e entender para onde o dinheiro está indo. Agenda aberta para novembro.", 8.5, 7);
addPost(freId(11), "portfolio", "Confraternização de uma academia: 80 pessoas, 4 horas de evento e um único imprevisto (faltou gelo). Planejamento detalhado salva qualquer evento.", 9, 10);
addPost(negId(12), "novidade", "O Natal está chegando na Jardim Encantado: arranjos novos e cestas especiais. Estamos de olho em um fotógrafo para o catálogo.", 9.5, 6);
addPost(freId(13), "portfolio", "Cardápios de delivery novos para uma hamburgueria da cidade, com foco em hierarquia de informação e leitura rápida no celular.", 11, 9);
addPost(negId(13), "novidade", "Cardápio novo impresso e QR Code em todas as mesas. O delivery também agradece o visual novo nos adesivos.", 11.5, 8);
addPost(freId(14), "dica", "Google Meu Negócio é a vitrine mais barata do comércio local. Fotos atualizadas, horário correto e resposta às avaliações aumentam bastante as ligações.", 13, 14);
addPost(negId(16), "novidade", "Estamos organizando a festa de 10 anos do buffet com a Aline. Vem coisa boa por aí!", 14, 9);
addPost(freId(11), "dica", "Evento bom é evento com cronograma: horários de cada atração, responsável por fornecedor e plano B para chuva. O convidado não vê o trabalho, só o resultado.", 15, 8);
addPost(freId(15), "portfolio", "Retratos da equipe de professores de uma escola: fotos corporativas que não parecem de banco de imagem, com luz de janela e fundo neutro.", 16, 10);
addPost(freId(17), "dica", "Boa descrição de produto responde três perguntas: para que serve, de que é feito e por que é melhor que o concorrente. O resto é enfeite.", 18, 9);
addPost(negId(10), "novidade", "O sistema de agendamento de visitas reduziu bastante as faltas dos clientes. Recomendo contratar desenvolvedor local!", 19, 10);
addPost(freId(18), "novidade", "Estou cursando ADS na Facens e abrindo agenda para 2 projetos de automação de planilhas em novembro. Quem tem rotina manual repetitiva?", 20, 8);
addPost(freId(9), "dica", "Planilha de controle: uma aba por tema, cabeçalho fixo e nenhuma célula mesclada. Quem herdar a planilha depois agradece.", 22, 7);
addPost(freId(16), "portfolio", "Vinheta animada de 5 segundos para delivery. Pequenos detalhes de movimento fazem a marca parecer bem mais profissional.", 24, 7);
addPost(negId(5), "procuro", "Agenda de sábado lotada na barbearia. Se você faz sistema de agendamento simples e barato, me chama aqui.", 27, 5);
addPost(freId(12), "dica", "Antes de contratar um sistema, desenhe no papel as cinco telas que você mais usa no dia a dia. Isso vira o escopo do MVP e economiza meses.", 31, 12);


// Posts com fotos de exemplo (cobrem as grades de 1, 2, 3 e 4 imagens)
const IMAGENS_POSTS = {
  3: ["foto"],
  5: ["design", "cardapio"],
  7: ["foto", "foto"],
  10: ["design", "foto"],
  13: ["video", "video", "video"],
  21: ["evento", "evento", "foto", "evento"],
  22: ["foto", "evento"],
  23: ["cardapio", "cardapio", "design"],
  24: ["cardapio"],
  28: ["retrato", "retrato", "retrato", "retrato"],
  33: ["video"],
};
Object.entries(IMAGENS_POSTS).forEach(([n, estilos]) => {
  seedPosts[Number(n) - 1].imagens = estilos.map((e, i) => arteSvg(e, Number(n) * 7 + i * 3));
});

/* ------------------------------ Moderação (demonstração) ------------------------------ */

const seedAdmin = {
  id: "u_admin",
  tipo: "admin",
  nome: "Moderação ConectaDigital",
  email: "moderacao@conectadigital.demo",
  senha: "123456",
  fotoUrl: "",
  localizacao: "",
  criadoEm: atras(120),
};

const seedDenuncias = [
  { id: "den_1", tipo: "post", alvoId: "post_4", porId: freId(3), motivo: "Spam ou propaganda", detalhe: "Parece divulgação repetida de serviço, não é uma demanda real.", status: "aberta", criadoEm: atras(0.6) },
  { id: "den_2", tipo: "usuario", alvoId: freId(20), porId: negId(5), motivo: "Informação falsa ou perfil falso", detalhe: "", status: "aberta", criadoEm: atras(1.4) },
  { id: "den_3", tipo: "post", alvoId: "post_19", porId: negId(2), motivo: "Outro motivo", detalhe: "Achei o tom um pouco agressivo, mas talvez seja só o jeito dele escrever.", status: "dispensada", acao: "dispensar", criadoEm: atras(6), resolvidaEm: atras(5.5), resolvidaPor: "u_admin" },
];

/* -------------------------------------------------------------------------
   Estilos globais — tokens de design
------------------------------------------------------------------------- */

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Inter:wght@400;500;600;700&display=swap');

    .cd-root {
      --bg: #F4F5F7;
      --surface: #FFFFFF;
      --surface-2: #F8F9FA;
      --surface-hover: #EDEFF2;
      --border: #E2E5EA;
      --border-strong: #CBD1D9;
      --ink: #12151B;
      --ink-soft: #2B313C;
      --ink-muted: #545D6B;
      --ink-faint: #67707E;
      --accent: #17624D;
      --accent-hover: #0F4D3B;
      --accent-soft: #E2F0EA;
      --accent-deep: #0E3B2E;
      --amber: #94610F;
      --amber-soft: #FBF0DB;
      --star: #D9921C;
      --red: #B3342B;
      --red-soft: #FCEBE9;
      --radius-lg: 16px;
      --radius: 12px;
      --radius-sm: 9px;
      --radius-pill: 999px;
      --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.05);
      --shadow-md: 0 1px 2px rgba(16, 24, 40, 0.04), 0 10px 28px -12px rgba(16, 24, 40, 0.18);
      --font-display: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
      font-feature-settings: 'cv11', 'ss03';
      color: var(--ink);
      background: var(--bg);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    .cd-root * { box-sizing: border-box; }
    .cd-serif { font-family: var(--font-display); letter-spacing: -0.02em; }
    .cd-root h1, .cd-root h2, .cd-root h3, .cd-root p { margin: 0; }

    .cd-root button { font-family: inherit; cursor: pointer; }
    .cd-root input, .cd-root select, .cd-root textarea { font-family: inherit; font-size: 14.5px; color: var(--ink); }
    .cd-root ::placeholder { color: #8A93A0; }
    .cd-root a { color: inherit; text-decoration: none; }
    .cd-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .cd-root img { max-width: 100%; }

    .cd-skip { position: absolute; left: -9999px; top: 8px; z-index: 200; background: var(--ink); color: #fff; padding: 8px 14px; border-radius: var(--radius-sm); font-size: 13px; }
    .cd-skip:focus { left: 12px; }

    /* ---------- Botões ---------- */
    .cd-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      border-radius: var(--radius-sm); border: 1px solid transparent;
      padding: 10px 18px; font-size: 14px; font-weight: 600; line-height: 1.2;
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease;
      white-space: nowrap; text-decoration: none;
    }
    .cd-btn:active:not(:disabled) { transform: translateY(1px); }
    .cd-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .cd-btn-primary { background: var(--accent); color: #fff; box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 2px rgba(16,24,40,0.2); }
    .cd-btn-primary:not(:disabled):hover { background: var(--accent-hover); }
    .cd-btn-secondary { background: var(--surface); color: var(--ink); border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
    .cd-btn-secondary:not(:disabled):hover { background: var(--surface-2); border-color: #B7BEC8; }
    .cd-btn-ghost { background: transparent; color: var(--ink-muted); }
    .cd-btn-ghost:not(:disabled):hover { background: var(--surface-hover); color: var(--ink); }
    .cd-btn-danger { background: transparent; color: var(--red); border-color: #EBC5C1; }
    .cd-btn-danger:hover { background: var(--red-soft); }
    .cd-btn-sm { padding: 7px 13px; font-size: 13px; }
    .cd-btn-icon { padding: 8px; }
    .cd-btn-full { width: 100%; }

    /* ---------- Formulários ---------- */
    .cd-input, .cd-select, .cd-textarea {
      width: 100%; background: var(--surface); border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm); padding: 10px 13px; outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .cd-input, .cd-select { min-height: 42px; }
    .cd-select {
      appearance: none; -webkit-appearance: none; padding-right: 36px; cursor: pointer;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23545D6B' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>");
      background-repeat: no-repeat; background-position: right 12px center;
    }
    .cd-input:focus, .cd-select:focus, .cd-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .cd-textarea { resize: vertical; min-height: 90px; line-height: 1.55; }
    .cd-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .cd-label { font-size: 13.5px; font-weight: 600; color: var(--ink-soft); }
    .cd-hint { font-size: 12.5px; color: var(--ink-faint); line-height: 1.45; }
    .cd-error { font-size: 12.5px; color: var(--red); font-weight: 500; }
    .cd-input-error { border-color: var(--red) !important; }
    .cd-input-error:focus { box-shadow: 0 0 0 3px var(--red-soft) !important; }

    .cd-switch-row {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-2); cursor: pointer;
    }
    .cd-switch-row strong { display: block; font-size: 14px; font-weight: 600; }
    .cd-switch-row small { display: block; font-size: 12.5px; color: var(--ink-faint); margin-top: 2px; line-height: 1.4; }
    .cd-switch { position: relative; flex-shrink: 0; width: 42px; height: 24px; }
    .cd-switch input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
    .cd-switch-track { position: absolute; inset: 0; border-radius: var(--radius-pill); background: #C3C9D2; transition: background-color 0.18s ease; pointer-events: none; }
    .cd-switch-track::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(16,24,40,0.3); transition: transform 0.18s ease; }
    .cd-switch input:checked + .cd-switch-track { background: var(--accent); }
    .cd-switch input:checked + .cd-switch-track::after { transform: translateX(18px); }
    .cd-switch input:focus-visible + .cd-switch-track { outline: 2px solid var(--accent); outline-offset: 2px; }

    /* ---------- Superfícies ---------- */
    .cd-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
      padding: 20px; box-shadow: var(--shadow-sm);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .cd-card-hover { cursor: pointer; }
    .cd-card-hover:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
    .cd-section-title { font-size: 13px; font-weight: 600; color: var(--ink-muted); margin-bottom: 10px; }
    .cd-h2 { font-family: var(--font-display); font-size: 19px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 14px; }
    .cd-block { margin-top: 28px; }

    .cd-badge {
      display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 600;
      padding: 4px 11px; border-radius: var(--radius-pill); line-height: 1.4;
    }
    .cd-badge-neutral { background: #ECEEF1; color: var(--ink-muted); }
    .cd-badge-amber { background: var(--amber-soft); color: var(--amber); }
    .cd-badge-accent { background: var(--accent-soft); color: var(--accent); }
    .cd-badge-dark { background: var(--ink); color: #fff; }
    .cd-selo-bronze { background: #F6E7DB; color: #85481C; }
    .cd-selo-prata { background: #E7EAEE; color: #3F4753; }
    .cd-selo-ouro { background: #FBEDC4; color: #7C5200; }

    /* ---------- Estrutura ---------- */
    .cd-shell { display: flex; min-height: 100vh; }
    .cd-sidebar {
      width: 264px; flex-shrink: 0; border-right: 1px solid var(--border); background: var(--surface);
      display: flex; flex-direction: column; padding: 26px 16px 18px; position: sticky; top: 0; height: 100vh;
    }
    .cd-sidebar-brand { padding: 2px 10px 30px; }
    .cd-nav { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .cd-nav-item {
      display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 12px; text-align: left;
      border: 0; background: transparent; border-radius: var(--radius-sm);
      font-size: 14.5px; font-weight: 500; color: var(--ink-muted);
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .cd-nav-item:hover { background: var(--surface-hover); color: var(--ink); }
    .cd-nav-item.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
    .cd-sidebar-user { display: flex; align-items: center; gap: 6px; padding-top: 14px; border-top: 1px solid var(--border); }
    .cd-user-chip {
      flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 6px; text-align: left;
      border: 0; background: transparent; border-radius: var(--radius-sm); transition: background-color 0.15s ease;
    }
    .cd-user-chip:hover { background: var(--surface-hover); }
    .cd-user-chip strong { display: block; font-size: 13.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cd-user-chip small { display: block; font-size: 12px; color: var(--ink-faint); }
    .cd-user-chip > span { min-width: 0; }

    .cd-content { flex: 1; min-width: 0; }
    .cd-main { width: 100%; max-width: 1100px; margin: 0 auto; padding: 40px 44px 80px; }

    .cd-topbar-mobile {
      display: none; align-items: center; justify-content: space-between; padding: 12px 16px;
      background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 30;
    }
    .cd-bottomnav {
      display: none; position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
      background: rgba(255,255,255,0.94); backdrop-filter: blur(14px); border-top: 1px solid var(--border);
      padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
    }
    .cd-bn-item {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 7px 4px;
      border: 0; background: none; border-radius: 10px; font-size: 11px; font-weight: 500; color: var(--ink-muted);
    }
    .cd-bn-item.active { color: var(--accent); font-weight: 600; }

    @media (max-width: 860px) {
      .cd-sidebar { display: none; }
      .cd-topbar-mobile { display: flex; }
      .cd-bottomnav { display: flex; }
      .cd-main { padding: 22px 16px calc(100px + env(safe-area-inset-bottom)); }
    }

    .cd-feed-layout { display: grid; grid-template-columns: minmax(0, 640px) 292px; gap: 32px; align-items: start; }
    .cd-aside { position: sticky; top: 28px; display: flex; flex-direction: column; gap: 16px; }
    @media (max-width: 1300px) {
      .cd-feed-layout { grid-template-columns: minmax(0, 640px); }
      .cd-aside { display: none; }
    }
    .cd-narrow { max-width: 680px; }
    .cd-aside .cd-card { padding: 16px; }
    .cd-aside-title { font-size: 13.5px; font-weight: 600; margin-bottom: 10px; color: var(--ink-soft); }
    .cd-mini-row {
      display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px; margin: 0 -8px; text-align: left;
      border: 0; background: transparent; border-radius: var(--radius-sm); transition: background-color 0.15s ease;
    }
    button.cd-mini-row:hover { background: var(--surface-hover); }
    .cd-mini-row > span { min-width: 0; flex: 1; }
    .cd-mini-row strong { display: block; font-size: 13.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cd-mini-row small { display: block; font-size: 12px; color: var(--ink-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* ---------- Avatar, logo ---------- */
    .cd-avatar {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;
      font-family: var(--font-display); font-weight: 600; letter-spacing: 0;
    }
    .cd-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .cd-logo { display: inline-flex; align-items: center; gap: 9px; }
    .cd-logo-text { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
    .cd-logo-text span { font-weight: 500; }
    .cd-logo-claro .cd-logo-mark span:first-child { border-color: #8BE0BF; }
    .cd-logo-claro .cd-logo-mark span:last-child { border-color: #fff; opacity: 0.6; }
    .cd-logo-mark { position: relative; width: 1.45em; height: 1.45em; flex-shrink: 0; }
    .cd-logo-mark span { position: absolute; width: 0.95em; height: 0.95em; border-radius: 50%; border: 0.2em solid var(--accent); }
    .cd-logo-mark span:first-child { left: 0; top: 0; }
    .cd-logo-mark span:last-child { right: 0; bottom: 0; border-color: var(--accent-deep); opacity: 0.55; }

    /* ---------- Navegação por abas ---------- */
    .cd-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
    .cd-tab {
      padding: 10px 2px; margin-right: 22px; font-size: 14.5px; font-weight: 500; background: none; border: 0;
      color: var(--ink-muted); border-bottom: 2px solid transparent; margin-bottom: -1px;
    }
    .cd-tab:hover { color: var(--ink); }
    .cd-tab.active { color: var(--ink); border-bottom-color: var(--accent); font-weight: 600; }

    /* ---------- Estados ---------- */
    .cd-empty {
      display: flex; flex-direction: column; align-items: center; text-align: center; padding: 48px 24px;
      border: 1px dashed var(--border-strong); border-radius: var(--radius-lg); color: var(--ink-muted); background: var(--surface);
    }
    .cd-empty-icon { width: 48px; height: 48px; border-radius: 50%; background: var(--surface-hover); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; color: var(--ink-faint); }
    .cd-skeleton {
      background: linear-gradient(90deg, #ECEEF1 25%, #F6F7F8 37%, #ECEEF1 63%);
      background-size: 400% 100%; animation: cd-shimmer 1.4s ease infinite; border-radius: var(--radius-sm);
    }
    @keyframes cd-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
    .cd-fade-in { animation: cd-page 0.45s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
    @keyframes cd-page { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    @keyframes cd-fade { from { opacity: 0; } to { opacity: 1; } }
    .cd-star-row { display: inline-flex; gap: 2px; }
    .cd-star-btn { background: none; border: none; padding: 2px; line-height: 0; border-radius: 6px; }

    /* ---------- Modal, toast, lightbox ---------- */
    .cd-modal-overlay {
      position: fixed; inset: 0; background: rgba(16,20,28,0.5); backdrop-filter: blur(3px);
      display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 60;
    }
    .cd-modal-overlay { animation: cd-fade 0.2s ease; }
    .cd-modal { animation: cd-pop 0.3s cubic-bezier(0.34, 1.4, 0.64, 1) both; }
    .cd-modal { background: var(--surface); border-radius: 18px; padding: 28px; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 64px -16px rgba(16,24,40,0.4); }
    .cd-toast {
      position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 80;
      display: flex; align-items: center; gap: 9px; background: var(--ink); color: #fff;
      padding: 11px 18px; border-radius: var(--radius-pill); font-size: 14px; font-weight: 500; box-shadow: var(--shadow-md);
      animation: cd-toast-in 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) both;
    }
    @keyframes cd-toast-in { from { opacity: 0; transform: translate(-50%, 18px) scale(0.96); } to { opacity: 1; transform: translate(-50%, 0); } }
    @media (max-width: 860px) { .cd-toast { bottom: calc(86px + env(safe-area-inset-bottom)); } }

    .cd-lightbox { position: fixed; inset: 0; z-index: 90; background: rgba(8,10,14,0.94); display: flex; align-items: center; justify-content: center; padding: 56px 64px; animation: cd-fade 0.18s ease; }
    .cd-lightbox > img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .cd-lb-btn { position: absolute; width: 42px; height: 42px; border-radius: 50%; border: 0; background: rgba(255,255,255,0.12); color: #fff; display: flex; align-items: center; justify-content: center; transition: background-color 0.15s ease; }
    .cd-lb-btn:hover { background: rgba(255,255,255,0.24); }
    .cd-lb-close { top: 16px; right: 16px; }
    .cd-lb-prev { left: 16px; top: 50%; transform: translateY(-50%); }
    .cd-lb-next { right: 16px; top: 50%; transform: translateY(-50%); }
    .cd-lb-count { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 500; }
    @media (max-width: 600px) { .cd-lightbox { padding: 64px 8px 56px; } .cd-lb-prev { left: 8px; } .cd-lb-next { right: 8px; } }

    /* ---------- Feed ---------- */
    .cd-link { cursor: pointer; font-weight: 600; transition: color 0.15s ease; border-radius: 4px; }
    .cd-link:hover { color: var(--accent); }
    .cd-feed-icon { width: 34px; height: 34px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cd-like-btn {
      display: inline-flex; align-items: center; gap: 6px; background: transparent; border: none; border-radius: var(--radius-pill);
      padding: 6px 10px; font-size: 13px; font-weight: 500; color: var(--ink-muted); transition: background-color 0.15s ease, color 0.15s ease;
    }
    .cd-like-btn:hover { background: var(--surface-hover); color: var(--ink); }
    .cd-like-btn.liked { color: var(--red); }

    .cd-thumbs { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .cd-thumb { position: relative; width: 76px; height: 76px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); background: var(--surface-hover); }
    .cd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .cd-thumb button {
      position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; border: 0; padding: 0;
      background: rgba(16,20,28,0.72); color: #fff; display: flex; align-items: center; justify-content: center;
    }
    .cd-thumb button:hover { background: rgba(16,20,28,0.9); }

    .cd-photos { display: grid; gap: 4px; border-radius: var(--radius); overflow: hidden; margin-top: 12px; }
    .cd-photos.n1 { grid-template-columns: 1fr; }
    .cd-photos.n2, .cd-photos.n4 { grid-template-columns: 1fr 1fr; }
    .cd-photos.n3 { grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr; height: clamp(220px, 46vw, 320px); }
    .cd-photo { position: relative; padding: 0; border: 0; background: var(--surface-hover); cursor: zoom-in; overflow: hidden; aspect-ratio: 4 / 3; display: block; }
    .cd-photos.n1 .cd-photo { aspect-ratio: 16 / 10; }
    .cd-photos.n3 .cd-photo { aspect-ratio: auto; }
    .cd-photos.n3 .cd-photo:first-child { grid-row: span 2; }
    .cd-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }
    .cd-photo:hover img { transform: scale(1.03); }

    .cd-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 6px; }
    .cd-gal-item { padding: 0; border: 0; border-radius: 10px; overflow: hidden; aspect-ratio: 1; background: var(--surface-hover); cursor: zoom-in; }
    .cd-gal-item img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }
    .cd-gal-item:hover img { transform: scale(1.05); }

    /* ---------- Perfil ---------- */
    .cd-profile { padding: 0; overflow: hidden; }
    .cd-cover { height: 116px; }
    .cd-profile-body { padding: 0 26px 26px; }
    .cd-profile-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-top: -46px; flex-wrap: wrap; }
    .cd-profile-avatar { border: 4px solid var(--surface); background: var(--surface); }
    .cd-profile-actions { display: flex; gap: 6px; padding-bottom: 4px; }
    .cd-profile-name { font-family: var(--font-display); font-size: 28px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; margin-top: 14px; }
    .cd-profile-sub { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 14px; margin-top: 6px; font-size: 14px; color: var(--ink-muted); }
    .cd-profile-sub svg { vertical-align: -2px; }
    .cd-profile-bio { font-size: 15px; line-height: 1.65; margin-top: 16px; color: var(--ink-soft); }
    .cd-profile-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
    .cd-stats { display: grid; grid-template-columns: repeat(3, 1fr); margin: 22px 0 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
    .cd-stats > div { padding: 0 16px; border-left: 1px solid var(--border); }
    .cd-stats > div:first-child { padding-left: 0; border-left: 0; }
    .cd-stats dt { font-size: 12.5px; color: var(--ink-faint); margin-bottom: 4px; }
    .cd-stats dd { margin: 0; font-family: var(--font-display); font-size: 20px; font-weight: 600; letter-spacing: -0.02em; display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
    .cd-stats dd small { font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 500; color: var(--ink-faint); letter-spacing: 0; }
    .cd-profile-section { margin-top: 22px; }
    @media (max-width: 560px) {
      .cd-profile-body { padding: 0 18px 20px; }
      .cd-stats { grid-template-columns: 1fr 1fr; row-gap: 14px; }
      .cd-stats > div:nth-child(3) { padding-left: 0; border-left: 0; grid-column: 1 / -1; }
    }

    .cd-contact-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .cd-contact-btn {
      display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-pill);
      border: 1px solid var(--border-strong); background: var(--surface); font-size: 13.5px; font-weight: 500;
      transition: background-color 0.15s ease, border-color 0.15s ease; max-width: 100%;
    }
    .cd-contact-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cd-contact-btn:hover { background: var(--surface-2); border-color: #B7BEC8; }
    .cd-contact-btn.whatsapp { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }
    .cd-contact-btn.whatsapp:hover { background: var(--accent-hover); }
    .cd-contact-meta { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; font-size: 13.5px; color: var(--ink-soft); }
    .cd-contact-meta > div { display: flex; align-items: flex-start; gap: 9px; line-height: 1.45; }
    .cd-contact-meta svg { flex-shrink: 0; margin-top: 2px; color: var(--ink-faint); }
    .cd-contact-meta a { text-decoration: underline; text-underline-offset: 2px; text-decoration-color: var(--border-strong); }
    .cd-contact-locked { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: var(--radius); background: var(--surface-2); border: 1px dashed var(--border-strong); font-size: 13.5px; color: var(--ink-muted); line-height: 1.5; }
    .cd-contact-locked svg { flex-shrink: 0; margin-top: 2px; }
    .cd-person { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }

    .cd-choice { display: block; width: 100%; text-align: left; padding: 14px; border-radius: var(--radius); border: 1px solid var(--border-strong); background: var(--surface); transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease; }
    .cd-choice:hover { border-color: #B7BEC8; }
    .cd-choice[aria-pressed='true'] { border-color: var(--accent); background: var(--accent-soft); box-shadow: 0 0 0 3px rgba(23,98,77,0.12); }

    /* ---------- Entrar / cadastro ---------- */
    .cd-auth { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); min-height: 100vh; }
    .cd-auth-brand { background: var(--accent-deep); color: #fff; padding: 52px 56px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .cd-auth-brand::after { content: ''; position: absolute; width: 560px; height: 560px; right: -220px; bottom: -220px; border-radius: 50%; border: 56px solid rgba(139,224,191,0.08); pointer-events: none; }
    .cd-auth-headline { font-family: var(--font-display); font-size: clamp(34px, 4vw, 52px); font-weight: 700; letter-spacing: -0.035em; line-height: 1.04; max-width: 520px; }
    .cd-auth-lead { margin-top: 18px; font-size: 16.5px; line-height: 1.6; color: rgba(255,255,255,0.78); max-width: 460px; }
    .cd-auth-points { margin: 34px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 16px; max-width: 460px; position: relative; z-index: 1; }
    .cd-auth-points li { display: flex; gap: 12px; font-size: 14.5px; line-height: 1.5; color: rgba(255,255,255,0.88); }
    .cd-auth-points svg { flex-shrink: 0; margin-top: 2px; color: #8BE0BF; }
    .cd-auth-form-wrap { display: flex; align-items: center; justify-content: center; padding: 32px 24px; }
    @media (max-width: 900px) {
      .cd-auth { grid-template-columns: 1fr; }
      .cd-auth-brand { padding: 24px 22px 28px; }
      .cd-auth-headline { font-size: 28px; margin-top: 22px; }
      .cd-auth-lead, .cd-auth-points { display: none; }
      .cd-auth-brand::after { display: none; }
    }

    /* ---------- Movimento ---------- */
    @keyframes cd-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    @keyframes cd-pop { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: none; } }
    @keyframes cd-heart { 0% { transform: scale(1); } 35% { transform: scale(1.4); } 70% { transform: scale(0.92); } 100% { transform: scale(1); } }
    @keyframes cd-slide-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
    @keyframes cd-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes cd-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }

    /* cartões entram em cascata ao aparecer na tela */
    .cd-main .cd-card, .cd-aside .cd-card { animation: cd-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
    .cd-main :is(div, section, ul) > .cd-card:nth-child(2) { animation-delay: 0.04s; }
    .cd-main :is(div, section, ul) > .cd-card:nth-child(3) { animation-delay: 0.08s; }
    .cd-main :is(div, section, ul) > .cd-card:nth-child(4) { animation-delay: 0.12s; }
    .cd-main :is(div, section, ul) > .cd-card:nth-child(5) { animation-delay: 0.16s; }
    .cd-main :is(div, section, ul) > .cd-card:nth-child(n+6) { animation-delay: 0.2s; }
    .cd-main .cd-card.cd-card-hover, .cd-main .cd-card-hover { transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease, border-color 0.2s ease; }
    .cd-card-hover:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }

    /* navegação: barra que cresce no item ativo e ícone que desliza */
    .cd-nav-item { position: relative; }
    .cd-nav-item::before { content: ''; position: absolute; left: -16px; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: var(--accent); transform: scaleY(0); transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
    .cd-nav-item.active::before { transform: scaleY(1); }
    .cd-nav-item svg { transition: transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1); }
    .cd-nav-item:hover svg { transform: translateX(2px) scale(1.08); }
    .cd-nav-item.active svg { transform: scale(1.1); }
    .cd-bn-item { transition: color 0.2s ease, transform 0.2s ease; }
    .cd-bn-item svg { transition: transform 0.3s cubic-bezier(0.34, 1.6, 0.64, 1); }
    .cd-bn-item.active svg { transform: translateY(-2px) scale(1.15); }
    .cd-bn-item:active { transform: scale(0.92); }

    /* botões: elevação suave e resposta ao toque */
    .cd-btn { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease; }
    .cd-btn-primary:not(:disabled):hover, .cd-btn-secondary:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 6px 16px -6px rgba(16,24,40,0.3); }
    .cd-btn:active:not(:disabled) { transform: scale(0.97); box-shadow: none; }
    .cd-btn svg { transition: transform 0.2s ease; }
    .cd-btn:hover:not(:disabled) svg:last-child:not(:first-child) { transform: translateX(2px); }

    /* curtir com "pulo" no coração */
    .cd-like-btn svg { transition: transform 0.2s ease; }
    .cd-like-btn.liked svg { animation: cd-heart 0.45s cubic-bezier(0.34, 1.4, 0.64, 1); }
    .cd-like-btn:active svg { transform: scale(0.8); }

    /* abas, campos, avatares e links */
    .cd-tab { transition: color 0.2s ease, border-color 0.25s ease, background-color 0.2s ease; }
    .cd-input, .cd-select, .cd-textarea { transition: border-color 0.2s ease, box-shadow 0.25s ease, background-color 0.2s ease; }
    .cd-avatar { transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.2s ease; }
    [role='button']:hover > .cd-avatar, .cd-card-hover:hover .cd-avatar { transform: scale(1.06); }
    .cd-badge { transition: transform 0.2s ease; }
    .cd-auth-brand .cd-auth-headline, .cd-auth-brand .cd-auth-lead { animation: cd-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .cd-auth-brand .cd-auth-lead { animation-delay: 0.08s; }
    .cd-auth-points li { animation: cd-slide-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .cd-auth-points li:nth-child(1) { animation-delay: 0.2s; }
    .cd-auth-points li:nth-child(2) { animation-delay: 0.3s; }
    .cd-auth-points li:nth-child(3) { animation-delay: 0.4s; }
    .cd-auth-brand::after { animation: cd-float 9s ease-in-out infinite; }
    .cd-auth-form-wrap > * { animation: cd-rise 0.6s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both; }
    @media (hover: none) { .cd-card-hover:hover { transform: none; box-shadow: none; } }

    /* ---------- Busca, filtros, moderação, termos ---------- */
    .cd-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
    .cd-filters .cd-search { grid-column: 1 / -1; }
    .cd-search { position: relative; }
    .cd-search svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--ink-faint); pointer-events: none; }
    .cd-search .cd-input { padding-left: 38px; }
    .cd-filter-meta { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; font-size: 13px; color: var(--ink-muted); min-height: 32px; flex-wrap: wrap; }
    .cd-check { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 500; color: var(--ink-soft); cursor: pointer; }
    .cd-check input { accent-color: var(--accent); width: 16px; height: 16px; }
    .cd-grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .cd-quote { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; font-size: 14px; }
    .cd-modal-wide { max-width: 620px; }
    .cd-legal-body { max-height: 52vh; overflow-y: auto; padding-right: 6px; }
    .cd-legal-body h4 { font-size: 14px; font-weight: 600; margin: 16px 0 4px; }
    .cd-legal-body h4:first-child { margin-top: 0; }
    .cd-legal-body p { font-size: 14px; line-height: 1.65; color: var(--ink-soft); margin: 0; }
    .cd-legal-links { display: flex; align-items: center; justify-content: center; gap: 6px; padding-top: 10px; font-size: 12px; color: var(--ink-faint); }
    .cd-legal-links button { background: none; border: 0; padding: 2px; font-size: 12px; color: var(--ink-faint); text-decoration: underline; text-underline-offset: 2px; border-radius: 4px; }
    .cd-legal-links button:hover { color: var(--accent); }
    .cd-consent { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.5; color: var(--ink-soft); margin: 4px 0 14px; }
    .cd-consent input { margin-top: 3px; width: 16px; height: 16px; accent-color: var(--accent); flex-shrink: 0; }
    .cd-consent button { background: none; border: 0; padding: 0; font: inherit; color: var(--accent); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
    @media (max-width: 760px) { .cd-filters { grid-template-columns: 1fr 1fr; } }
    .cd-notice { background: var(--accent-soft); color: var(--accent-deep); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 13.5px; margin-bottom: 16px; }

    @media (prefers-reduced-motion: reduce) {
      .cd-root *, .cd-root *::before, .cd-root *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
    }
  `}</style>
);

/* -------------------------------------------------------------------------
   Componentes utilitários
------------------------------------------------------------------------- */

// Faz um elemento clicável (div, span) se comportar como botão para teclado e leitor de tela
const ativavel = (fn) => ({
  role: "button",
  tabIndex: 0,
  onClick: fn,
  onKeyDown: (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn(e);
    }
  },
});

function Logo({ size = 18, claro = false }) {
  return (
    <span className={`cd-logo ${claro ? "cd-logo-claro" : ""}`} style={{ fontSize: size }}>
      <span className="cd-logo-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      <span className="cd-logo-text" style={claro ? { color: "#fff" } : undefined}>
        Conecta<span style={claro ? { color: "#8BE0BF" } : undefined}>Digital</span>
      </span>
    </span>
  );
}

function iniciais(nome) {
  return (nome || "?")
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Negócio: quadrado arredondado. Freelancer: círculo. Sem foto, usa as iniciais sobre a cor do usuário.
function Avatar({ user, nome, fotoUrl, tipo, size = 40, className = "" }) {
  const n = user ? user.nome : nome;
  const foto = user ? user.fotoUrl : fotoUrl;
  const t = user ? user.tipo : tipo;
  const radius = t === "negocio" ? Math.round(size * 0.28) : "50%";
  const h = matizDe(n);
  const estilo = { width: size, height: size, borderRadius: radius, flexShrink: 0 };
  if (foto) {
    return (
      <div className={`cd-avatar ${className}`} style={{ ...estilo, padding: 0, overflow: "hidden" }}>
        <img src={foto} alt={n} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div
      className={`cd-avatar ${className}`}
      aria-label={n}
      style={{ ...estilo, fontSize: size * 0.37, background: `hsl(${h} 42% 92%)`, color: `hsl(${h} 55% 26%)` }}
    >
      {iniciais(n)}
    </div>
  );
}

const raioAvatar = (u) => (u.tipo === "negocio" ? 28 : "50%");

function AvatarEditable({ nome, fotoUrl, tipo, onChange }) {
  const inputId = useId();

  function handleFile(ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <Avatar nome={nome} fotoUrl={fotoUrl} tipo={tipo} size={72} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <label htmlFor={inputId} className="cd-btn cd-btn-secondary cd-btn-sm" style={{ cursor: "pointer" }}>
          <Camera size={14} /> {fotoUrl ? "Trocar foto" : "Adicionar foto"}
        </label>
        {fotoUrl && (
          <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={() => onChange("")}>
            Remover
          </button>
        )}
      </div>
      <input id={inputId} type="file" accept="image/*" style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} onChange={handleFile} />
    </div>
  );
}

function SeloBadge({ count, size = "normal" }) {
  const tier = tierSelo(count);
  if (!tier) return null;
  return (
    <span
      className={`cd-badge cd-selo-${tier.nivel}`}
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
    <span className="cd-star-row" role="img" aria-label={`Nota ${value ? value.toFixed(1) : 0} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= Math.round(value) ? "#D9921C" : "none"}
          stroke={n <= Math.round(value) ? "#D9921C" : "#CBD0D8"}
        />
      ))}
    </span>
  );
}

function StarsInput({ value, onChange }) {
  return (
    <span className="cd-star-row" role="group" aria-label="Nota de 1 a 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className="cd-star-btn" aria-label={`${n} estrela${n > 1 ? "s" : ""}`} aria-pressed={n <= value} onClick={() => onChange(n)}>
          <Star size={28} fill={n <= value ? "#D9921C" : "none"} stroke={n <= value ? "#D9921C" : "#CBD0D8"} />
        </button>
      ))}
    </span>
  );
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="cd-empty">
      <span className="cd-empty-icon">
        <Icon size={22} />
      </span>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: "var(--ink)" }}>{title}</div>
      <div style={{ fontSize: 13.5, maxWidth: 320, lineHeight: 1.5 }}>{text}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

// O rótulo fica ligado ao campo (id/aria) para leitores de tela e clique no texto
function Field({ label, error, hint, children }) {
  const id = useId();
  const descId = `${id}-desc`;
  const filho = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id || id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error || hint ? descId : undefined,
      })
    : children;
  return (
    <div className="cd-field">
      <label className="cd-label" htmlFor={React.isValidElement(children) ? children.props.id || id : undefined}>
        {label}
      </label>
      {filho}
      {error ? (
        <span className="cd-error" id={descId} role="alert">{error}</span>
      ) : hint ? (
        <span className="cd-hint" id={descId}>{hint}</span>
      ) : null}
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="cd-skeleton" style={{ height: 72, borderRadius: 12 }} />
      ))}
    </div>
  );
}

/* ---------- Contato (interface) ---------- */

const ICONE_CONTATO = { whatsapp: MessageCircle, email: Mail };
const ROTULO_CONTATO = { whatsapp: "WhatsApp", email: "E-mail" };

function ContactBlock({ user, ctx }) {
  const dono = ctx.currentUser.id === user.id;
  const pode = podeVerContato(ctx.currentUser, user, ctx.demandas, ctx.propostas);
  const itens = listaContatos(user);

  if (!pode) {
    return (
      <div className="cd-contact-locked">
        <Lock size={16} />
        <span>O contato é liberado para quem tem uma contratação em andamento ou concluída com {user.nome}.</span>
      </div>
    );
  }
  if (itens.length === 0) {
    return (
      <p className="cd-hint" style={{ margin: 0 }}>
        {dono ? "Você ainda não adicionou WhatsApp nem e-mail. Use Editar." : `${user.nome} ainda não informou um contato.`}
      </p>
    );
  }
  return (
    <>
      {dono && <p className="cd-hint" style={{ margin: "0 0 10px" }}>Só aparece para quem tem contratação com você.</p>}
      <div className="cd-contact-list">
        {itens.map((c) => {
          const Icone = ICONE_CONTATO[c.key];
          return (
            <a key={c.key} className={`cd-contact-btn ${c.key === "whatsapp" ? "whatsapp" : ""}`} href={c.href} target="_blank" rel="noopener noreferrer" aria-label={`${ROTULO_CONTATO[c.key]}: ${c.texto}`}>
              <Icone size={16} />
              <span>{c.texto}</span>
            </a>
          );
        })}
      </div>
    </>
  );
}

function ContactEditor({ valor, onChange, erros }) {
  return (
    <div className="cd-block" style={{ marginTop: 6 }}>
      <div className="cd-section-title" style={{ marginBottom: 4 }}>Contato</div>
      <p className="cd-hint" style={{ margin: "0 0 12px" }}>Só aparece para quem tem contratação em andamento ou concluída com você.</p>
      <Field label="WhatsApp" error={erros.whatsapp} hint="Com DDD. O botão abre a conversa direto no WhatsApp.">
        <input className={`cd-input ${erros.whatsapp ? "cd-input-error" : ""}`} inputMode="tel" placeholder="(15) 99999-9999" value={valor.whatsapp} onChange={(e) => onChange({ ...valor, whatsapp: mascaraTelefone(e.target.value) })} />
      </Field>
      <Field label="E-mail de contato" error={erros.emailContato}>
        <input className={`cd-input ${erros.emailContato ? "cd-input-error" : ""}`} type="email" placeholder="contato@exemplo.com.br" value={valor.emailContato} onChange={(e) => onChange({ ...valor, emailContato: e.target.value })} />
      </Field>
    </div>
  );
}

/* ---------- Fotos: grade nos posts, galeria de portfólio e visualizador ---------- */

function PhotoGrid({ imagens, onOpen }) {
  if (!imagens || imagens.length === 0) return null;
  return (
    <div className={`cd-photos n${Math.min(imagens.length, 4)}`}>
      {imagens.slice(0, 4).map((src, i) => (
        <button key={i} type="button" className="cd-photo" onClick={() => onOpen(imagens, i)} aria-label={`Ampliar foto ${i + 1} de ${imagens.length}`}>
          <img src={src} alt={`Foto ${i + 1} da publicação`} loading="lazy" />
        </button>
      ))}
    </div>
  );
}

// Portfólio = todas as fotos publicadas pela pessoa no feed
function Portfolio({ ctx, user }) {
  const fotos = ctx.posts
    .filter((p) => p.autorId === user.id && !p.removido)
    .sort((a, b) => b.criadoEm - a.criadoEm)
    .flatMap((p) => p.imagens || []);
  const dono = ctx.currentUser.id === user.id;
  if (fotos.length === 0 && !dono) return null;
  return (
    <div className="cd-card" style={{ marginBottom: 24 }}>
      <div className="cd-section-title" style={{ marginBottom: 10 }}>Portfólio {fotos.length > 0 && <span className="cd-hint">· {fotos.length} foto{fotos.length !== 1 ? "s" : ""}</span>}</div>
      {fotos.length === 0 ? (
        <p className="cd-hint" style={{ margin: 0 }}>Publique fotos no feed e elas aparecem aqui, como o seu portfólio.</p>
      ) : (
        <div className="cd-gallery">
          {fotos.slice(0, 9).map((src, i) => (
            <button key={i} type="button" className="cd-gal-item" onClick={() => ctx.abrirFotos(fotos, i)} aria-label={`Ampliar foto ${i + 1} do portfólio`}>
              <img src={src} alt={`Trabalho ${i + 1} de ${user.nome}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Lightbox({ imagens, indice, onClose, onMove }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onMove(-1);
      if (e.key === "ArrowRight") onMove(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onMove]);

  return (
    <div className="cd-lightbox" role="dialog" aria-modal="true" aria-label="Visualizador de fotos" onClick={onClose}>
      <img src={imagens[indice]} alt={`Foto ${indice + 1} de ${imagens.length}`} onClick={(e) => e.stopPropagation()} />
      <button type="button" className="cd-lb-btn cd-lb-close" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
      {imagens.length > 1 && (
        <>
          <button type="button" className="cd-lb-btn cd-lb-prev" onClick={(e) => { e.stopPropagation(); onMove(-1); }} aria-label="Foto anterior"><ChevronLeft size={22} /></button>
          <button type="button" className="cd-lb-btn cd-lb-next" onClick={(e) => { e.stopPropagation(); onMove(1); }} aria-label="Próxima foto"><ChevronRight size={22} /></button>
          <span className="cd-lb-count">{indice + 1} / {imagens.length}</span>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Termos de uso, Política de privacidade (LGPD) e controle dos próprios dados
------------------------------------------------------------------------- */

const ATUALIZADO_EM = "outubro de 2026";

const TEXTO_TERMOS = [
  ["1. Sobre a plataforma", "A ConectaDigital é um projeto acadêmico (UPX, Facens, Sorocaba/SP) que aproxima pequenos negócios e freelancers da região. A plataforma só faz a aproximação: o serviço e o pagamento são combinados diretamente entre as partes, que são as únicas responsáveis pelo que contratam."],
  ["2. Cadastro", "Você deve informar dados verdadeiros e manter a senha em segredo. Cada conta pertence a uma única pessoa ou negócio e é de um só tipo: negócio ou freelancer. Você é responsável pelo que acontece na sua conta."],
  ["3. Como funcionam as demandas e propostas", "Negócios publicam demandas; freelancers enviam uma proposta por demanda. Ao aceitar uma proposta, o negócio inicia a contratação, e as demais propostas daquela demanda ficam como não selecionadas. Depois da conclusão, as duas partes podem se avaliar uma vez, com nota de 1 a 5."],
  ["4. Conteúdo e conduta", "É proibido publicar conteúdo ofensivo, discriminatório, enganoso, spam, golpes ou material que viole direitos de terceiros. Fotos enviadas devem ser suas ou ter autorização de uso. Publicações e perfis podem ser denunciados e, após análise, removidos, e contas podem ser suspensas."],
  ["5. Avaliações e selos", "Avaliações só existem após uma contratação concluída e não podem ser editadas. Os selos refletem a quantidade de trabalhos concluídos pela plataforma. Tentativas de manipular notas ou selos levam à suspensão da conta."],
  ["6. Responsabilidade", "A ConectaDigital não garante a qualidade, o prazo ou o pagamento dos serviços combinados entre os usuários. Por ser um protótipo acadêmico, a plataforma é oferecida no estado em que se encontra, sem garantia de disponibilidade."],
  ["7. Suspensão e encerramento", "Você pode excluir sua conta a qualquer momento em Meu perfil, desde que não haja contratação em andamento. Contas que descumprirem estes termos podem ser suspensas pela moderação."],
  ["8. Mudanças", "Estes termos podem ser atualizados. Mudanças relevantes serão avisadas na plataforma."],
];

const TEXTO_PRIVACIDADE = [
  ["1. Quem é o controlador", "O projeto ConectaDigital (grupo EcoVoxx, curso de Análise e Desenvolvimento de Sistemas da Facens) é o responsável pelo tratamento dos dados descritos aqui, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD)."],
  ["2. Quais dados coletamos", "Dados de cadastro (nome, e-mail, senha, tipo de conta, localização), dados do perfil (descrição, especialidade, faixa de preço, formação, foto), contato opcional (WhatsApp e e-mail de contato), e o que você produz na plataforma (demandas, propostas, avaliações, publicações e fotos, denúncias)."],
  ["3. Para que usamos", "Para criar e manter sua conta, mostrar seu perfil, permitir demandas, propostas e avaliações, exibir o feed, moderar conteúdo e cumprir obrigações legais. Base legal: execução do contrato de uso da plataforma (art. 7º, V), legítimo interesse na segurança e moderação (art. 7º, IX) e consentimento quando você informa dados opcionais, como o WhatsApp (art. 7º, I)."],
  ["4. Quem vê seus dados", "Nome, perfil, avaliações, publicações e fotos são visíveis aos usuários logados. O WhatsApp e o e-mail de contato só são mostrados à outra parte quando existe uma contratação em andamento ou concluída entre vocês. Não vendemos nem compartilhamos dados com terceiros para publicidade."],
  ["5. Por quanto tempo guardamos", "Mantemos os dados enquanto a conta existir. Ao excluir a conta, seus dados pessoais são apagados ou anonimizados. Demandas concluídas e avaliações já feitas permanecem sem identificar você, para preservar o histórico da outra parte."],
  ["6. Seus direitos", "Você pode, a qualquer momento: confirmar que tratamos seus dados, acessá-los e baixar uma cópia (Meu perfil > Privacidade e dados), corrigi-los editando o perfil, pedir a exclusão da conta, revogar o consentimento do contato opcional (basta apagar o WhatsApp do perfil) e reclamar à Autoridade Nacional de Proteção de Dados (ANPD)."],
  ["7. Segurança", "Adotamos medidas técnicas razoáveis para proteger os dados. Nenhum sistema é totalmente seguro: escolha uma senha forte e não a compartilhe."],
  ["8. Menores de idade", "A plataforma é voltada a maiores de 18 anos e a negócios. Não coletamos dados de menores de forma intencional."],
  ["9. Contato", "Dúvidas ou pedidos sobre seus dados podem ser feitos pelo canal de contato do projeto, informado pelo grupo na apresentação da plataforma."],
];

function LegalModal({ qual, onClose, onTroca }) {
  const termos = qual === "termos";
  const itens = termos ? TEXTO_TERMOS : TEXTO_PRIVACIDADE;
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="cd-modal-overlay" onClick={onClose}>
      <div className="cd-modal cd-modal-wide" role="dialog" aria-modal="true" aria-label={termos ? "Termos de uso" : "Política de privacidade"} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>{termos ? "Termos de uso" : "Política de privacidade"}</h3>
          <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="cd-hint" style={{ marginBottom: 14 }}>Atualizado em {ATUALIZADO_EM} · texto base do projeto acadêmico, sujeito a revisão jurídica antes de uso comercial.</div>
        <div className="cd-legal-body">
          {itens.map(([t, p]) => (
            <section key={t}>
              <h4>{t}</h4>
              <p>{p}</p>
            </section>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <button type="button" className="cd-btn cd-btn-primary" onClick={onClose}>Entendi</button>
          <button type="button" className="cd-btn cd-btn-ghost" onClick={() => onTroca(termos ? "privacidade" : "termos")}>
            Ver {termos ? "política de privacidade" : "termos de uso"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LinksLegais({ onAbrir }) {
  return (
    <div className="cd-legal-links">
      <button type="button" onClick={() => onAbrir("termos")}>Termos de uso</button>
      <span aria-hidden="true">·</span>
      <button type="button" onClick={() => onAbrir("privacidade")}>Privacidade</button>
    </div>
  );
}

function PrivacidadeDados({ ctx }) {
  const [confirmando, setConfirmando] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");

  function excluir() {
    const res = ctx.excluirConta();
    if (res && res.error) setErro(res.error);
  }

  return (
    <div className="cd-card" style={{ marginTop: 24 }}>
      <div className="cd-section-title" style={{ marginBottom: 4 }}>Privacidade e dados</div>
      <p className="cd-hint" style={{ margin: "0 0 14px" }}>Seus direitos pela LGPD: ter uma cópia dos seus dados e excluir a conta.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="cd-btn cd-btn-secondary cd-btn-sm" onClick={ctx.exportarDados}><Download size={14} /> Baixar meus dados</button>
        <button type="button" className="cd-btn cd-btn-secondary cd-btn-sm" onClick={() => ctx.abrirLegal("privacidade")}><FileText size={14} /> Política de privacidade</button>
        <button type="button" className="cd-btn cd-btn-secondary cd-btn-sm" onClick={() => ctx.abrirLegal("termos")}><Scale size={14} /> Termos de uso</button>
      </div>
      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        {!confirmando ? (
          <button type="button" className="cd-btn cd-btn-danger cd-btn-sm" onClick={() => setConfirmando(true)}><Trash2 size={14} /> Excluir minha conta</button>
        ) : (
          <div>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: "0 0 10px" }}>
              Isso apaga suas publicações, propostas pendentes e demandas ainda abertas, e anonimiza o restante. Não dá para desfazer. Digite <strong>EXCLUIR</strong> para confirmar.
            </p>
            <input className="cd-input" aria-label="Digite EXCLUIR para confirmar" style={{ maxWidth: 220 }} value={texto} onChange={(e) => { setTexto(e.target.value); setErro(""); }} />
            {erro && <div className="cd-error" style={{ marginTop: 8 }} role="alert">{erro}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" className="cd-btn cd-btn-danger cd-btn-sm" disabled={texto.trim().toUpperCase() !== "EXCLUIR"} onClick={excluir}>Excluir definitivamente</button>
              <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={() => { setConfirmando(false); setTexto(""); setErro(""); }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Denúncias e moderação
------------------------------------------------------------------------- */

const MOTIVOS_DENUNCIA = [
  "Spam ou propaganda",
  "Conteúdo ofensivo ou discriminatório",
  "Golpe ou tentativa de fraude",
  "Informação falsa ou perfil falso",
  "Outro motivo",
];

function DenunciarModal({ alvo, onClose, onSubmit }) {
  const [motivo, setMotivo] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function enviar() {
    if (!motivo) { setErro("Escolha um motivo."); return; }
    if (motivo === "Outro motivo" && detalhe.trim().length < 10) { setErro("Conte brevemente o que aconteceu (mín. 10 caracteres)."); return; }
    const res = onSubmit({ tipo: alvo.tipo, alvoId: alvo.id, motivo, detalhe: detalhe.trim() });
    if (res && res.error) setErro(res.error);
  }

  return (
    <div className="cd-modal-overlay" onClick={onClose}>
      <div className="cd-modal" role="dialog" aria-modal="true" aria-label="Denunciar" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Denunciar</h3>
          <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        <p className="cd-hint" style={{ margin: "0 0 16px" }}>Você está denunciando: {alvo.rotulo}. A equipe de moderação analisa cada denúncia.</p>
        <Field label="Motivo">
          <select className="cd-select" value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro(""); }}>
            <option value="">Selecione</option>
            {MOTIVOS_DENUNCIA.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Detalhes (opcional)" hint={`${detalhe.length}/300`}>
          <textarea className="cd-textarea" maxLength={300} value={detalhe} onChange={(e) => setDetalhe(e.target.value)} placeholder="O que você viu?" />
        </Field>
        {erro && <div className="cd-error" style={{ marginBottom: 10 }} role="alert">{erro}</div>}
        <button type="button" className="cd-btn cd-btn-primary cd-btn-full" onClick={enviar}>Enviar denúncia</button>
      </div>
    </div>
  );
}

function ModeracaoScreen({ ctx }) {
  const [aba, setAba] = useState("abertas");
  const abertas = ctx.denuncias.filter((d) => d.status === "aberta").sort((a, b) => b.criadoEm - a.criadoEm);
  const resolvidas = ctx.denuncias.filter((d) => d.status !== "aberta").sort((a, b) => (b.resolvidaEm || 0) - (a.resolvidaEm || 0));
  const lista = aba === "abertas" ? abertas : resolvidas;
  const suspensos = ctx.users.filter((u) => u.suspenso && !u.excluido);

  return (
    <div className="cd-fade-in cd-narrow" style={{ maxWidth: 760 }}>
      <PageHeader title="Moderação" subtitle="Analise as denúncias da comunidade e mantenha o feed saudável." />

      <div className="cd-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={aba === "abertas"} className={`cd-tab ${aba === "abertas" ? "active" : ""}`} onClick={() => setAba("abertas")}>Abertas ({abertas.length})</button>
        <button type="button" role="tab" aria-selected={aba === "resolvidas"} className={`cd-tab ${aba === "resolvidas" ? "active" : ""}`} onClick={() => setAba("resolvidas")}>Resolvidas ({resolvidas.length})</button>
      </div>

      {lista.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={aba === "abertas" ? "Nenhuma denúncia aberta" : "Nada resolvido ainda"} text={aba === "abertas" ? "Quando alguém denunciar uma publicação ou perfil, aparecerá aqui." : "As denúncias analisadas ficam registradas nesta lista."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lista.map((d) => <DenunciaCard key={d.id} d={d} ctx={ctx} />)}
        </div>
      )}

      {aba === "resolvidas" && suspensos.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="cd-section-title" style={{ marginBottom: 10 }}>Contas suspensas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {suspensos.map((u) => (
              <div key={u.id} className="cd-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar user={u} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{u.nome}</div>
                  <div className="cd-hint">{u.tipo === "negocio" ? "Negócio" : "Freelancer"} · {u.email}</div>
                </div>
                <button type="button" className="cd-btn cd-btn-secondary cd-btn-sm" onClick={() => ctx.reativarUsuario(u.id)}><RotateCcw size={13} /> Reativar</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DenunciaCard({ d, ctx }) {
  const autor = ctx.users.find((u) => u.id === d.porId);
  const post = d.tipo === "post" ? ctx.posts.find((p) => p.id === d.alvoId) : null;
  const alvoUser = d.tipo === "usuario" ? ctx.users.find((u) => u.id === d.alvoId) : post ? ctx.users.find((u) => u.id === post.autorId) : null;
  const aberta = d.status === "aberta";
  const ROTULO_ACAO = { dispensar: "Dispensada", remover_post: "Publicação removida", suspender_usuario: "Conta suspensa" };

  return (
    <div className="cd-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <span className="cd-badge cd-badge-amber">{d.motivo}</span>
        <span className="cd-badge cd-badge-neutral">{d.tipo === "post" ? "Publicação" : "Perfil"}</span>
        {!aberta && <span className="cd-badge cd-badge-dark">{ROTULO_ACAO[d.acao] || "Resolvida"}</span>}
        <span className="cd-hint" style={{ marginLeft: "auto" }}>{fmtRelativo(d.criadoEm)}</span>
      </div>

      {d.tipo === "post" && (
        <div className="cd-quote">
          {post ? (
            <>
              <strong>{alvoUser?.nome}</strong>
              {post.removido && <span className="cd-hint"> · já removida</span>}
              <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{post.texto || "(publicação só com fotos)"}</p>
              {post.imagens && post.imagens.length > 0 && <div className="cd-hint" style={{ marginTop: 4 }}>{post.imagens.length} foto{post.imagens.length !== 1 ? "s" : ""} anexada{post.imagens.length !== 1 ? "s" : ""}</div>}
            </>
          ) : <span className="cd-hint">Publicação não encontrada.</span>}
        </div>
      )}
      {d.tipo === "usuario" && (
        <div className="cd-quote" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {alvoUser ? (
            <>
              <Avatar user={alvoUser} size={40} />
              <div style={{ minWidth: 0 }}>
                <strong>{alvoUser.nome}</strong>
                {alvoUser.suspenso && <span className="cd-hint"> · suspensa</span>}
                <div className="cd-hint">{alvoUser.tipo === "negocio" ? alvoUser.setor : alvoUser.especialidade} · {alvoUser.email}</div>
              </div>
            </>
          ) : <span className="cd-hint">Perfil não encontrado.</span>}
        </div>
      )}

      {d.detalhe && <p style={{ fontSize: 13.5, color: "var(--ink-muted)", margin: "10px 0 0", lineHeight: 1.5 }}>“{d.detalhe}”</p>}
      <div className="cd-hint" style={{ marginTop: 8 }}>Denunciado por {autor?.nome || "usuário removido"}</div>

      {aberta && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button type="button" className="cd-btn cd-btn-secondary cd-btn-sm" onClick={() => ctx.resolverDenuncia(d.id, "dispensar")}>Dispensar</button>
          {d.tipo === "post" && post && !post.removido && (
            <button type="button" className="cd-btn cd-btn-danger cd-btn-sm" onClick={() => ctx.resolverDenuncia(d.id, "remover_post")}><Trash2 size={13} /> Remover publicação</button>
          )}
          {alvoUser && !alvoUser.suspenso && (
            <button type="button" className="cd-btn cd-btn-danger cd-btn-sm" onClick={() => ctx.resolverDenuncia(d.id, "suspender_usuario")}><UserX size={13} /> Suspender conta</button>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   App principal
------------------------------------------------------------------------- */

export default function App() {
  const [users, setUsers] = useState([...seedUsers, seedAdmin]);
  const [demandas, setDemandas] = useState(seedDemandas);
  const [propostas, setPropostas] = useState(seedPropostas);
  const [avaliacoes, setAvaliacoes] = useState(seedAvaliacoes);
  const [posts, setPosts] = useState(seedPosts);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [booting, setBooting] = useState(false);

  const [screen, setScreen] = useState("feed");
  const [selectedDemandaId, setSelectedDemandaId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [toast, setToast] = useState(null);
  const [denuncias, setDenuncias] = useState(seedDenuncias);
  const [denunciaAlvo, setDenunciaAlvo] = useState(null); // { tipo, id, rotulo }
  const [lightbox, setLightbox] = useState(null); // { imagens, indice }
  const [legal, setLegal] = useState(null); // 'termos' | 'privacidade'
  const [avisoAuth, setAvisoAuth] = useState("");
  const [avaliarAlvo, setAvaliarAlvo] = useState(null); // { demandaId, paraId, nome }

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function avisar(texto) {
    setToast({ id: uid("t"), texto });
  }

  function login(userId) {
    setBooting(true);
    setTimeout(() => {
      setCurrentUserId(userId);
      const entrou = users.find((u) => u.id === userId);
      setScreen(entrou && entrou.tipo === "admin" ? "moderacao" : "feed");
      setAvisoAuth("");
      setBooting(false);
    }, 550);
  }

  function logout() {
    setCurrentUserId(null);
    setScreen("feed");
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
    avisar("Demanda publicada");
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
    avisar("Proposta enviada");
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
    avisar("Proposta aceita. Demanda em andamento");
  }

  function concluirDemanda(demandaId) {
    const demanda = demandas.find((d) => d.id === demandaId);
    if (!demanda || demanda.negocioId !== currentUser.id) return;
    if (demanda.status !== STATUS.EM_ANDAMENTO) return;
    setDemandas((prev) => prev.map((d) => (d.id === demandaId ? { ...d, status: STATUS.CONCLUIDA, concluidaEm: now() } : d)));
    avisar("Demanda concluída");
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
    avisar("Avaliação enviada");
  }

  function atualizarPerfil(dados) {
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...dados } : u)));
    avisar("Perfil atualizado");
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
    const user = users.find((u) => u.email === email && u.senha === senha && !u.excluido);
    if (!user) return { error: "E-mail ou senha incorretos." };
    if (user.suspenso) return { error: "Esta conta foi suspensa por violar os Termos de Uso." };
    login(user.id);
    return { error: null };
  }

  function criarPost({ texto, tipo, imagens = [] }) {
      const permitidos = TIPOS_POR_PERFIL[currentUser.tipo];
      if (!permitidos) return;
      const t = (texto || "").trim();
      const fotos = (imagens || []).filter((x) => typeof x === "string" && x.startsWith("data:image/")).slice(0, MAX_FOTOS);
      if (!permitidos.includes(tipo) || t.length > 500) return;
      if (t.length < 3 && fotos.length === 0) return;
      const novo = { id: uid("post"), autorId: currentUser.id, tipo, texto: t, imagens: fotos, criadoEm: now(), curtidas: [] };
      setPosts((prev) => [novo, ...prev]);
      avisar("Publicado no feed");
    }

  function alternarCurtida(postId) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const jaCurtiu = p.curtidas.includes(currentUser.id);
        return { ...p, curtidas: jaCurtiu ? p.curtidas.filter((i) => i !== currentUser.id) : [...p.curtidas, currentUser.id] };
      })
    );
  }

  function removerPost(postId) {
    setPosts((prev) => prev.filter((p) => !(p.id === postId && p.autorId === currentUser.id)));
  }

  function abrirFotos(imagens, indice) {
    setLightbox({ imagens, indice });
  }
  function moverFoto(delta) {
    setLightbox((l) => (l ? { ...l, indice: (l.indice + delta + l.imagens.length) % l.imagens.length } : l));
  }

  function denunciar({ tipo, alvoId, motivo, detalhe }) {
    if (currentUser.tipo === "admin") return { error: "Moderadores não enviam denúncias." };
    if (!["post", "usuario"].includes(tipo)) return { error: "Denúncia inválida." };
    if (!MOTIVOS_DENUNCIA.includes(motivo)) return { error: "Escolha um motivo." };
    const post = tipo === "post" ? posts.find((p) => p.id === alvoId) : null;
    const donoId = tipo === "post" ? (post ? post.autorId : null) : alvoId;
    if (!donoId || !users.some((u) => u.id === donoId)) return { error: "Conteúdo não encontrado." };
    if (donoId === currentUser.id) return { error: "Você não pode denunciar o seu próprio conteúdo." };
    if (denuncias.some((d) => d.porId === currentUser.id && d.tipo === tipo && d.alvoId === alvoId)) {
      return { error: "Você já denunciou este conteúdo. A equipe vai analisar." };
    }
    setDenuncias((prev) => [
      { id: uid("den"), tipo, alvoId, porId: currentUser.id, motivo, detalhe: (detalhe || "").slice(0, 300), status: "aberta", criadoEm: now() },
      ...prev,
    ]);
    setDenunciaAlvo(null);
    avisar("Denúncia enviada. Obrigado por ajudar a manter a plataforma segura.");
    return { error: null };
  }

  function resolverDenuncia(id, acao) {
    if (currentUser.tipo !== "admin") return;
    const d = denuncias.find((x) => x.id === id);
    if (!d || d.status !== "aberta") return;
    if (acao === "remover_post" && d.tipo === "post") {
      setPosts((prev) => prev.map((p) => (p.id === d.alvoId ? { ...p, removido: true } : p)));
    }
    if (acao === "suspender_usuario") {
      const post = d.tipo === "post" ? posts.find((p) => p.id === d.alvoId) : null;
      const alvoId = d.tipo === "usuario" ? d.alvoId : post ? post.autorId : null;
      if (alvoId) setUsers((prev) => prev.map((u) => (u.id === alvoId ? { ...u, suspenso: true } : u)));
    }
    setDenuncias((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: acao === "dispensar" ? "dispensada" : "resolvida", acao, resolvidaEm: now(), resolvidaPor: currentUser.id } : x))
    );
    avisar(acao === "dispensar" ? "Denúncia dispensada" : acao === "remover_post" ? "Publicação removida" : "Conta suspensa");
  }

  function reativarUsuario(userId) {
    if (currentUser.tipo !== "admin") return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, suspenso: false } : u)));
    avisar("Conta reativada");
  }

  // LGPD: cópia dos dados do próprio usuário (sem a senha)
  function exportarDados() {
    const id = currentUser.id;
    const { senha, ...perfil } = currentUser;
    const dados = {
      exportadoEm: new Date().toISOString(),
      perfil,
      publicacoes: posts.filter((p) => p.autorId === id),
      demandas: demandas.filter((d) => d.negocioId === id),
      propostasEnviadas: propostas.filter((p) => p.freelancerId === id),
      avaliacoesRecebidas: avaliacoes.filter((a) => a.paraId === id),
      avaliacoesEnviadas: avaliacoes.filter((a) => a.deId === id),
      denunciasFeitas: denuncias.filter((d) => d.porId === id),
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meus-dados-conectadigital.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    avisar("Arquivo com os seus dados gerado");
  }

  // LGPD: exclusão = apaga o que é só seu e anonimiza o que ficou ligado a outras pessoas
  function excluirConta() {
    const id = currentUser.id;
    const emAndamento = demandas.some((d) => {
      if (d.status !== STATUS.EM_ANDAMENTO) return false;
      if (d.negocioId === id) return true;
      const p = propostas.find((x) => x.id === d.propostaAceitaId);
      return p && p.freelancerId === id;
    });
    if (emAndamento) return { error: "Há uma contratação em andamento. Conclua-a antes de excluir a conta." };

    const abertasIds = demandas
      .filter((d) => d.negocioId === id && (d.status === STATUS.ABERTA || d.status === STATUS.EM_ANALISE))
      .map((d) => d.id);
    const restantes = propostas.filter((p) => !(p.freelancerId === id && p.status === "pendente") && !abertasIds.includes(p.demandaId));
    setPropostas(restantes);
    setDemandas((prev) =>
      prev
        .filter((d) => !abertasIds.includes(d.id))
        .map((d) => (d.status === STATUS.EM_ANALISE && !restantes.some((p) => p.demandaId === d.id) ? { ...d, status: STATUS.ABERTA } : d))
    );
    setPosts((prev) => prev.filter((p) => p.autorId !== id).map((p) => ({ ...p, curtidas: p.curtidas.filter((i) => i !== id) })));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              id: u.id,
              tipo: u.tipo,
              criadoEm: u.criadoEm,
              excluido: true,
              nome: u.tipo === "negocio" ? "Negócio removido" : "Usuário removido",
              email: `removido_${u.id}@removido.invalid`,
              senha: "",
              fotoUrl: "",
              localizacao: "",
              formacao: [],
            }
          : u
      )
    );
    logout();
    setAvisoAuth("Sua conta foi excluída e os seus dados pessoais foram removidos.");
    return { error: null };
  }

  function abrirUsuario(userId) {
    setSelectedUserId(userId);
    setScreen("usuario");
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
        <AuthScreen onLogin={autenticar} onCadastrar={cadastrar} users={users} onDemoLogin={login} booting={booting} aviso={avisoAuth} />
      </div>
    );
  }

  const navItemsNegocio = [
    { key: "feed", label: "Feed", curto: "Feed", icon: Newspaper },
    { key: "dashboard", label: "Minhas demandas", curto: "Demandas", icon: Inbox },
    { key: "freelancers", label: "Encontrar freelancers", curto: "Freelancers", icon: Users },
    { key: "nova-demanda", label: "Nova demanda", curto: "Nova", icon: Plus },
    { key: "perfil", label: "Meu perfil", curto: "Perfil", icon: Building2 },
  ];
  const navItemsFreelancer = [
    { key: "feed", label: "Feed", curto: "Feed", icon: Newspaper },
    { key: "dashboard", label: "Demandas abertas", curto: "Demandas", icon: Search },
    { key: "propostas", label: "Minhas propostas", curto: "Propostas", icon: Inbox },
    { key: "perfil", label: "Meu perfil", curto: "Perfil", icon: Briefcase },
  ];
  const navItemsAdmin = [{ key: "moderacao", label: "Denúncias", curto: "Denúncias", icon: ShieldCheck }];
  const navItems = currentUser.tipo === "admin" ? navItemsAdmin : currentUser.tipo === "negocio" ? navItemsNegocio : navItemsFreelancer;
  const ROTULO_TIPO = { negocio: "Negócio", freelancer: "Freelancer", admin: "Moderação" };
  const telaAtiva = screen === "demanda" ? "dashboard" : screen === "usuario" ? "feed" : screen;

  function irPara(key) {
    setScreen(key);
    setSelectedDemandaId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    posts,
    criarPost,
    alternarCurtida,
    removerPost,
    selectedUserId,
    abrirUsuario,
    avisar,
    abrirFotos,
    denuncias,
    setDenunciaAlvo,
    resolverDenuncia,
    reativarUsuario,
    exportarDados,
    excluirConta,
    abrirLegal: setLegal,
  };

  return (
    <div className="cd-root">
      <GlobalStyles />
      <a href="#conteudo" className="cd-skip">Ir para o conteúdo</a>
      <div className="cd-shell">
        {/* Sidebar desktop */}
        <aside className="cd-sidebar">
          <div className="cd-sidebar-brand">
            <Logo size={19} />
          </div>
          <nav className="cd-nav" aria-label="Navegação principal">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`cd-nav-item ${telaAtiva === item.key ? "active" : ""}`}
                aria-current={telaAtiva === item.key ? "page" : undefined}
                onClick={() => irPara(item.key)}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="cd-sidebar-user">
            <button type="button" className="cd-user-chip" onClick={() => irPara("perfil")} title="Abrir meu perfil">
              <Avatar user={currentUser} size={36} />
              <span>
                <strong>{currentUser.nome}</strong>
                <small>{ROTULO_TIPO[currentUser.tipo]}</small>
              </span>
            </button>
            <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={logout} aria-label="Sair" title="Sair">
              <LogOut size={16} />
            </button>
          </div>
          <LinksLegais onAbrir={setLegal} />
        </aside>

        <div className="cd-content">
          {/* Topbar mobile */}
          <div className="cd-topbar-mobile">
            <Logo size={17} />
            <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={logout} aria-label="Sair">
              <LogOut size={18} />
            </button>
          </div>

          <main className="cd-main" id="conteudo">
            <ScreenRouter key={`${screen}-${selectedDemandaId || selectedUserId || ""}`} screen={screen} ctx={ctx} />
          </main>
        </div>
      </div>

      {/* Navegação inferior (celular) */}
      <nav className="cd-bottomnav" aria-label="Navegação principal">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`cd-bn-item ${telaAtiva === item.key ? "active" : ""}`}
            aria-current={telaAtiva === item.key ? "page" : undefined}
            onClick={() => irPara(item.key)}
          >
            <item.icon size={21} />
            {item.curto}
          </button>
        ))}
      </nav>

      {avaliarAlvo && (
        <AvaliarModal
          alvo={avaliarAlvo}
          onClose={() => setAvaliarAlvo(null)}
          onSubmit={enviarAvaliacao}
        />
      )}

      {lightbox && <Lightbox imagens={lightbox.imagens} indice={lightbox.indice} onClose={() => setLightbox(null)} onMove={moverFoto} />}
      {denunciaAlvo && <DenunciarModal alvo={denunciaAlvo} onClose={() => setDenunciaAlvo(null)} onSubmit={denunciar} />}
      {legal && <LegalModal qual={legal} onClose={() => setLegal(null)} onTroca={setLegal} />}

      {toast && (
        <div className="cd-toast" role="status" aria-live="polite" key={toast.id}>
          <Check size={16} /> {toast.texto}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   FEED — publicações dos usuários + atividade automática da plataforma
   A atividade (novas demandas, contratações, conclusões, selos, novos
   membros) é derivada dos dados reais: nada é inventado só para a vitrine.
------------------------------------------------------------------------- */

const TIPOS_POST = {
  dica: { label: "Dica", cls: "cd-badge-accent" },
  portfolio: { label: "Portfólio", cls: "cd-badge-amber" },
  novidade: { label: "Novidade", cls: "cd-badge-neutral" },
  procuro: { label: "Procuro", cls: "cd-badge-dark" },
};

const TIPOS_POR_PERFIL = {
  freelancer: ["dica", "portfolio", "novidade"],
  negocio: ["novidade", "procuro"],
};

function buildFeed({ users, demandas, propostas, avaliacoes, posts }) {
  const visiveis = users.filter((u) => u.tipo !== "admin" && !u.suspenso && !u.excluido);
  const usuarios = new Map(visiveis.map((u) => [u.id, u]));
  const propostasPorId = new Map(propostas.map((p) => [p.id, p]));
  const eventos = [];

  posts.forEach((p) => {
    if (usuarios.has(p.autorId) && !p.removido) eventos.push({ id: `ev_${p.id}`, kind: "post", ts: p.criadoEm, post: p });
  });

  const concluidasPorFreela = new Map();

  demandas.forEach((d) => {
    const negocio = usuarios.get(d.negocioId);
    if (!negocio) return;
    const aceita = d.propostaAceitaId ? propostasPorId.get(d.propostaAceitaId) : null;
    const freelancer = aceita ? usuarios.get(aceita.freelancerId) : null;

    eventos.push({ id: `ev_nd_${d.id}`, kind: "nova_demanda", ts: d.criadoEm, demanda: d, negocio });

    if (d.status === STATUS.EM_ANDAMENTO && d.aceitaEm && freelancer) {
      eventos.push({ id: `ev_ct_${d.id}`, kind: "contratacao", ts: d.aceitaEm, demanda: d, negocio, freelancer });
    }

    if (d.status === STATUS.CONCLUIDA && d.concluidaEm && freelancer) {
      const av = avaliacoes.find((a) => a.demandaId === d.id && a.deId === negocio.id);
      eventos.push({ id: `ev_cc_${d.id}`, kind: "concluida", ts: d.concluidaEm, demanda: d, negocio, freelancer, nota: av ? av.nota : null });
      if (!concluidasPorFreela.has(freelancer.id)) concluidasPorFreela.set(freelancer.id, []);
      concluidasPorFreela.get(freelancer.id).push(d.concluidaEm);
    }
  });

  // Selos: aparecem no momento em que o freelancer atinge 1, 5 e 10 trabalhos concluídos
  concluidasPorFreela.forEach((datas, freelancerId) => {
    const freelancer = usuarios.get(freelancerId);
    datas.sort((a, b) => a - b).forEach((ts, i) => {
      const count = i + 1;
      if (count === 1 || count === 5 || count === 10) {
        eventos.push({ id: `ev_sl_${freelancerId}_${count}`, kind: "selo", ts, freelancer, count });
      }
    });
  });

  // Novos membros dos últimos 30 dias
  visiveis.forEach((u) => {
    if (now() - u.criadoEm < 30 * 24 * 60 * 60 * 1000) {
      eventos.push({ id: `ev_nm_${u.id}`, kind: "novo_membro", ts: u.criadoEm, user: u });
    }
  });

  return eventos.sort((a, b) => b.ts - a.ts);
}

function NomeLink({ user, ctx }) {
  return (
    <button type="button" className="cd-link" style={{ background: "none", border: 0, padding: 0, font: "inherit", color: "inherit", textAlign: "left" }} onClick={() => ctx.abrirUsuario(user.id)}>
      {user.nome}
    </button>
  );
}

function FeedComposer({ ctx }) {
  const tipos = TIPOS_POR_PERFIL[ctx.currentUser.tipo];
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState(tipos[0]);
  const [imagens, setImagens] = useState([]);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState("");
  const inputId = useId();

  async function addFotos(ev) {
    const files = Array.from(ev.target.files || []);
    ev.target.value = "";
    if (files.length === 0) return;
    const livres = MAX_FOTOS - imagens.length;
    if (livres <= 0) { setErro(`Máximo de ${MAX_FOTOS} fotos por publicação.`); return; }
    setLendo(true);
    const novas = [];
    let falha = files.length > livres ? `Máximo de ${MAX_FOTOS} fotos por publicação.` : "";
    for (const f of files.slice(0, livres)) {
      try {
        novas.push(await lerImagem(f));
      } catch (e) {
        falha = e.message;
      }
    }
    setImagens((prev) => [...prev, ...novas].slice(0, MAX_FOTOS));
    setErro(falha);
    setLendo(false);
  }

  function publicar() {
    const t = texto.trim();
    if (t.length < 3 && imagens.length === 0) { setErro("Escreva pelo menos 3 caracteres ou adicione uma foto."); return; }
    if (t.length > 500) { setErro("O limite é de 500 caracteres."); return; }
    ctx.criarPost({ texto: t, tipo, imagens });
    setTexto("");
    setImagens([]);
    setErro("");
  }

  return (
    <div className="cd-card" style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar user={ctx.currentUser} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            className={`cd-textarea ${erro ? "cd-input-error" : ""}`}
            style={{ minHeight: 70 }}
            aria-label="Nova publicação"
            placeholder={
              ctx.currentUser.tipo === "freelancer"
                ? "Compartilhe uma dica, um trabalho recente ou uma novidade…"
                : "Conte uma novidade do negócio ou o que você está procurando…"
            }
            value={texto}
            onChange={(e) => { setTexto(e.target.value); if (erro) setErro(""); }}
          />
          {imagens.length > 0 && (
            <div className="cd-thumbs">
              {imagens.map((src, i) => (
                <div key={i} className="cd-thumb">
                  <img src={src} alt={`Foto ${i + 1} a publicar`} />
                  <button type="button" onClick={() => setImagens((prev) => prev.filter((_, k) => k !== i))} aria-label={`Remover foto ${i + 1}`}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <select className="cd-select" style={{ width: "auto" }} aria-label="Tipo de publicação" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {tipos.map((t) => (
                <option key={t} value={t}>{TIPOS_POST[t].label}</option>
              ))}
            </select>
            <label htmlFor={inputId} className="cd-btn cd-btn-secondary cd-btn-sm" style={{ cursor: "pointer" }}>
              <ImagePlus size={15} /> {lendo ? "Lendo…" : "Foto"}
            </label>
            <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} onChange={addFotos} />
            <span className="cd-hint" style={{ marginLeft: "auto" }}>{texto.length}/500</span>
            <button className="cd-btn cd-btn-primary cd-btn-sm" onClick={publicar} disabled={lendo}>
              <Send size={14} /> Publicar
            </button>
          </div>
          {erro && <div className="cd-error" style={{ marginTop: 6 }} role="alert">{erro}</div>}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, ctx }) {
  const autor = ctx.users.find((u) => u.id === post.autorId);
  if (!autor || post.removido || autor.suspenso || autor.excluido) return null;
  const curtiu = post.curtidas.includes(ctx.currentUser.id);
  const tipo = TIPOS_POST[post.tipo];
  const subtitulo = autor.tipo === "freelancer" ? autor.especialidade : autor.setor;
  const concluidos = autor.tipo === "freelancer" ? trabalhosConcluidos(autor.id, ctx.demandas, ctx.propostas) : 0;

  return (
    <div className="cd-card">
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => ctx.abrirUsuario(autor.id)}>
          <Avatar user={autor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="cd-link" style={{ fontWeight: 600, fontSize: 14.5 }} onClick={() => ctx.abrirUsuario(autor.id)}>
              {autor.nome}
            </span>
            <span className={`cd-badge ${tipo.cls}`} style={{ fontSize: 11.5, padding: "3px 9px" }}>{tipo.label}</span>
            {concluidos > 0 && <SeloBadge count={concluidos} size="small" />}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 8 }}>
            {subtitulo} · {fmtRelativo(post.criadoEm)}
          </div>
          {post.texto && <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{post.texto}</p>}
          <PhotoGrid imagens={post.imagens} onOpen={ctx.abrirFotos} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <button className={`cd-like-btn ${curtiu ? "liked" : ""}`} onClick={() => ctx.alternarCurtida(post.id)}>
              <Heart size={15} fill={curtiu ? "currentColor" : "none"} />
              {post.curtidas.length > 0 ? post.curtidas.length : "Curtir"}
            </button>
            {post.autorId === ctx.currentUser.id && (
              <button className="cd-btn cd-btn-ghost cd-btn-sm" style={{ marginLeft: "auto" }} onClick={() => ctx.removerPost(post.id)} title="Apagar publicação">
                <Trash2 size={14} />
              </button>
            )}
            {post.autorId !== ctx.currentUser.id && ctx.currentUser.tipo !== "admin" && (
              <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" style={{ marginLeft: "auto" }} onClick={() => ctx.setDenunciaAlvo({ tipo: "post", id: post.id, rotulo: `a publicação de ${autor.nome}` })} aria-label="Denunciar publicação" title="Denunciar">
                <Flag size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ ev, ctx }) {
  let icon = null;
  let texto = null;
  let extra = null;

  const podeVerDemanda = (d, negocio) =>
    ctx.currentUser.id === negocio.id ||
    (ctx.currentUser.tipo === "freelancer" && (d.status === STATUS.ABERTA || d.status === STATUS.EM_ANALISE));

  switch (ev.kind) {
    case "nova_demanda":
      icon = <Inbox size={16} />;
      texto = (
        <>
          <NomeLink user={ev.negocio} ctx={ctx} /> publicou uma nova demanda: <strong>{ev.demanda.titulo}</strong>
        </>
      );
      extra = (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <span className="cd-badge cd-badge-neutral">{ev.demanda.categoria}</span>
          {podeVerDemanda(ev.demanda, ev.negocio) && (
            <button
              className="cd-btn cd-btn-secondary cd-btn-sm"
              onClick={() => { ctx.setSelectedDemandaId(ev.demanda.id); ctx.setScreen("demanda"); }}
            >
              Ver demanda <ChevronRight size={14} />
            </button>
          )}
        </div>
      );
      break;
    case "contratacao":
      icon = <Briefcase size={16} />;
      texto = (
        <>
          <NomeLink user={ev.negocio} ctx={ctx} /> contratou <NomeLink user={ev.freelancer} ctx={ctx} /> para <strong>{ev.demanda.titulo}</strong>
        </>
      );
      break;
    case "concluida":
      icon = <Check size={16} />;
      texto = (
        <>
          <NomeLink user={ev.freelancer} ctx={ctx} /> concluiu <strong>{ev.demanda.titulo}</strong> para <NomeLink user={ev.negocio} ctx={ctx} />
        </>
      );
      if (ev.nota) {
        extra = (
          <div style={{ marginTop: 6 }}>
            <StarsDisplay value={ev.nota} size={13} />
          </div>
        );
      }
      break;
    case "selo": {
      const tier = tierSelo(ev.count);
      icon = <Award size={16} />;
      texto = (
        <>
          <NomeLink user={ev.freelancer} ctx={ctx} /> conquistou o <strong>{tier.label}</strong> ({tier.desc})
        </>
      );
      break;
    }
    case "novo_membro":
      icon = <UserPlus size={16} />;
      texto = (
        <>
          <NomeLink user={ev.user} ctx={ctx} /> entrou na plataforma
          {ev.user.tipo === "freelancer" ? ` como freelancer de ${ev.user.especialidade}` : ` (${ev.user.setor})`}
          {ev.user.localizacao ? ` · ${ev.user.localizacao}` : ""}
        </>
      );
      break;
    default:
      return null;
  }

  return (
    <div className="cd-card" style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 16 }}>
      <div className="cd-feed-icon">{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, lineHeight: 1.5 }}>{texto}</div>
        {extra}
        <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 6 }}>{fmtRelativo(ev.ts)}</div>
      </div>
    </div>
  );
}

function FeedScreen({ ctx }) {
  const [filtro, setFiltro] = useState("tudo");
  const [limite, setLimite] = useState(15);

  const eventos = useMemo(
    () => buildFeed({ users: ctx.users, demandas: ctx.demandas, propostas: ctx.propostas, avaliacoes: ctx.avaliacoes, posts: ctx.posts }),
    [ctx.users, ctx.demandas, ctx.propostas, ctx.avaliacoes, ctx.posts]
  );

  const filtrados = eventos.filter((ev) => (filtro === "tudo" ? true : filtro === "posts" ? ev.kind === "post" : ev.kind !== "post"));
  const visiveis = filtrados.slice(0, limite);

  return (
    <div className="cd-fade-in" style={{ maxWidth: 640 }}>
      <PageHeader title="Feed" subtitle="O que está acontecendo entre negócios e freelancers de Sorocaba." />
      <FeedComposer ctx={ctx} />

      <div className="cd-tabs">
        {[
          ["tudo", "Tudo"],
          ["posts", "Publicações"],
          ["atividade", "Atividade"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filtro === key}
            className={`cd-tab ${filtro === key ? "active" : ""}`}
            onClick={() => { setFiltro(key); setLimite(15); }}
          >
            {label}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <EmptyState icon={Newspaper} title="Nada por aqui ainda" text="Quando houver publicações ou atividade na plataforma, elas aparecerão neste feed." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visiveis.map((ev) =>
            ev.kind === "post" ? <PostCard key={ev.id} post={ev.post} ctx={ctx} /> : <ActivityItem key={ev.id} ev={ev} ctx={ctx} />
          )}
          {filtrados.length > limite && (
            <button className="cd-btn cd-btn-secondary" onClick={() => setLimite((l) => l + 15)}>
              Ver mais
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PerfilPublico({ ctx }) {
  const u = ctx.users.find((x) => x.id === ctx.selectedUserId);
  if (!u) return null;
  const isFree = u.tipo === "freelancer";
  const rating = ctx.ratingDe(u.id);
  const concluidos = isFree
    ? trabalhosConcluidos(u.id, ctx.demandas, ctx.propostas)
    : ctx.demandas.filter((d) => d.negocioId === u.id && d.status === STATUS.CONCLUIDA).length;
  const postsDoUsuario = ctx.posts.filter((p) => p.autorId === u.id).filter((p) => !p.removido).sort((a, b) => b.criadoEm - a.criadoEm);

  return (
    <div className="cd-fade-in" style={{ maxWidth: 620 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <button className="cd-btn cd-btn-ghost cd-btn-sm" style={{ paddingLeft: 4 }} onClick={() => ctx.setScreen("feed")}>
          <ChevronLeft size={16} /> Voltar ao feed
        </button>
        {u.id !== ctx.currentUser.id && ctx.currentUser.tipo !== "admin" && (
          <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={() => ctx.setDenunciaAlvo({ tipo: "usuario", id: u.id, rotulo: `o perfil de ${u.nome}` })}>
            <Flag size={14} /> Denunciar perfil
          </button>
        )}
      </div>

      <div className="cd-card" style={{ marginBottom: 24 }}>
        <div aria-hidden="true" style={{ height: 88, margin: "-20px -20px 0", borderRadius: "15px 15px 0 0", background: capaDe(u.nome) }} />
        <div style={{ marginBottom: 14 }}>
          <div style={{ marginTop: -46, width: "fit-content", borderRadius: raioAvatar(u), border: "4px solid var(--surface)", background: "var(--surface)" }}>
            <Avatar user={u} size={80} />
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 17 }}>{u.nome}</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>{isFree ? u.especialidade : u.setor}</div>
            {u.localizacao && (
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <MapPin size={12} /> {u.localizacao}
              </div>
            )}
          </div>
        </div>

        <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{isFree ? u.descricaoFreelancer : u.descricaoNegocio}</p>

        {isFree && u.faixaPreco && (
          <div style={{ fontSize: 13.5, color: "var(--ink-muted)", marginTop: 8 }}>
            <Banknote size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
            {u.faixaPreco}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <StarsDisplay value={rating.media} />
          <span style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>
            {rating.count > 0 ? `${rating.media.toFixed(1)} · ${rating.count} avaliação${rating.count !== 1 ? "ões" : ""}` : "Ainda sem avaliações"}
          </span>
          {isFree && <SeloBadge count={concluidos} />}
        </div>

        <div style={{ fontSize: 13.5, color: "var(--ink-muted)", marginTop: 10 }}>
          {concluidos} {isFree ? "trabalho" : "contratação"}
          {concluidos !== 1 ? (isFree ? "s" : "ões") : ""} concluído{concluidos !== 1 ? "s" : ""} na plataforma
        </div>

        {isFree && u.formacao && u.formacao.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <GraduationCap size={15} /> Formação e certificados
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {u.formacao.map((f) => (
                <div key={f.id} style={{ fontSize: 13.5 }}>
                  <span style={{ fontWeight: 500 }}>{f.titulo}</span>
                  {f.instituicao && <span style={{ color: "var(--ink-muted)" }}> · {f.instituicao}</span>}
                  {f.ano && <span style={{ color: "var(--ink-faint)" }}> · {f.ano}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Portfolio ctx={ctx} user={u} />

      <div className="cd-card" style={{ marginBottom: 24 }}>
        <div className="cd-section-title" style={{ marginBottom: 10 }}>Contato</div>
        <ContactBlock user={u} ctx={ctx} />
      </div>

      {postsDoUsuario.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 12 }}>Publicações</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {postsDoUsuario.map((p) => (
              <PostCard key={p.id} post={p} ctx={ctx} />
            ))}
          </div>
        </div>
      )}

      <AvaliacoesHistorico rating={rating} users={ctx.users} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Busca e filtros
------------------------------------------------------------------------- */

const semAcento = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const bairroDe = (loc) => (loc || "").split(",")[0].trim();
const NOTAS_MIN = [
  ["0", "Qualquer nota"],
  ["4", "4,0 ou mais"],
  ["4.5", "4,5 ou mais"],
];

function CampoBusca({ valor, onChange, placeholder, rotulo }) {
  return (
    <div className="cd-search">
      <Search size={16} aria-hidden="true" />
      <input className="cd-input" type="search" aria-label={rotulo} placeholder={placeholder} value={valor} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FiltroSelect({ rotulo, valor, onChange, opcoes }) {
  return (
    <select className="cd-select" aria-label={rotulo} value={valor} onChange={(e) => onChange(e.target.value)}>
      {opcoes.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}

function DashboardFreelancer({ ctx }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [bairro, setBairro] = useState("");
  const [notaMin, setNotaMin] = useState("0");
  const [ordem, setOrdem] = useState("recentes");

  const negocioDe = (d) => ctx.users.find((u) => u.id === d.negocioId);
  const abertasBase = ctx.demandas
    .filter((d) => d.status === STATUS.ABERTA || d.status === STATUS.EM_ANALISE)
    .filter((d) => { const n = negocioDe(d); return n && !n.suspenso && !n.excluido; });
  const bairros = Array.from(new Set(abertasBase.map((d) => bairroDe(negocioDe(d)?.localizacao)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const q = semAcento(busca.trim());
  const abertas = abertasBase
    .filter((d) => !categoria || d.categoria === categoria)
    .filter((d) => !bairro || bairroDe(negocioDe(d)?.localizacao) === bairro)
    .filter((d) => Number(notaMin) === 0 || (ctx.ratingDe(d.negocioId).count > 0 && ctx.ratingDe(d.negocioId).media >= Number(notaMin)))
    .filter((d) => !q || semAcento(`${d.titulo} ${d.descricao} ${negocioDe(d)?.nome || ""}`).includes(q))
    .sort((a, b) => (ordem === "prazo" ? a.prazo - b.prazo : b.criadoEm - a.criadoEm));

  const filtrando = busca || categoria || bairro || notaMin !== "0";
  const limpar = () => { setBusca(""); setCategoria(""); setBairro(""); setNotaMin("0"); };

  return (
    <div className="cd-fade-in">
      <PageHeader title="Demandas abertas" subtitle="Encontre demandas publicadas por negócios locais e envie sua proposta." />

      <div className="cd-filters">
        <CampoBusca rotulo="Buscar demandas" placeholder="Buscar por título, descrição ou negócio" valor={busca} onChange={setBusca} />
        <FiltroSelect rotulo="Categoria" valor={categoria} onChange={setCategoria} opcoes={[["", "Todas as categorias"], ...CATEGORIAS.map((c) => [c, c])]} />
        <FiltroSelect rotulo="Bairro" valor={bairro} onChange={setBairro} opcoes={[["", "Todos os bairros"], ...bairros.map((b) => [b, b])]} />
        <FiltroSelect rotulo="Nota do negócio" valor={notaMin} onChange={setNotaMin} opcoes={NOTAS_MIN} />
        <FiltroSelect rotulo="Ordenar por" valor={ordem} onChange={setOrdem} opcoes={[["recentes", "Mais recentes"], ["prazo", "Prazo mais próximo"]]} />
      </div>
      <div className="cd-filter-meta" aria-live="polite">
        <span>{abertas.length} demanda{abertas.length !== 1 ? "s" : ""}</span>
        {filtrando && <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={limpar}><RotateCcw size={13} /> Limpar filtros</button>}
      </div>

      {abertas.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhuma demanda encontrada"
          text="Nada corresponde a esses filtros agora. Tente outros termos ou limpe os filtros."
          action={filtrando && <button type="button" className="cd-btn cd-btn-secondary cd-btn-sm" onClick={limpar}>Limpar filtros</button>}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {abertas.map((d) => {
            const negocio = negocioDe(d);
            const enviada = ctx.jaEnviouProposta(d.id, ctx.currentUser.id);
            const abrir = () => { ctx.setSelectedDemandaId(d.id); ctx.setScreen("demanda"); };
            return (
              <div key={d.id} className="cd-card cd-card-hover" style={{ cursor: "pointer" }} {...ativavel(abrir)} aria-label={`Abrir demanda ${d.titulo}`}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 15.5 }}>{d.titulo}</span>
                      <span className="cd-badge cd-badge-neutral">{d.categoria}</span>
                      {enviada && <span className="cd-badge cd-badge-accent">Proposta enviada</span>}
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>
                      {negocio?.nome}
                      {negocio?.localizacao ? ` · ${bairroDe(negocio.localizacao)}` : ""} · Prazo {fmtPrazo(d.prazo)}
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

function BuscaFreelancers({ ctx }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [bairro, setBairro] = useState("");
  const [notaMin, setNotaMin] = useState("0");
  const [soSelo, setSoSelo] = useState(false);
  const [ordem, setOrdem] = useState("nota");

  const todos = ctx.users
    .filter((u) => u.tipo === "freelancer" && !u.suspenso && !u.excluido)
    .map((u) => ({ u, rating: ctx.ratingDe(u.id), concluidos: trabalhosConcluidos(u.id, ctx.demandas, ctx.propostas) }));
  const bairros = Array.from(new Set(todos.map((x) => bairroDe(x.u.localizacao)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const q = semAcento(busca.trim());
  const lista = todos
    .filter((x) => !categoria || x.u.especialidade === categoria)
    .filter((x) => !bairro || bairroDe(x.u.localizacao) === bairro)
    .filter((x) => Number(notaMin) === 0 || (x.rating.count > 0 && x.rating.media >= Number(notaMin)))
    .filter((x) => !soSelo || x.concluidos > 0)
    .filter((x) => !q || semAcento(`${x.u.nome} ${x.u.especialidade} ${x.u.descricaoFreelancer}`).includes(q))
    .sort((a, b) => {
      if (ordem === "trabalhos") return b.concluidos - a.concluidos || b.rating.media - a.rating.media;
      if (ordem === "nome") return a.u.nome.localeCompare(b.u.nome, "pt-BR");
      return b.rating.media - a.rating.media || b.rating.count - a.rating.count;
    });

  const filtrando = busca || categoria || bairro || notaMin !== "0" || soSelo;
  const limpar = () => { setBusca(""); setCategoria(""); setBairro(""); setNotaMin("0"); setSoSelo(false); };

  return (
    <div className="cd-fade-in">
      <PageHeader title="Encontrar freelancers" subtitle="Veja quem atende em Sorocaba, compare avaliações e selos e abra o perfil." />

      <div className="cd-filters">
        <CampoBusca rotulo="Buscar freelancers" placeholder="Buscar por nome, especialidade ou habilidade" valor={busca} onChange={setBusca} />
        <FiltroSelect rotulo="Especialidade" valor={categoria} onChange={setCategoria} opcoes={[["", "Todas as especialidades"], ...CATEGORIAS.map((c) => [c, c])]} />
        <FiltroSelect rotulo="Bairro" valor={bairro} onChange={setBairro} opcoes={[["", "Todos os bairros"], ...bairros.map((b) => [b, b])]} />
        <FiltroSelect rotulo="Nota mínima" valor={notaMin} onChange={setNotaMin} opcoes={NOTAS_MIN} />
        <FiltroSelect rotulo="Ordenar por" valor={ordem} onChange={setOrdem} opcoes={[["nota", "Melhor avaliados"], ["trabalhos", "Mais trabalhos concluídos"], ["nome", "Nome (A–Z)"]]} />
      </div>
      <div className="cd-filter-meta" aria-live="polite">
        <label className="cd-check">
          <input type="checkbox" checked={soSelo} onChange={(e) => setSoSelo(e.target.checked)} /> Só com selo
        </label>
        <span>{lista.length} freelancer{lista.length !== 1 ? "s" : ""}</span>
        {filtrando && <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={limpar}><RotateCcw size={13} /> Limpar filtros</button>}
      </div>

      {lista.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum freelancer encontrado" text="Tente outra especialidade ou bairro, ou diminua a nota mínima." action={filtrando && <button type="button" className="cd-btn cd-btn-secondary cd-btn-sm" onClick={limpar}>Limpar filtros</button>} />
      ) : (
        <div className="cd-grid-cards">
          {lista.map(({ u, rating, concluidos }) => (
            <div key={u.id} className="cd-card cd-card-hover" style={{ cursor: "pointer" }} {...ativavel(() => ctx.abrirUsuario(u.id))} aria-label={`Abrir perfil de ${u.nome}`}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar user={u} size={48} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{u.nome}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>{u.especialidade}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                <StarsDisplay value={rating.media} size={13} />
                <span style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>{rating.count > 0 ? `${rating.media.toFixed(1)} (${rating.count})` : "Sem avaliações"}</span>
                <SeloBadge count={concluidos} size="small" />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
                {u.localizacao && <span><MapPin size={12} style={{ verticalAlign: -1 }} /> {bairroDe(u.localizacao)}</span>}
                {u.faixaPreco && <span><Banknote size={12} style={{ verticalAlign: -1 }} /> {u.faixaPreco}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Roteador simples de telas
------------------------------------------------------------------------- */

function ScreenRouter({ screen, ctx }) {
  if (ctx.currentUser.tipo === "admin") return <ModeracaoScreen ctx={ctx} />;
  if (screen === "demanda" && ctx.selectedDemandaId) {
    return <DemandaDetail ctx={ctx} />;
  }
  if (screen === "feed") return <FeedScreen ctx={ctx} />;
  if (screen === "usuario" && ctx.selectedUserId) return <PerfilPublico ctx={ctx} />;
  if (ctx.currentUser.tipo === "negocio") {
    if (screen === "freelancers") return <BuscaFreelancers ctx={ctx} />;
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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 className="cd-serif" style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.1, margin: 0 }}>
          {title}
        </h1>
        {subtitle && <p style={{ color: "var(--ink-muted)", fontSize: 15, marginTop: 8, maxWidth: 520, lineHeight: 1.5 }}>{subtitle}</p>}
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
  const [contato, setContato] = useState(contatoInicial(ctx.currentUser));
  const [errosContato, setErrosContato] = useState({});

  function salvar() {
    const { erros, valores } = validarContato(contato);
    setErrosContato(erros);
    if (Object.keys(erros).length > 0) return;
    ctx.atualizarPerfil({ ...valores, nome, fotoUrl, localizacao, setor, descricaoNegocio });
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
            <ContactEditor valor={contato} onChange={setContato} erros={errosContato} />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="cd-btn cd-btn-primary" onClick={salvar}>Salvar alterações</button>
              <button className="cd-btn cd-btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <div aria-hidden="true" style={{ height: 88, margin: "-20px -20px 0", borderRadius: "15px 15px 0 0", background: capaDe(ctx.currentUser.nome) }} />
            <div style={{ marginBottom: 14 }}>
              <div style={{ marginTop: -46, width: "fit-content", borderRadius: raioAvatar(ctx.currentUser), border: "4px solid var(--surface)", background: "var(--surface)" }}>
                <Avatar user={ctx.currentUser} size={80} />
              </div>
              <div style={{ marginTop: 12 }}>
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

      {!editando && (
        <div className="cd-card" style={{ marginBottom: 24 }}>
          <div className="cd-section-title" style={{ marginBottom: 10 }}>Meu contato</div>
          <ContactBlock user={ctx.currentUser} ctx={ctx} />
        </div>
      )}

      {!editando && <Portfolio ctx={ctx} user={ctx.currentUser} />}

      <AvaliacoesHistorico rating={rating} users={ctx.users} />

      {!editando && <PrivacidadeDados ctx={ctx} />}
    </div>
  );
}

/* -------------------------------------------------------------------------
   FREELANCER — Dashboard, Minhas propostas, Perfil
------------------------------------------------------------------------- */

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
                      <button
                        type="button"
                        className="cd-link"
                        style={{ background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 600, fontSize: 15.5, color: "inherit", textAlign: "left" }}
                        onClick={() => { ctx.setSelectedDemandaId(demanda.id); ctx.setScreen("demanda"); }}
                      >
                        {demanda.titulo}
                      </button>
                      <span className={`cd-badge ${st.cls}`}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>
                      {negocio?.nome} · R$ {p.valor} · Prazo {fmtPrazo(p.prazo)}
                    </div>
                  </div>
                  {p.status === "aceita" && (
                    <button
                      type="button"
                      className="cd-btn cd-btn-secondary cd-btn-sm"
                      onClick={() => { ctx.setSelectedDemandaId(demanda.id); ctx.setScreen("demanda"); }}
                    >
                      <MessageCircle size={14} /> Falar com o negócio
                    </button>
                  )}
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
  const [contato, setContato] = useState(contatoInicial(ctx.currentUser));
  const [errosContato, setErrosContato] = useState({});
  const concluidos = trabalhosConcluidos(ctx.currentUser.id, ctx.demandas, ctx.propostas);

  function salvar() {
    const { erros, valores } = validarContato(contato);
    setErrosContato(erros);
    if (Object.keys(erros).length > 0) return;
    ctx.atualizarPerfil({ ...valores, nome, fotoUrl, localizacao, especialidade, descricaoFreelancer, faixaPreco, formacao });
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

            <ContactEditor valor={contato} onChange={setContato} erros={errosContato} />
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button className="cd-btn cd-btn-primary" onClick={salvar}>Salvar alterações</button>
              <button className="cd-btn cd-btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <div aria-hidden="true" style={{ height: 88, margin: "-20px -20px 0", borderRadius: "15px 15px 0 0", background: capaDe(ctx.currentUser.nome) }} />
            <div style={{ marginBottom: 14 }}>
              <div style={{ marginTop: -46, width: "fit-content", borderRadius: raioAvatar(ctx.currentUser), border: "4px solid var(--surface)", background: "var(--surface)" }}>
                <Avatar user={ctx.currentUser} size={80} />
              </div>
              <div style={{ marginTop: 12 }}>
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
      {!editando && (
        <div className="cd-card" style={{ marginBottom: 24 }}>
          <div className="cd-section-title" style={{ marginBottom: 10 }}>Meu contato</div>
          <ContactBlock user={ctx.currentUser} ctx={ctx} />
        </div>
      )}

      {!editando && <Portfolio ctx={ctx} user={ctx.currentUser} />}

      <AvaliacoesHistorico rating={rating} users={ctx.users} />

      {!editando && <PrivacidadeDados ctx={ctx} />}
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
  const aceita = demanda.propostaAceitaId ? ctx.propostas.find((p) => p.id === demanda.propostaAceitaId) : null;
  const contratada = aceita && (demanda.status === STATUS.EM_ANDAMENTO || demanda.status === STATUS.CONCLUIDA);
  const contraparte = !contratada
    ? null
    : isDono
      ? ctx.users.find((u) => u.id === aceita.freelancerId)
      : aceita.freelancerId === ctx.currentUser.id
        ? negocio
        : null;

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

      {contraparte && (
        <div className="cd-card" style={{ marginBottom: 26 }}>
          <div className="cd-person">
            <Avatar user={contraparte} size={44} />
            <div>
              <div className="cd-section-title" style={{ margin: 0 }}>Fale com {contraparte.nome}</div>
              <div className="cd-hint">{isDono ? "Freelancer contratado" : "Negócio contratante"}</div>
            </div>
          </div>
          <ContactBlock user={contraparte} ctx={ctx} />
        </div>
      )}

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
                    <Avatar user={freelancer} />
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

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    if (nota === 0) { setError("Selecione uma nota de 1 a 5."); return; }
    onSubmit({ demandaId: alvo.demandaId, paraId: alvo.paraId, nota, comentario: comentario.trim() });
  }

  return (
    <div className="cd-modal-overlay" onClick={onClose}>
      <div className="cd-modal" role="dialog" aria-modal="true" aria-label={`Avaliar ${alvo.nome}`} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Avaliar {alvo.nome}</h3>
          <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
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

function AuthScreen({ onLogin, onCadastrar, users, onDemoLogin, booting, aviso }) {
  const [mode, setMode] = useState("login"); // 'login' | 'cadastro'
  const [legal, setLegal] = useState(null);

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 22, padding: 20 }}>
        <Logo size={24} />
        <SkeletonBlock />
        <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>Carregando seu painel…</div>
      </div>
    );
  }

  return (
    <div className="cd-auth">
      {legal && <LegalModal qual={legal} onClose={() => setLegal(null)} onTroca={setLegal} />}
      <section className="cd-auth-brand" aria-label="Sobre a plataforma">
        <Logo size={22} claro />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="cd-auth-headline">Quem precisa e quem faz, na mesma cidade.</h1>
          <p className="cd-auth-lead" style={{ marginTop: 20 }}>
            A ConectaDigital aproxima pequenos negócios de Sorocaba de freelancers locais, com propostas claras e avaliações reais.
          </p>
          <ul className="cd-auth-points">
            <li><Inbox size={18} /> Negócios publicam demandas e comparam propostas.</li>
            <li><Award size={18} /> Freelancers ganham selos a cada trabalho concluído.</li>
            <li><Star size={18} /> Avaliação dos dois lados, depois de cada contratação.</li>
          </ul>
        </div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", position: "relative", zIndex: 1 }}>
          Projeto UPX · Facens · Sorocaba/SP
        </div>
      </section>

      <div className="cd-auth-form-wrap">
        <div style={{ width: "100%", maxWidth: 400 }}>
          <h2 className="cd-serif" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.03em" }}>
            {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: "0 0 22px" }}>
            {mode === "login" ? "Entre para ver demandas, propostas e o feed." : "Leva menos de um minuto."}
          </p>

          {aviso && <div className="cd-notice" role="status">{aviso}</div>}
          <div className="cd-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "login"} className={`cd-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Entrar</button>
            <button type="button" role="tab" aria-selected={mode === "cadastro"} className={`cd-tab ${mode === "cadastro" ? "active" : ""}`} onClick={() => setMode("cadastro")}>Criar conta</button>
          </div>

          {mode === "login" ? <LoginForm onLogin={onLogin} /> : <CadastroForm onCadastrar={onCadastrar} onLegal={setLegal} />}

          <div style={{ marginTop: 26, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 10, textAlign: "center" }}>
              Testar rapidamente com uma conta de demonstração
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="cd-btn cd-btn-secondary cd-btn-full cd-btn-sm" onClick={() => onDemoLogin("u_negocio_1")}>
                <Building2 size={14} /> Como negócio
              </button>
              <button type="button" className="cd-btn cd-btn-secondary cd-btn-full cd-btn-sm" onClick={() => onDemoLogin("u_free_2")}>
                <Briefcase size={14} /> Como freelancer
              </button>
            </div>
            <button type="button" className="cd-btn cd-btn-ghost cd-btn-full cd-btn-sm" style={{ marginTop: 8 }} onClick={() => onDemoLogin("u_admin")}>
              <ShieldCheck size={14} /> Entrar como moderador
            </button>
          </div>
          <LinksLegais onAbrir={setLegal} />
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

function CadastroForm({ onCadastrar, onLegal }) {
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
  const [whatsapp, setWhatsapp] = useState("");
  const [aceite, setAceite] = useState(false);
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
    if (whatsapp && !telefoneValido(whatsapp)) e.whatsapp = "Informe DDD e número, ex: (15) 99999-9999.";
    if (!aceite) e.aceite = "Para criar a conta, aceite os Termos de uso e a Política de privacidade.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const dados =
      tipo === "negocio"
        ? { tipo, nome: nome.trim(), email: email.trim(), senha, aceiteTermosEm: Date.now(), whatsapp: soDigitos(whatsapp), emailContato: email.trim(), localizacao: localizacao.trim(), setor: setor.trim(), descricaoNegocio: descricaoNegocio.trim(), fotoUrl: "" }
        : { tipo, nome: nome.trim(), email: email.trim(), senha, aceiteTermosEm: Date.now(), whatsapp: soDigitos(whatsapp), emailContato: email.trim(), localizacao: localizacao.trim(), especialidade, descricaoFreelancer: descricaoFreelancer.trim(), faixaPreco: faixaPreco.trim(), fotoUrl: "", formacao: [] };

    const res = onCadastrar(dados);
    if (res.error) setFinalError(res.error);
  }

  if (step === 1) {
    return (
      <form onSubmit={irParaStep2}>
        <div className="cd-field">
          <label className="cd-label">Você é...</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button type="button" className="cd-choice" aria-pressed={tipo === "negocio"} onClick={() => setTipo("negocio")}>
              <Building2 size={18} color={tipo === "negocio" ? "var(--accent)" : "var(--ink-muted)"} />
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>Negócio</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>Quero publicar demandas</div>
            </button>
            <button type="button" className="cd-choice" aria-pressed={tipo === "freelancer"} onClick={() => setTipo("freelancer")}>
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
      <Field label="WhatsApp (opcional)" error={errors.whatsapp} hint="Só aparece para quem contratar você ou for contratado por você.">
        <input className={`cd-input ${errors.whatsapp ? "cd-input-error" : ""}`} inputMode="tel" placeholder="(15) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(mascaraTelefone(e.target.value))} />
      </Field>
      <label className="cd-consent">
        <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} aria-invalid={errors.aceite ? true : undefined} />
        <span>
          Li e aceito os <button type="button" onClick={() => onLegal("termos")}>Termos de uso</button> e a{" "}
          <button type="button" onClick={() => onLegal("privacidade")}>Política de privacidade</button>.
        </span>
      </label>
      {errors.aceite && <div className="cd-error" style={{ marginTop: -8, marginBottom: 12 }} role="alert">{errors.aceite}</div>}
      {finalError && <div className="cd-error" style={{ marginBottom: 12 }}>{finalError}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="cd-btn cd-btn-secondary" onClick={() => setStep(1)}><ChevronLeft size={15} /> Voltar</button>
        <button type="submit" className="cd-btn cd-btn-primary" style={{ flex: 1 }}>Criar conta</button>
      </div>
    </form>
  );
}
