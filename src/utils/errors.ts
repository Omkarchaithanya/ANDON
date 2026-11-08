/**
 * @module errors
 * @description Standardized error hierarchy for the ANDON Forge application.
 */

export class AndonError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code = 'ANDON_INTERNAL_ERROR', statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AndonError {
  constructor(entityOrMessage: string, id?: string) {
    const msg = id !== undefined
      ? `${entityOrMessage} with identifier "${id}" was not found.`
      : entityOrMessage;
    super(msg, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends AndonError {
  public readonly validationErrors?: Record<string, string>;

  constructor(message: string, validationErrors?: Record<string, string>) {
    super(message, 'VALIDATION_FAILED', 400);
    this.validationErrors = validationErrors;
  }
}

export class AuthorizationError extends AndonError {
  constructor(message = 'User is not authorized to perform this action.') {
    super(message, 'UNAUTHORIZED', 403);
  }
}

export class PermissionDeniedError extends AndonError {
  constructor(resource: string) {
    super(`Access denied for resource: ${resource}`, 'PERMISSION_DENIED', 403);
  }
}

export class StaleSourceError extends AndonError {
  public readonly sourceId: string;
  public readonly currentVersion: string;

  constructor(sourceId: string, currentVersion: string) {
    super(
      `Source "${sourceId}" has been modified (current version: ${currentVersion}). Refresh and review required.`,
      'STALE_SOURCE',
      409
    );
    this.sourceId = sourceId;
    this.currentVersion = currentVersion;
  }
}

export class IdempotencyConflictError extends AndonError {
  public readonly existingEntityId: string;

  constructor(message: string, existingEntityId: string) {
    super(message, 'IDEMPOTENCY_CONFLICT', 409);
    this.existingEntityId = existingEntityId;
  }
}

export class ExternalApiError extends AndonError {
  public readonly service: string;
  public readonly originalError?: unknown;

  constructor(serviceOrMessage: string, message?: string, originalError?: unknown) {
    const svc = message !== undefined ? serviceOrMessage : 'ExternalService';
    const msg =
      message !== undefined
        ? `Error communicating with ${serviceOrMessage}: ${message}`
        : serviceOrMessage;
    super(msg, 'EXTERNAL_API_ERROR', 502);
    this.service = svc;
    this.originalError = originalError;
  }
}

