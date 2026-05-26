const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas no .env.local!');
  process.exit(1);
}

async function verificarDatas() {
  try {
    console.log('Buscando datas limites da tabela nfe usando fetch...');
    // endpoint do PostgREST no Supabase
    const url = `${supabaseUrl}/rest/v1/nfe?select=data_emissao&order=data_emissao.asc`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Supabase: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.log('Nenhuma nota fiscal encontrada no banco.');
      return;
    }

    console.log(`Total de notas fiscais encontradas: ${data.length}`);
    console.log(`Primeira nota fiscal em: ${data[0].data_emissao}`);
    console.log(`Última nota fiscal em: ${data[data.length - 1].data_emissao}`);

    // Agrupar por ano
    const anos = {};
    data.forEach((nota) => {
      if (nota.data_emissao) {
        const ano = nota.data_emissao.substring(0, 4);
        anos[ano] = (anos[ano] || 0) + 1;
      }
    });

    console.log('Notas fiscais por ano:', anos);
  } catch (error) {
    console.error('Erro ao verificar datas:', error.message);
  }
}

verificarDatas();
