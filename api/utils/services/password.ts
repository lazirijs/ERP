const password = {
    hash: async (plain: string): Promise<string> => {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw', encoder.encode(plain), 'PBKDF2', false, ['deriveBits']
        );
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial, 256
        );
        const hashArray = Array.from(new Uint8Array(bits));
        const saltArray = Array.from(salt);
        // Store salt + hash together
        return JSON.stringify([ saltArray, hashArray ]);
    },
    verify: async (plain: string, stored: string): Promise<boolean> => {
        const [ salt, hash ] = JSON.parse(stored);
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw', encoder.encode(plain), 'PBKDF2', false, ['deriveBits']
        );
        const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: new Uint8Array(salt), iterations: 100000, hash: 'SHA-256' },
            keyMaterial, 256
        );
        const newHash = Array.from(new Uint8Array(bits));
        return JSON.stringify(newHash) === JSON.stringify(hash);
    }
};

export default password;