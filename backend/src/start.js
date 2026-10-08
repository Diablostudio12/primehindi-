// Entry point: loads the existing server unchanged and hooks the Studios routes
// in just before it starts listening (all earlier middleware stays in effect).
import express from 'express';
import { registerStudios } from './studios.js';

const originalListen = express.application.listen;
express.application.listen = function patchedListen(...args) {
  express.application.listen = originalListen;
  try {
    registerStudios(this);
  } catch (e) {
    console.error('Studios feature failed to load:', e.message);
  }
  return originalListen.apply(this, args);
};

await import('./server.js');
