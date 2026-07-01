import "express";

declare global {
  namespace Express {
    // Augmenting Express.User (rather than Request.user directly) is required
    // because @types/passport declares `Request.user?: Express.User`, which
    // otherwise overrides any inline augmentation of `Request.user`.
    interface User {
      userId: string;
      email: string;
      role: string;
    }
  }
}

export {};
