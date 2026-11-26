import { getAuthenticatedPlayer } from "../../middleware/auth";
import {
  getPrimaryAttributes,
  getSpentPoints,
} from "../../services/character-stats";
import { Router } from "express";
import { getProgression, statAllocations } from "../../services/progression";
import {
  discoveryDefinitions,
  getRuinsDiscovery,
} from "../../services/ruins-discoveries";
import { actInRuins, getRuinsSupplies } from "../../services/ruins";
import {
  canMoveInRuins,
  getRuinsEncounter,
  RUINS_ENTRANCE,
  RUINS_NEXT_FLOOR,
  RUINS_SIZE,
} from "../../services/ruins-map";
import { getGameDate } from "../../utils/game-date";
import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

router.get("/", (req, res) => {
  const player = getAuthenticatedPlayer(res);
  const position = player.ruinsTile;
  const encounter = position === null ? undefined : getRuinsEncounter(position);
  const atNextFloor = position === RUINS_NEXT_FLOOR;
  const enemy = player.ruinsEnemyPending ? encounter : undefined;
  const discovery = getRuinsDiscovery(player.ruinsDiscoveries, position);
  const message =
    typeof req.query.message === "string" ? req.query.message : undefined;
  const battle =
    position !== null && req.session.ruinsBattle?.outcome === "win"
      ? req.session.ruinsBattle
      : undefined;
  if (battle) delete req.session.ruinsBattle;

  return res.render("game/ruins", {
    title: "The Ruins",
    position,
    size: RUINS_SIZE,
    entrance: RUINS_ENTRANCE,
    canMove: canMoveInRuins,
    restoreMapFocus: req.query.focus === "map",
    encounter: enemy,
    atNextFloor,
    // After manual playtesting, reveal the marker only while standing on it.
    nextFloorMarker: RUINS_NEXT_FLOOR,
    emptySquare:
      position !== null &&
      position !== RUINS_ENTRANCE &&
      !atNextFloor &&
      !encounter &&
      !discovery,
    discovery: Boolean(discovery),
    attributes: getPrimaryAttributes(player),
    progression: getProgression(player.exp, getSpentPoints(player)),
    statAllocations,
    ...(position === null ? {} : getRuinsSupplies(player.id)),
    recalledToday: player.recallDate === getGameDate(),
    message:
      message ??
      (discovery
        ? `${discoveryDefinitions[discovery.id].description} ${discovery.claimed ? "You already collected this cache." : "Return to this square to try again."}`
        : undefined),
    battle,
  });
});

router.post("/action", (req, res) => {
  const revision = parseFormInteger(req.body?.revision);
  if (revision === null) return res.redirect(303, "/game/ruins");

  const kind = req.body?.action;
  const destination = parseFormInteger(req.body?.destination);
  const id = getAuthenticatedPlayer(res).id;
  let result;
  switch (kind) {
    case "enter":
    case "exit":
    case "recall":
    case "engage":
    case "ignore":
      result = actInRuins(id, revision, { kind });
      break;
    case "move":
      if (destination === null) return res.redirect(303, "/game/ruins");
      result = actInRuins(id, revision, { kind, destination });
      break;
    default:
      return res.redirect(303, "/game/ruins");
  }

  if (result.battle) req.session.ruinsBattle = result.battle;
  const path = result.left ? "/game/nexaris" : "/game/ruins";
  const query = new URLSearchParams();
  if (result.message) query.set("message", result.message);
  if (kind === "enter" || kind === "move") query.set("focus", "map");
  return res.redirect(303, query.size ? `${path}?${query}` : path);
});

export default router;
