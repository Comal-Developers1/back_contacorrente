# 📚 Documentação Técnica - Sistema Gerenciador Backend

## 📋 Índice
- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Endpoints](#-api-endpoints)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação](#-autenticação)
- [Configuração](#-configuração)
- [Problemas Identificados](#-problemas-identificados)
- [Recomendações](#-recomendações)

## 🎯 Visão Geral

O *Sistema Gerenciador Backend* é uma API REST desenvolvida em Node.js com TypeScript que fornece funcionalidades de autenticação, gerenciamento de permissões e acesso a dashboards do Power BI. O sistema integra com banco de dados Oracle e utiliza JWT para autenticação.

### Funcionalidades Principais:
- ✅ Autenticação de usuários via Oracle DB
- ✅ Gerenciamento de permissões por setor
- ✅ Acesso controlado a dashboards Power BI
- ✅ API REST com middleware de autenticação

## 🏗️ Arquitetura


┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Oracle DB     │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (PCEMPR)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Power BI      │
                       │   Dashboards    │
                       └─────────────────┘


### Padrão Arquitetural:
- *MVC (Model-View-Controller)*
- *Middleware Pattern* para autenticação
- *Service Layer* para lógica de negócio
- *Repository Pattern* para acesso a dados

## 🛠️ Tecnologias

### Backend:
- *Node.js* v18+
- *TypeScript* v5.9.2
- *Express.js* v5.1.0
- *Oracle Database* (oracledb v4.1.0)
- *JWT* (jsonwebtoken v9.0.2)
- *CORS* v2.8.5

### Desenvolvimento:
- *tsx* para execução em desenvolvimento
- *dotenv* para variáveis de ambiente

## 📁 Estrutura do Projeto


gerenciador_backend/
├── src/
│   ├── controlles/              # ❌ Deveria ser 'controllers'
│   │   ├── controle.login.controlle.ts
│   │   └── dashboard.link.controlle.ts
│   ├── db/
│   │   └── oracle.db.ts        # Conexão com Oracle
│   ├── middlewares/
│   │   └── auth.middleware.ts   # Middleware de autenticação
│   ├── routers/                # ❌ Deveria ser 'routes'
│   │   ├── routr.login.routr.ts
│   │   ├── dashboard_link.routers.ts
│   │   └── backoffice_permissoes.routers.ts
│   ├── services/               # Lógica de negócio
│   │   ├── login.service.ts
│   │   ├── dashboard.link.service.ts
│   │   └── backoffice-permissoes.service.ts
│   ├── utils/
│   │   └── FormatandoJson.ts   # Utilitário para formatação
│   ├── types/                  # Tipos TypeScript
│   ├── schemas/                # Schemas de validação
│   └── index.ts                # Ponto de entrada
├── permissoes.json             # Arquivo de permissões
├── package.json
├── tsconfig.json
└── README.MD


## 🔌 API Endpoints

### 🔐 Autenticação

#### POST /login
*Descrição:* Autentica usuário e retorna token JWT

*Request Body:*
json
{
  "login": "string",
  "senha": "string"
}


*Response Success (200):*
json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": "NOME_GUERRA",
  "codsetor": 1,
  "descricao": "SETOR_DESCRICAO",
  "nome": "NOME_COMPLETO"
}


*Response Error (401):*
json
{
  "mensagem": "Login ou senha incorreta"
}


### 📊 Dashboard Links

#### GET /dashboard-links
*Descrição:* Retorna links do Power BI organizados por categoria

*Headers:*

Authorization: Bearer <token>


*Response (200):*
json
{
  "links": {
    "vendas": [
      "https://app.powerbi.com/view?r=...",
      "http://192.168.1.115:3008/rankingcontacorrete"
    ],
    "financeiro": [
      "LINK_FLUXO_CAIXA",
      "LINK_RESUMO_FIN"
    ],
    "logistica": [
      "LINK_ESTOQUE",
      "LINK_TRANSPORTE"
    ],
    "diretoria": [
      "https://app.powerbi.com/view?r=...",
      "https://app.powerbi.com/view?r=..."
    ]
  }
}


### 🔑 Permissões Backoffice

#### GET /api/permissoes
*Descrição:* Retorna todas as permissões do sistema

*Response (200):*
json
{
  "1": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  "2": [6, 5, 4],
  "3": [7, 6, 1, 2],
  "16": [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2, 12, 13]
}


#### POST /api/permissoes
*Descrição:* Atualiza permissões do sistema

*Request Body:*
json
{
  "1": [1, 2, 3],
  "2": [4, 5, 6]
}


*Response (200):*
json
{
  "ok": true
}


## 🗄️ Banco de Dados

### Conexão Oracle
- *Driver:* oracledb v4.1.0
- *Tabelas Principais:*
  - PCEMPR - Dados dos funcionários
  - PCSETOR - Dados dos setores

### Query de Autenticação
sql
SELECT *
FROM (
  SELECT 
  conectar.NOME_GUERRA AS usuario, 
  DECRYPT(conectar.SENHA, conectar.NOME_GUERRA) AS senha,
  conectar.codsetor,
  conectar.descricao,
  conectar.nome       
  FROM (
    SELECT pcempr.NOME_GUERRA, 
    pcempr.SENHABD AS SENHA,
    pcsetor.codsetor,
    pcsetor.descricao,
    pcempr.nome
    FROM PCEMPR, pcsetor
    where pcempr.codsetor = pcsetor.codsetor
  ) conectar
) RESULT
WHERE UPPER(RESULT.usuario) = UPPER(:login)
AND UPPER(RESULT.senha) = UPPER(:senha)


## 🔐 Autenticação

### Fluxo de Autenticação:
1. *Login:* Usuário envia credenciais
2. *Validação:* Sistema consulta Oracle DB
3. *Token:* Gera JWT com dados do usuário
4. *Middleware:* Valida token em rotas protegidas

### JWT Payload:
json
{
  "usuario": "NOME_GUERRA",
  "iat": 1234567890,
  "exp": 1234571490
}


### Middleware de Autenticação:
typescript
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ mensagem: "Token não fornecido" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).usuario = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ mensagem: "Token inválido" });
  }
}


## ⚙️ Configuração

### Variáveis de Ambiente (.env)
env
# Banco de Dados Oracle
DB_USER=usuario_oracle
DB_PASSWORD=senha_oracle
DB_CONNECT_STRING=localhost:1521/XE

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=1h

# Servidor
PORT=3004


### Scripts Disponíveis:
json
{
  "dev": "tsx watch --env-file .env src/index.ts",
  "test": "echo \"Error: no test specified\" && exit 1"
}


## ⚠️ Problemas Identificados

### 🔴 Críticos
1. *CORS Inseguro:* origin: "*" permite qualquer origem
2. *Criptografia Vulnerável:* Chave baseada no nome de usuário
3. *Conexões Não Fechadas:* Memory leaks potenciais
4. *Catch Vazio:* Erros ignorados no login.service.ts

### 🟡 Importantes
1. *Nomenclatura Inconsistente:* controlles vs controllers
2. *Tipagem Fraca:* Uso excessivo de any
3. *Logs Insuficientes:* Falta de logging estruturado
4. *Hardcoded URLs:* Links Power BI no código

### 🟢 Melhorias
1. *Estrutura de Pastas:* Reorganizar nomenclatura
2. *Validação de Entrada:* Implementar schemas
3. *Pool de Conexões:* Otimizar conexões Oracle
4. *Documentação:* Adicionar JSDoc

## 🚀 Recomendações

### Segurança
typescript
// ✅ CORS Seguro
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// ✅ Validação de Entrada
import Joi from 'joi';

const loginSchema = Joi.object({
  login: Joi.string().required(),
  senha: Joi.string().min(6).required()
});


### Banco de Dados
typescript
// ✅ Pool de Conexões
const pool = await oracledb.createPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1
});


### Tratamento de Erros
typescript
// ✅ Logging Estruturado
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});


### Estrutura Melhorada

src/
├── controllers/
│   ├── auth.controller.ts
│   └── dashboard.controller.ts
├── routes/
│   ├── auth.routes.ts
│   └── dashboard.routes.ts
├── services/
│   ├── auth.service.ts
│   └── dashboard.service.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── validation.middleware.ts
├── database/
│   ├── connection.ts
│   └── queries.ts
├── utils/
│   ├── logger.ts
│   └── formatters.ts
├── types/
│   ├── auth.types.ts
│   └── dashboard.types.ts
└── schemas/
    ├── auth.schema.ts
    └── dashboard.schema.ts


## 📞 Suporte

Para dúvidas ou problemas:
- *Desenvolvedor:* Equipe de Desenvolvimento
- *Sistema:* Gerenciador Backend v1.0.0
- *Última Atualização:* Dezembro 2024

---

*⚠️ IMPORTANTE:* Esta documentação foi gerada automaticamente. Sempre verifique as informações mais recentes no código fonte.
