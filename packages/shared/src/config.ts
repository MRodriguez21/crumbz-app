/**
 * Single source of truth for product identity and app-wide constants.
 * Brand values live in app-identity.json so apps/mobile/app.config.ts (plain Node) can read them too.
 */
import identity from './app-identity.json';

export const APP_NAME = identity.name;

/** Store identifier (iOS bundleIdentifier / Android package). Cannot change after publishing. */
export const APP_ID = identity.id;

/** Deep link scheme: crumbz://... */
export const APP_SCHEME = identity.scheme;

export const APP_DOMAIN = identity.domain;
export const APP_URL = `https://${APP_DOMAIN}`;

export const TIMEZONE = 'America/Caracas';
export const LOCALE = 'es-VE';
export const CURRENCY = 'USD';

/** Bayesian average prior weight used by rankings (see place_rankings view). */
export const RANKING_PRIOR_WEIGHT = 5;
