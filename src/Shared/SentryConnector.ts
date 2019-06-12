import * as Sentry from '@sentry/node';
import * as express from 'express';

const environment = process.env.NODE_ENV;

let _reportError: (e: Error) => void;

if (environment === 'production') {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    _reportError = Sentry.captureException;
} else {
    _reportError = console.error;
}

export const sentryRequestHandler = Sentry.Handlers.requestHandler() as express.RequestHandler;
export const sentryErrorHandler = Sentry.Handlers.errorHandler() as express.ErrorRequestHandler;
export const reportError = _reportError;
