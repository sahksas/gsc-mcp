import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

export class SearchConsoleError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: string
  ) {
    super(message);
    this.name = 'SearchConsoleError';
  }
}

export function handleError(error: unknown, toolName: string): never {
  console.error(`Error in ${toolName}:`, error);

  if (error instanceof SearchConsoleError) {
    throw new McpError(
      ErrorCode.InternalError,
      error.message,
      { code: error.code, details: error.details }
    );
  }

  if (error instanceof Error) {
    // Handle Google API specific errors
    const errorAny = error as any;
    
    if (errorAny?.response?.status === 403) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Permission denied. Make sure you have the necessary permissions for this Search Console property.'
      );
    }
    
    if (errorAny?.response?.status === 404) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Resource not found. Please check the URL or resource identifier.'
      );
    }
    
    if (errorAny?.response?.status === 400) {
      throw new McpError(
        ErrorCode.InvalidParams,
        errorAny?.response?.data?.error?.message || 'Invalid request parameters.'
      );
    }

    throw new McpError(
      ErrorCode.InternalError,
      error.message || 'An unexpected error occurred'
    );
  }

  throw new McpError(
    ErrorCode.InternalError,
    'An unknown error occurred'
  );
}