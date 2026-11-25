# Run Drevan locally

These steps set up a local development server with a fresh item catalog. Run commands from the repository root.

1. Install Git and `nvm`, then select the project Node version from [`.nvmrc`](../../.nvmrc). On a new machine, run `nvm install` first.

   ```sh
   nvm use
   node --version
   ```

2. Set up Yarn through Corepack. If the selected Node installation has no `$NVM_BIN/corepack`, run `npm install --global corepack` under that Node version first. Yarn uses the version specified in [`package.json`](../../package.json).

   ```sh
   "$NVM_BIN/corepack" enable yarn
   yarn install
   ```

3. If this checkout has no `.env`, copy the sample with `cp .env.example .env`. Set `SESSION_SECRET` to a private local value and leave `DATABASE_URL=./data/game.sqlite` for local development. `PORT` defaults to `3000`. An existing `.env` may already have local settings you want to keep.
4. Follow [Set up a fresh local database](database.md#set-up-a-fresh-local-database) to create the tables and seed the items. Signup requires the seeded Lesser Potion.
5. Start the app and Sass watchers.

   ```sh
   yarn dev
   ```

6. Open [localhost on port 3000](http://localhost:3000/) or the port printed by the server. Create a test account and check that it opens The Quarters with starter supplies. Stop the watchers with Ctrl+C.

Use [database troubleshooting](database.md#troubleshooting) for connection or migration errors and the [contributor workflow](workflow.md) for checks and build commands.
