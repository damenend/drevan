import "express-session";
import type { RuinsBattle } from "../services/ruins";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    ruinsBattle?: RuinsBattle;
  }
}
