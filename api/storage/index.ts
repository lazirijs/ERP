import { env } from 'cloudflare:workers'

// Cloudflare bindings
export default env.storage; // storage = R2