import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão definidos no arquivo .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  console.log(`🔌 Testando conexão com o Supabase em: ${url}`);
  try {
    const { data, error } = await supabase.from('empresas').select('*').limit(1);
    
    if (error) {
      console.error("❌ Erro ao conectar ou ao acessar a tabela 'empresas':", error.message);
    } else {
      console.log("✅ Sucesso! Conexão estabelecida e autenticada.");
      console.log("📄 Tabela 'empresas' lida com sucesso (retornou", data.length, "registros).");
    }
  } catch (err) {
    console.error("❌ Falha crítica ao conectar:", err);
  }
}

testConnection();
