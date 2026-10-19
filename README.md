ConectaDigital
Conectando pequenos negócios a profissionais freelancers de Sorocaba/SP.

O ConectaDigital é um projeto acadêmico desenvolvido no contexto da UPX da Facens. A plataforma propõe aproximar pequenos negócios e freelancers da região, facilitando a divulgação de demandas, o envio de propostas, o acompanhamento de trabalhos e a construção de reputação por meio de avaliações.
Status: protótipo funcional de MVP. Os dados utilizados pela aplicação são mantidos em memória; não há persistência em banco de dados ou localStorage nesta versão.

Objetivo
Simplificar a conexão entre quem precisa de um serviço e quem tem as habilidades para realizá-lo, valorizando profissionais locais e ajudando pequenos negócios a encontrar soluções para suas necessidades.
Funcionalidades
Contas e perfis
- Cadastro e login para dois tipos de perfil: Negócio e Freelancer.
- Perfis com informações, localização e dados profissionais ou comerciais.
- Acesso a contas de demonstração para testar os dois tipos de experiência.
Demandas e propostas
- Negócios podem publicar demandas com descrição, categoria e prazo.
- Freelancers podem consultar oportunidades e enviar propostas com valor, prazo e mensagem.
- Negócios podem analisar propostas e selecionar uma para iniciar a contratação.
- Acompanhamento do fluxo da demanda: Aberta → Em análise → Em andamento → Concluída.
Avaliações e reputação
- Avaliações entre negócio e freelancer após a conclusão do trabalho.
- Notas de 1 a 5 e comentários.
- Selos de experiência para freelancers conforme a quantidade de trabalhos concluídos: bronze, prata e ouro.
Comunidade e descoberta
- Feed com publicações de negócios e freelancers.
- Conteúdos de procura por profissionais, portfólio, dicas e novidades.
- Curtidas e recursos para descobrir profissionais e oportunidades por categoria.
Contatos e privacidade
- Validação de telefone e e-mail.
- Exibição de contatos condicionada às regras de contratação implementadas no protótipo.
- Telas de termos de uso e política de privacidade, com referência à LGPD.
- Recursos de denúncia e moderação previstos na experiência da plataforma.
Imagens
- Envio de imagens nos formatos JPG, PNG e WebP.
- Limite de 12 MB por imagem e até quatro fotos, conforme os controles implementados.
- Redimensionamento e compressão de imagens no navegador.
Categorias disponíveis
- Design
- Marketing Digital
- Desenvolvimento
- Fotografia
- Vídeo
- Contabilidade
- Administrativo
- Consultoria
- Eventos
- Redação
- Tecnologia
Tecnologias utilizadas
- React — construção da interface e componentes.
- JavaScript — lógica e regras de negócio do protótipo.
- CSS — estilos e layout da aplicação.
- Lucide React — ícones.
- React Hooks — gerenciamento de estado e efeitos da interface.
Como executar
O arquivo principal fornecido é conecta-digital (2).jsx. Para executar o projeto localmente, ele precisa estar dentro de uma aplicação React configurada.
1. Pré-requisitos
- Node.js e npm instalados.
- Um projeto React configurado com um bundler, como Vite.
2. Instalar dependências
Em uma aplicação React já configurada, instale as dependências utilizadas pelo componente:
npm install react react-dom lucide-react
3. Adicionar o componente
Coloque o arquivo JSX na pasta de componentes da aplicação, por exemplo:
src/
├── components/
│   └── ConectaDigital.jsx
├── App.jsx
└── main.jsx
Ajuste o nome do arquivo para ConectaDigital.jsx, se desejar, e importe o componente no App.jsx conforme o export existente no arquivo.
4. Iniciar o projeto
Se estiver usando Vite e o projeto já tiver os scripts padrão configurados:
npm run dev
Abra no navegador o endereço local informado pelo Vite.
Observação: o arquivo enviado é um componente JSX, não um projeto React completo. Para executar exatamente, confirme o export do componente e tenha os arquivos de configuração e entrada (package.json, index.html e src/main.jsx) no repositório.

Dados de demonstração
O protótipo inclui dados fictícios para permitir a exploração dos fluxos de negócio e freelancer desde o primeiro acesso. Os contatos de WhatsApp de demonstração foram configurados intencionalmente como inválidos para evitar que links de exemplo direcionem a pessoas reais.

Os dados são mantidos em memória durante a execução. Ao recarregar a página, alterações feitas durante o uso podem ser perdidas.
Limitações atuais
- Não há backend ou banco de dados persistente integrado nesta versão.
- O estado da aplicação é mantido em memória.
- A autenticação é parte do protótipo e não deve ser considerada adequada para produção sem uma implementação segura no servidor.
- Os dados iniciais são exemplos fictícios e não representam usuários reais.
- Antes de uma publicação pública, recomenda-se revisar segurança, privacidade, validação no servidor, acessibilidade e tratamento de erros.
Próximos passos sugeridos
- Implementar backend e banco de dados.
- Adicionar autenticação segura e controle de acesso no servidor.
- Persistir usuários, demandas, propostas, publicações e avaliações.
- Criar testes automatizados para os principais fluxos.
- Configurar pipeline de integração contínua e deploy.
- Revisar acessibilidade e responsividade em diferentes dispositivos.
Contexto acadêmico
Projeto ConectaDigital, desenvolvido no contexto da UPX — Facens, em Sorocaba/SP, com foco na aproximação entre pequenos negócios e profissionais freelancers locais.
Licença
Nenhuma licença de uso foi especificada neste repositório. Caso o projeto seja disponibilizado publicamente, escolha e adicione uma licença apropriada antes de autorizar formalmente seu uso, cópia ou distribuição.
