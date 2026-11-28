import express from "express";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";
import "dotenv/config";
import { loadUser } from "./middleware/auth";
import { handleError, handleNotFound } from "./middleware/errors";
import indexRouter from "./routes/index";
import { formatNumber } from "./utils/format-number";
import { formatPlayerName } from "./utils/format-player-name";
import { formatBattleModifiers } from "./presentation/battle";
import { formatCharacterClass } from "./presentation/characters";

export const app = express();
const port = Number(process.env.PORT ?? 3000);

// View engine configuration
app.set("view engine", "ejs");
app.locals.formatNumber = formatNumber;
app.locals.formatPlayerName = formatPlayerName;
app.locals.formatBattleModifiers = formatBattleModifiers;
app.locals.formatCharacterClass = formatCharacterClass;
app.set("views", path.join(__dirname, "../src/views"));

// Layout configuration
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  }),
);

// Load the currently authenticated user
app.use(loadUser);
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Routes
app.use("/", indexRouter);
app.use(handleNotFound);
app.use(handleError);

if (require.main === module) {
  app.listen(port, (error) => {
    if (error) throw error;

    console.log(`Server running at http://localhost:${port}`);
  });
}
