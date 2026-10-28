declare module 'mammoth' {
  export interface ConvertMessage {
    type: 'warning' | 'error';
    message: string;
  }

  export interface ConvertResult {
    value: string;
    messages: ConvertMessage[];
  }

  export interface ConvertOptions {
    styleMap?: string[] | string;
    includeDefaultStyleMap?: boolean;
    ignoreEmptyParagraphs?: boolean;
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer } | { buffer: ArrayBufferView },
    options?: ConvertOptions,
  ): Promise<ConvertResult>;

  export function extractRawText(
    input: { arrayBuffer: ArrayBuffer } | { buffer: ArrayBufferView },
    options?: ConvertOptions,
  ): Promise<ConvertResult>;
}
