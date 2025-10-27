import express from "express";
import cors from "cors";
import { conexaOracle } from "./db/db.js"; // IMPORTA SUA CONEXÃO PERSONALIZADA
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT;

//app.use(cors()); //⬅️ Esta linha permite chamadas de outros domínios (como do front)
app.use(express.json());
app.use(
  cors({
    origin: "*", // substitua pela URL do seu front
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (req, res) => {
  res.send("API de contacorrente RCA está ativa!");
});

app.get("/contacorrente", async (req, res) => {
  try {
    const connection = await conexaOracle(); // CHAMA A FUNÇÃO PARA PEGAR A CONEXÃO

    const result = await connection.execute(`
      SELECT rca, nome, saldo,
       CASE 
        WHEN saldo > VLCORRENTEANT THEN 'Subiu'
        WHEN saldo < VLCORRENTEANT THEN 'Desceu'
        WHEN saldo = VLCORRENTEANT THEN 'Permaneceu'
        ELSE 'Indefinido'
        END AS status
        FROM 
        (SELECT PCLOGRCA.data,
        PCUSUARI.CODUSUR AS rca,
        PCUSUARI.NOME AS nome,
        pc_pkg_controlarsaldorca.ccrca_checar_saldo_atual(PCUSUARI.CODUSUR) AS saldo,
        PCLOGRCA.VLCORRENTEANT,
        ROW_NUMBER() OVER (PARTITION BY PCUSUARI.CODUSUR ORDER BY PCLOGRCA.DATA DESC) AS ultimo
        FROM 
        PCUSUARI, PCLOGRCA
        WHERE 
        PCUSUARI.CODUSUR = PCLOGRCA.CODUSUR
        AND PCUSUARI.CODUSUR IN (SELECT CODUSUR FROM PCPEDC)
        AND PCUSUARI.DTTERMINO IS NULL
        AND PCUSUARI.CODUSUR NOT IN (11,417,303,1003,1001,398,99)
       ) A
       WHERE ultimo = 1
       ORDER BY saldo DESC
    `);
    console.log(result.rows[1]);
    const data = result.rows.map((row) => ({
      rca: row[0],
      nome: row[1],
      saldo: row[2],
      status: row[3]
    }));

    res.json(data);
    
  } catch (err) {
    console.error("Erro ao consultar contacorrente:", err);
    res.status(500).send("Erro ao consultar contacorrente" + err.message);
  }
});


// ✅ Nova rota para o gráfico de linha dia
app.get("/contacorrente/alteracoes", async (req, res) => {
  const { rca } = req.query; // pega o RCA do front-end

  if (!rca) {
    return res.status(400).send("Parâmetro 'rca' é obrigatório");
  }

  try {
    const connection = await conexaOracle();

    const result = await connection.execute(`
      SELECT 
        PCUSUARI.codusur,
        PCUSUARI.NOME rca,
        PCLOGRCA.data,
        PCLOGRCA.VLCORRENTEANT alteracao
      FROM PCLOGRCA, PCUSUARI
      WHERE PCLOGRCA.CODUSUR = PCUSUARI.CODUSUR
        AND TRUNC(PCLOGRCA.DATA) = TRUNC(SYSDATE)
        AND PCUSUARI.CODUSUR = :rca
        AND NVL(PCLOGRCA.VLCORRENTE,0) <> NVL(PCLOGRCA.VLCORRENTEANT,0)
          AND PCLOGRCA.DATA BETWEEN TRUNC(SYSDATE) + INTERVAL '7' HOUR AND TRUNC(SYSDATE) + INTERVAL '19' HOUR
      ORDER BY PCUSUARI.CODUSUR, PCLOGRCA.DATA
    `, [rca]);


    const data = result.rows.map(row => ({
      codusur: row[0],
      rca: row[1],
      data: row[2],
      alteracao: row[3]
    }));

    res.json(data);

  } catch (err) {
    console.error("Erro ao consultar saldo do RCA:", err);
    res.status(500).send("Erro ao consultar saldo do RCA: " + err.message);
  }
});


// ✅ Nova rota para o gráfico da movimentação do mês
app.get("/contacorrente/alteracoes-mes", async (req, res) => {
  const { rca } = req.query;

  if (!rca) {
    return res.status(400).send("Parâmetro 'rca' é obrigatório");
  }

  try {
    const connection = await conexaOracle();

    const result = await connection.execute(`
      SELECT codusur,
       rca,
       data,
       alteracao
    FROM (
    SELECT PCUSUARI.codusur,
           PCUSUARI.NOME rca,
           PCLOGRCA.data,
           PCLOGRCA.VLCORRENTEANT alteracao,
           ROW_NUMBER() OVER (
               PARTITION BY TRUNC(PCLOGRCA.DATA)
               ORDER BY PCLOGRCA.DATA DESC
           ) AS rn
      FROM PCLOGRCA
     JOIN PCUSUARI ON PCLOGRCA.CODUSUR = PCUSUARI.CODUSUR
     WHERE PCUSUARI.CODUSUR = :rca
       AND NVL(PCLOGRCA.VLCORRENTE,0) <> NVL(PCLOGRCA.VLCORRENTEANT,0)
       AND PCLOGRCA.DATA BETWEEN TRUNC(SYSDATE, 'MM') + INTERVAL '7' HOUR
                              AND LAST_DAY(SYSDATE) + INTERVAL '19' HOUR
)
WHERE rn = 1
ORDER BY codusur, data
    `, [rca]);

    const data = result.rows.map(row => ({
      codusur: row[0],
      rca: row[1],
      data: row[2],
      alteracao: row[3]
    }));

    res.json(data);

  } catch (err) {
    console.error("Erro ao consultar movimentação mensal:", err);
    res.status(500).send("Erro ao consultar movimentação mensal: " + err.message);
  }
});


// Inicia o servidor
app.listen(PORT,"0.0.0.0", () => {
  console.log(`🚀 Servidor rodando em http://192.168.1.115:${PORT}`);
});

