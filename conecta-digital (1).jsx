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
  Newspaper,
  Heart,
  UserPlus,
  Send,
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
  if (count >= 10) return { label: "Selo ouro", desc: "10+ trabalhos concluídos" };
  if (count >= 5) return { label: "Selo prata", desc: "5+ trabalhos concluídos" };
  if (count >= 1) return { label: "Selo bronze", desc: "1º trabalho concluído" };
  return null;
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

    .cd-link { cursor: pointer; font-weight: 600; transition: color 0.15s ease; }
    .cd-link:hover { color: var(--accent); }
    .cd-feed-icon {
      width: 34px; height: 34px; border-radius: 50%;
      background: var(--accent-soft); color: var(--accent);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .cd-like-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: transparent; border: none; border-radius: var(--radius-pill);
      padding: 6px 10px; font-size: 13px; font-weight: 500; color: var(--ink-muted);
      transition: all 0.15s ease;
    }
    .cd-like-btn:hover { background: var(--surface-hover); color: var(--ink); }
    .cd-like-btn.liked { color: var(--red); }
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
  const [posts, setPosts] = useState(seedPosts);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [booting, setBooting] = useState(false);

  const [screen, setScreen] = useState("feed");
  const [selectedDemandaId, setSelectedDemandaId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
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
      setScreen("feed");
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

  function criarPost({ texto, tipo }) {
    const permitidos = TIPOS_POR_PERFIL[currentUser.tipo];
    const t = (texto || "").trim();
    if (!permitidos.includes(tipo) || t.length < 3 || t.length > 500) return;
    const novo = { id: uid("post"), autorId: currentUser.id, tipo, texto: t, criadoEm: now(), curtidas: [] };
    setPosts((prev) => [novo, ...prev]);
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
        <AuthScreen onLogin={autenticar} onCadastrar={cadastrar} users={users} onDemoLogin={login} booting={booting} />
      </div>
    );
  }

  const navItemsNegocio = [
    { key: "feed", label: "Feed", icon: Newspaper },
    { key: "dashboard", label: "Minhas demandas", icon: Inbox },
    { key: "nova-demanda", label: "Nova demanda", icon: Plus },
    { key: "perfil", label: "Meu perfil", icon: Building2 },
  ];
  const navItemsFreelancer = [
    { key: "feed", label: "Feed", icon: Newspaper },
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
    posts,
    criarPost,
    alternarCurtida,
    removerPost,
    selectedUserId,
    abrirUsuario,
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
  const usuarios = new Map(users.map((u) => [u.id, u]));
  const propostasPorId = new Map(propostas.map((p) => [p.id, p]));
  const eventos = [];

  posts.forEach((p) => {
    if (usuarios.has(p.autorId)) eventos.push({ id: `ev_${p.id}`, kind: "post", ts: p.criadoEm, post: p });
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
  users.forEach((u) => {
    if (now() - u.criadoEm < 30 * 24 * 60 * 60 * 1000) {
      eventos.push({ id: `ev_nm_${u.id}`, kind: "novo_membro", ts: u.criadoEm, user: u });
    }
  });

  return eventos.sort((a, b) => b.ts - a.ts);
}

function NomeLink({ user, ctx }) {
  return (
    <span className="cd-link" onClick={() => ctx.abrirUsuario(user.id)}>
      {user.nome}
    </span>
  );
}

function FeedComposer({ ctx }) {
  const tipos = TIPOS_POR_PERFIL[ctx.currentUser.tipo];
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState(tipos[0]);
  const [erro, setErro] = useState("");

  function publicar() {
    const t = texto.trim();
    if (t.length < 3) { setErro("Escreva pelo menos 3 caracteres."); return; }
    if (t.length > 500) { setErro("O limite é de 500 caracteres."); return; }
    ctx.criarPost({ texto: t, tipo });
    setTexto("");
    setErro("");
  }

  return (
    <div className="cd-card" style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar nome={ctx.currentUser.nome} fotoUrl={ctx.currentUser.fotoUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            className={`cd-textarea ${erro ? "cd-input-error" : ""}`}
            style={{ minHeight: 70 }}
            placeholder={
              ctx.currentUser.tipo === "freelancer"
                ? "Compartilhe uma dica, um trabalho recente ou uma novidade…"
                : "Conte uma novidade do negócio ou o que você está procurando…"
            }
            value={texto}
            onChange={(e) => { setTexto(e.target.value); if (erro) setErro(""); }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <select className="cd-select" style={{ width: "auto" }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {tipos.map((t) => (
                <option key={t} value={t}>{TIPOS_POST[t].label}</option>
              ))}
            </select>
            <span className="cd-hint" style={{ marginLeft: "auto" }}>{texto.length}/500</span>
            <button className="cd-btn cd-btn-primary cd-btn-sm" onClick={publicar}>
              <Send size={14} /> Publicar
            </button>
          </div>
          {erro && <div className="cd-error" style={{ marginTop: 6 }}>{erro}</div>}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, ctx }) {
  const autor = ctx.users.find((u) => u.id === post.autorId);
  if (!autor) return null;
  const curtiu = post.curtidas.includes(ctx.currentUser.id);
  const tipo = TIPOS_POST[post.tipo];
  const subtitulo = autor.tipo === "freelancer" ? autor.especialidade : autor.setor;
  const concluidos = autor.tipo === "freelancer" ? trabalhosConcluidos(autor.id, ctx.demandas, ctx.propostas) : 0;

  return (
    <div className="cd-card">
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => ctx.abrirUsuario(autor.id)}>
          <Avatar nome={autor.nome} fotoUrl={autor.fotoUrl} />
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
          <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{post.texto}</p>
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
          <div
            key={key}
            className={`cd-tab ${filtro === key ? "active" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => { setFiltro(key); setLimite(15); }}
          >
            {label}
          </div>
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
  const postsDoUsuario = ctx.posts.filter((p) => p.autorId === u.id).sort((a, b) => b.criadoEm - a.criadoEm);

  return (
    <div className="cd-fade-in" style={{ maxWidth: 620 }}>
      <button className="cd-btn cd-btn-ghost cd-btn-sm" style={{ marginBottom: 18, paddingLeft: 4 }} onClick={() => ctx.setScreen("feed")}>
        <ChevronLeft size={16} /> Voltar ao feed
      </button>

      <div className="cd-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
          <Avatar nome={u.nome} fotoUrl={u.fotoUrl} size={56} />
          <div>
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
   Roteador simples de telas
------------------------------------------------------------------------- */

function ScreenRouter({ screen, ctx }) {
  if (screen === "demanda" && ctx.selectedDemandaId) {
    return <DemandaDetail ctx={ctx} />;
  }
  if (screen === "feed") return <FeedScreen ctx={ctx} />;
  if (screen === "usuario" && ctx.selectedUserId) return <PerfilPublico ctx={ctx} />;
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
