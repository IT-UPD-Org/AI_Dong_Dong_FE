import { documents } from '../mocks/data';
export async function listDocuments() { return documents; }
export async function queueDocument(file: File) { return { name: file.name, status: 'Processing' as const, progress: 0 }; }
