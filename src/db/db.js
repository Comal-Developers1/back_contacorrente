import oracledb from "oracledb";

export async function conexaOracle() {
  try {
    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });

    console.log("✅ Conectado ao Oracle");
    return connection;
  } catch (error) {
    console.error("❌ Erro ao conectar ou consultar no Oracle:", error);
     throw error; // ⬅️ esta linha é essencial!
  }
}

//conexaooracle();