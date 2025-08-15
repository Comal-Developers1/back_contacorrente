import express from "express";
import cors from "cors";
import { conexaOracle } from "./db/db.js"; // IMPORTA SUA CONEXÃO PERSONALIZADA

const app = express();
const PORT = 3000;

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

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});