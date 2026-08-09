# AgendaPro API

API Express/Prisma da plataforma AgendaPro. Em produção ela é exposta pela função `api/index.js` no mesmo domínio do frontend.

## Perfis

- `PLATFORM_ADMIN`: administra empresas, responsáveis e configurações globais.
- `BUSINESS_OWNER`: acessa somente o estabelecimento ao qual está vinculado.
- `CUSTOMER`: consulta e cancela somente os próprios agendamentos.

## Comandos

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

O diagnóstico público está em `GET /health`; ele informa somente se banco e autenticação foram configurados, sem revelar valores.

## WhatsApp Cloud

O envio automático usa um template aprovado pela Meta com nome, estabelecimento, serviço, data e horário. Configure as variáveis `WHATSAPP_*` apenas no ambiente protegido. Se o provedor não estiver configurado ou recusar a mensagem, o agendamento permanece salvo e a interface oferece contato manual com o estabelecimento.

## Persistência e auditoria

O schema PostgreSQL mantém usuários, empresas, serviços, profissionais, agendamentos, histórico de status, configurações e auditoria. Uma restrição parcial no banco impede dois agendamentos ativos para o mesmo profissional, data e horário, preservando a possibilidade de reutilizar um horário cancelado.
