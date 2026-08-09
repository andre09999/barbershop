# AgendaPro

Plataforma multiempresa de agendamentos criada para barbearias, salões de beleza e clínicas. O projeto evolui a antiga landing page da Oliveer Barbearia para um produto SaaS responsivo, acessível e preparado para operação real.

## Experiência entregue

- página institucional moderna e responsiva;
- agenda personalizada por estabelecimento, com identidade e endereço próprios;
- seleção de serviço, profissional, data e horário sem conflitos;
- cadastro de serviços, duração e valores pelo responsável da empresa;
- painel exclusivo para administrador da plataforma, responsável e cliente;
- criação de novos estabelecimentos apenas pelo administrador;
- histórico de múltiplos agendamentos por cliente;
- persistência local para demonstração sem backend;
- API Node.js/PostgreSQL com autorização por função e isolamento multiempresa;
- confirmação automática preparada para a API oficial do WhatsApp Cloud;
- fallback seguro para confirmação manual quando o provedor não está configurado.

## Perfis da demonstração

Em `/entrar`, selecione um dos três perfis:

- administrador da plataforma: cadastra empresas e responsáveis;
- responsável pelo estabelecimento: gerencia catálogo, agenda e marca;
- cliente: acompanha reservas e cria novos agendamentos.

A demonstração não solicita nem armazena senhas reais. A autenticação segura está implementada na API em `server/`.

## Desenvolvimento do frontend

```bash
npm install
cp .env.example .env
npm start
```

O frontend funciona sem `REACT_APP_API_URL` usando dados locais. Para usar persistência real, aponte essa variável para a API.

## Build de produção

```bash
CI=true npm run build
```

O arquivo `netlify.toml` contém o build e o redirecionamento necessários para rotas do React. A API possui documentação própria em [`server/README.md`](server/README.md).

## Segurança

- credenciais ficam apenas em variáveis de ambiente;
- senhas são armazenadas com `bcrypt`;
- tokens JWT têm duração limitada;
- rotas são protegidas por função;
- consultas do responsável são limitadas à própria empresa;
- payloads são validados com Zod;
- a API usa Helmet, CORS restritivo e rate limiting;
- horários duplicados são impedidos por uma restrição no banco.

## Stack

React 18, React Router, Node.js 22, Express 5, Prisma, PostgreSQL, Zod e WhatsApp Cloud API.
