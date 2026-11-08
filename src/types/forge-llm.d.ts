declare module '@forge/llm' {
  export interface ForgeLlmMessage {
    role: string;
    content: string;
  }

  export interface ForgeLlmGenerateOptions {
    model?: string;
    messages: ForgeLlmMessage[];
    responseFormat?: any;
    temperature?: number;
    maxTokens?: number;
  }

  export interface ForgeLlmResponse {
    content: string;
    raw?: any;
  }

  export const forge: {
    llm: {
      generate: (options: ForgeLlmGenerateOptions) => Promise<ForgeLlmResponse>;
    };
  };
}
