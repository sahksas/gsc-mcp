import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { CONSTANTS } from '../constants.js';

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
        CONSTANTS.MESSAGES.ERROR.PERMISSION_DENIED
      );
    }
    
    if (errorAny?.response?.status === 404) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        CONSTANTS.MESSAGES.ERROR.RESOURCE_NOT_FOUND
      );
    }
    
    if (errorAny?.response?.status === 400) {
      throw new McpError(
        ErrorCode.InvalidParams,
        errorAny?.response?.data?.error?.message || CONSTANTS.MESSAGES.ERROR.INVALID_PARAMS
      );
    }

    throw new McpError(
      ErrorCode.InternalError,
      error.message || CONSTANTS.MESSAGES.ERROR.UNEXPECTED_ERROR
    );
  }

  throw new McpError(
    ErrorCode.InternalError,
    CONSTANTS.MESSAGES.ERROR.UNKNOWN_ERROR
  );
}