import { authHeaders, buildApiUrl } from '../api/client';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export interface PreviewFile {
  id?: string;
  name: string;
  url: string;
  extension: string;
  size?: number;
  source?: 'attachment' | 'source' | 'link' | 'generated';
}

export type FileCategory = 'pdf' | 'word' | 'excel' | 'csv' | 'image' | 'archive' | 'code' | 'other';

export function getFileExtension(filenameOrUrl: string): string {
  if (!filenameOrUrl) return '';
  try {
    const clean = filenameOrUrl.split('#')[0].split('?')[0];
    const parts = clean.split('.');
    if (parts.length > 1) {
      return (parts.pop() || '').toLowerCase();
    }
  } catch {
    // fallback
  }
  return '';
}

export function isSupportedPreviewExtension(ext: string): boolean {
  const cleanExt = ext.toLowerCase().replace(/^\./, '');
  return ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv'].includes(cleanExt);
}

export function canPreviewDirectly(ext: string): boolean {
  const cleanExt = ext.toLowerCase().replace(/^\./, '');
  // .doc is an older binary Word format that cannot be parsed by mammoth in-browser
  return ['pdf', 'docx', 'xlsx', 'xls', 'csv'].includes(cleanExt);
}

export function getFileCategory(ext: string): FileCategory {
  const clean = ext.toLowerCase().replace(/^\./, '');
  switch (clean) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'word';
    case 'xls':
    case 'xlsx':
      return 'excel';
    case 'csv':
      return 'csv';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'gif':
    case 'svg':
      return 'image';
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return 'archive';
    case 'js':
    case 'ts':
    case 'py':
    case 'json':
    case 'sql':
    case 'html':
    case 'css':
      return 'code';
    default:
      return 'other';
  }
}

export function formatBytes(bytes?: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function fetchWithAuth(url: string): Promise<Response> {
  const targetUrl = buildApiUrl(url);
  const isSameOriginOrApi = targetUrl.startsWith('/') || targetUrl.startsWith(window.location.origin) || targetUrl.includes('/api/');
  const headers = isSameOriginOrApi ? authHeaders() : new Headers();

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Tải dữ liệu thất bại (${response.status})`);
  }

  return response;
}

export async function fetchFileBlob(url: string): Promise<Blob> {
  const response = await fetchWithAuth(url);
  return await response.blob();
}

export async function fetchFileArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetchWithAuth(url);
  return await response.arrayBuffer();
}

export async function fetchFileText(url: string): Promise<string> {
  const response = await fetchWithAuth(url);
  return await response.text();
}

export async function downloadFileWithAuth(url: string, filename: string): Promise<void> {
  try {
    const blob = await fetchFileBlob(url);
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch {
    // Fallback: If direct fetch is blocked by CORS, try open in new window
    const targetUrl = buildApiUrl(url);
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = filename || 'download';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Robust CSV parser that handles quotes, escaped quotes, newlines in fields,
 * and comma or semicolon delimiters.
 */
export function parseCsv(
  csvText: string,
  maxRows = 2000,
): { headers: string[]; rows: string[][]; totalRows: number; isTruncated: boolean } {
  if (!csvText || !csvText.trim()) {
    return { headers: [], rows: [], totalRows: 0, isTruncated: false };
  }

  // Detect delimiter: look at the first non-empty line
  const firstLine = csvText.split(/\r\n|\n|\r/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  let delimiter = ',';
  if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuote = false;
  let totalRowsCount = 0;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++;
        } else {
          insideQuote = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((f) => f.length > 0)) {
          totalRowsCount++;
          if (rows.length < maxRows) rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((f) => f.length > 0)) {
          totalRowsCount++;
          if (rows.length < maxRows) rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  // Remaining row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      totalRowsCount++;
      if (rows.length < maxRows) rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], totalRows: 0, isTruncated: false };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const isTruncated = totalRowsCount > maxRows;

  return {
    headers,
    rows: dataRows,
    totalRows: Math.max(0, totalRowsCount - 1),
    isTruncated,
  };
}

export interface SheetData {
  headers: string[];
  rows: (string | number | boolean | null)[][];
  totalRows: number;
}

export function parseExcelWorkbook(
  arrayBuffer: ArrayBuffer,
  maxRows = 2000,
): { sheetNames: string[]; sheets: Record<string, SheetData> } {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames || [];
  const sheets: Record<string, SheetData> = {};

  for (const name of sheetNames) {
    const worksheet = workbook.Sheets[name];
    if (!worksheet) continue;

    // Convert sheet to 2D array of rows
    const rawData = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (!rawData || rawData.length === 0) {
      sheets[name] = { headers: [], rows: [], totalRows: 0 };
      continue;
    }

    const firstRow = rawData[0] as (string | number | boolean | null)[];
    const headers = firstRow.map((cell, idx) => (cell !== null && cell !== undefined && String(cell).trim() !== '' ? String(cell) : `Cột ${idx + 1}`));
    const dataRows = rawData.slice(1, maxRows + 1) as (string | number | boolean | null)[][];

    sheets[name] = {
      headers,
      rows: dataRows,
      totalRows: Math.max(0, rawData.length - 1),
    };
  }

  return { sheetNames, sheets };
}

export async function parseDocxToHtml(arrayBuffer: ArrayBuffer): Promise<{ html: string; warnings: string[] }> {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const warnings = result.messages.map((m) => m.message);
  return {
    html: result.value,
    warnings,
  };
}
