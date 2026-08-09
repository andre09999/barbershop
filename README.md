# AgendaPro

Plataforma SaaS multiempresa para barbearias, salões de beleza e clínicas. O projeto reúne agenda pública, gestão do estabelecimento, histórico do cliente e administração central em uma aplicação responsiva.

## Recursos

- autenticação real com senha protegida por `bcrypt` e JWT em cookie `HttpOnly`;
- controle de acesso para administrador, responsável e cliente;
- isolamento dos dados por estabelecimento;
- cadastro de empresas e responsáveis somente pelo administrador;
- serviços, preços, profissionais, identidade visual e expediente por empresa;
- consulta de disponibilidade e bloqueio transacional de horários duplicados;
- histórico de status dos agendamentos e trilha de auditoria;
- PostgreSQL serverless no Neon via Prisma;
- confirmação opcional pela API oficial do WhatsApp Cloud;
- frontend e API implantados no mesmo projeto Vercel.

## Stack

React 18, React Router 5, Express 5, Prisma 6, PostgreSQL, Zod, JWT, bcrypt e WhatsApp Cloud API.

## Desenvolvimento

1. Copie `.env.example` para `.env` e use valores locais seguros.
2. Instale as dependências com `npm install`.
3. Aplique o schema com `npm run db:deploy`.
4. Crie o administrador inicial com `npm run db:seed`.
5. Inicie o frontend com `npm start` e a API local com `node server/src/server.js`.

O frontend usa a API na mesma origem por padrão. Em desenvolvimento separado, defina `REACT_APP_API_URL` apenas se a API estiver em outro domínio.

## Banco e administrador inicial

As migrações ficam em `server/prisma/migrations`. O seed é idempotente e exige `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`. A senha deve existir somente no ambiente protegido; não há credenciais padrão no repositório.

```bash
npm run db:deploy
npm run db:seed
```

## Produção na Vercel

Configure no projeto, para `Production`, `Preview` e `Development` quando aplicável:

- `DATABASE_URL`: conexão PostgreSQL agrupada do Neon;
- `JWT_SECRET`: valor aleatório de alta entropia com pelo menos 32 caracteres;
- `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`: usados somente pelo seed inicial;
- `CORS_ORIGINS`: origens autorizadas, separadas por vírgula;
- variáveis `WHATSAPP_*` quando o envio automático estiver ativo.

Depois de vincular as variáveis, execute as migrações e o seed uma única vez antes de promover o primeiro deploy com autenticação real.

## Segurança

Senhas nunca são devolvidas pela API. Sessões usam cookies `HttpOnly`, `Secure` em produção e `SameSite=Lax`. Todas as operações privadas verificam o usuário ativo no banco, a função autorizada e o vínculo com a empresa. Payloads são validados, a API aplica Helmet, CORS restritivo e limitação de requisições.

## Verificação

```bash
CI=true npm run build
npm test -- --runInBand
npm run lint
```
