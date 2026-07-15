import { env } from 'cloudflare:workers'

// Cloudflare bindings
export default env.ai_db; // ai_db = D1 (AI feature only, separate from the management db)
