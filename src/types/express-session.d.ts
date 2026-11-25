import "express-session";
import type { TrainingBattle } from "../services/training";
import type { FishingReport } from "../services/fishing-cast";
import type { RuinsBattle } from "../services/ruins";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    trainingReport?: { level: number; battle: TrainingBattle | null };
    fishingReport?: FishingReport;
    ruinsBattle?: RuinsBattle;
  }
}
