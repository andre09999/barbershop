# AgendaPro API

API multiempresa para agendamentos de barbearias, salões e clínicas. A aplicação aplica isolamento por empresa, controle de acesso por função e confirmação opcional pela API oficial do WhatsApp Cloud.

## Perfis e permissões

- `PLATFORM_ADMIN`: cria estabelecimentos e o primeiro perfil responsável.
- `BUSINESS_OWNER`: gerencia apenas serviços, profissionais, horários e reservas da própria empresa.
- `CUSTOMER`: consulta os próprios agendamentos.

## Execução local

1. Copie `.env.example` para `.env` e preencha valores locais.
2. Instale as dependências com `npm install`.
3. Crie a estrutura com `npm run db:dev -- --name initial`.
4. Inicie com `npm run dev`.

A API responde em `http://localhost:4000` e o diagnóstico está em `GET /health`.

## WhatsApp Cloud

O envio automático usa um template previamente aprovado na Meta. Configure `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_TEMPLATE_NAME` e `WHATSAPP_TEMPLATE_LANGUAGE`. O token permanece apenas no backend; nunca deve ser enviado ao React ou versionado.

Parâmetros esperados no corpo do template, nesta ordem:

1. nome do cliente;
2. nome do estabelecimento;
3. serviço;
4. data;
5. horário.

Sem essas variáveis, o agendamento continua sendo criado e a interface oferece uma confirmação manual pelo WhatsApp.

## Implantação

Use PostgreSQL gerenciado e execute `npm run db:migrate` antes de `npm start`. Configure `CORS_ORIGINS` com os domínios reais do frontend separados por vírgula.
