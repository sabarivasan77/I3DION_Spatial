// Check Vercel env vars via REST API
import https from 'https';

const TOKEN = 'vck_6CPJ1EQSbFRS6v0amgqwxXLbY6BagMYBVX4ef4jZkgqv5iyaGH1YKbUO';
const PROJECT_ID = 'prj_6n9YMeCpoFD6dsJcK3ebmiWguarQ'; // from .vercel/project.json
const TEAM_ID = 'team_SwW4JmDznkYq02ME9ARNtr9E'; // from .env.local JWT

function apiRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Try listing env vars
  const url = `/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
  console.log('Checking:', url);
  const result = await apiRequest(url);
  console.log('Status:', result.status);
  if (result.body?.envs) {
    const envs = result.body.envs;
    console.log('Environment variables count:', envs.length);
    for (const env of envs) {
      console.log(`  ${env.key} [${env.target?.join(',')}] = ${env.type === 'encrypted' ? '***' : env.value}`);
    }
  } else {
    console.log('Response:', JSON.stringify(result.body, null, 2));
  }
}

main().catch(console.error);
