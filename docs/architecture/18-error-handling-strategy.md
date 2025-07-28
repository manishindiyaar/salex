# 18. Error Handling Strategy

## Error Flow

This diagram illustrates how an error is caught and processed from the backend all the way to the user's screen.

```mermaid
sequenceDiagram
    participant App as React Native App
    participant Axios as API Client (in App)
    participant API as Backend API
    participant Filter as GlobalExceptionFilter (in API)
    participant Sentry
    participant Logger

    API->>API: An error occurs in a service (e.g., database error)
    API-->>Filter: NestJS catches the unhandled exception
    
    Filter->>Sentry: Report full error with stack trace
    Filter->>Logger: Log structured error details
    
    Filter-->>API: Formats a standardized JSON error response
    API-->>Axios: Sends HTTP error (e.g., 500) with JSON body
    
    Axios->>App: Rejects promise with formatted error
    App->>App: Catches error in service layer
    App->>App: Displays a user-friendly message (e.g., Toast)




    Error Response Format
To ensure consistency, all errors returned from the backend API will follow this standard JSON structure:

TypeScript

interface ApiError {
  error: {
    statusCode: number;
    code: string; // e.g., 'VALIDATION_ERROR', 'INTERNAL_SERVER_ERROR'
    message: string; // User-friendly message
    details?: Record<string, any>; // For field-specific validation errors
    timestamp: string;
    requestId: string; // For tracing
  };
}
Frontend Error Handling
API Errors: We will use an Axios interceptor to catch all API errors in a single place. This interceptor will parse the standard error response from the backend and can trigger global notifications (e.g., a toast message).

TypeScript

// src/services/apiClient.ts (interceptor part)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data?.error;
    if (apiError) {
      // Show a toast notification with apiError.message
      console.error('API Error:', apiError);
    }
    return Promise.reject(error);
  }
);
UI Rendering Errors: The entire application will be wrapped in a React Error Boundary. This is a component that catches JavaScript errors anywhere in the component tree. Instead of crashing, the app will display a friendly fallback screen, and the error will be reported to Sentry.

Backend Error Handling
Centralized Exception Filter: We will implement a single Global Exception Filter in NestJS. This filter will catch all unhandled exceptions, ensuring we never leak stack traces or sensitive information to the client.

TypeScript

// apps/api/src/core/filters/global-exception.filter.ts (simplified)
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Report to Sentry
    Sentry.captureException(exception);

    // Format the response body
    const responseBody = {
      error: {
        statusCode: httpStatus,
        message: (exception as any).message || 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: (request as any).id,
      },
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}