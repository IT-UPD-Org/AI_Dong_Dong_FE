export const allowedDomains = ['@phuongdong.edu.vn', '@pduni.edu.vn'];
export function validateInstitutionEmail(email: string) { return allowedDomains.some((domain) => email.toLowerCase().endsWith(domain)); }
export async function mockSignIn(email: string, password: string) { await new Promise((r) => setTimeout(r, 500)); if (!validateInstitutionEmail(email) || password.length < 6) throw new Error('Use your institutional email and a password with at least 6 characters.'); return { email }; }
