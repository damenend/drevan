import express from "express";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";
import "dotenv/config";
import { loadUser } from "./middleware/auth";
import indexRouter from "./routes/index";

const app = express();
const PORT = 3000;

// View engine configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
