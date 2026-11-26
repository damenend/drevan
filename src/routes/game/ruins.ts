import { getAuthenticatedPlayer } from "../../middleware/auth";
import {
  getPrimaryAttributes,
  getSpentPoints,
} from "../../services/character-stats";
import { Router } from "express";
import { getProgression, statAllocations } from "../../services/progression";
import {
  describeRuinsDiscovery,
  getRuinsDiscovery,
} from "../../services/ruins-discoveries";
import {
  actInRuins,
  getRuinsSupplies,
  type RuinsAction,
} from "../../services/ruins";
import {
  canMoveInRuins,
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
  const atNextFloor = position === RUINS_NEXT_FLOOR;
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
    exploredTiles:
      player.ruinsExploredTiles ?? (position === null ? [] : [position]),
    atNextFloor,
    nextFloorMarker: RUINS_NEXT_FLOOR,
    emptySquare:
      position !== null &&
      position !== RUINS_ENTRANCE &&
      !atNextFloor &&
      !discovery,
    discovery: Boolean(discovery),
    attributes: getPrimaryAttributes(player),
    progression: getProgression(player.exp, getSpentPoints(player)),
    statAllocations,
    ...(position === null ? {} : getRuinsSupplies(player.id)),
    recalledToday: player.recallDate === getGameDate(),
    message: message ?? (discovery && describeRuinsDiscovery(discovery)),
    battle,
  });
});

function parseRuinsAction(
  kind: unknown,
  rawDestination: unknown,
): RuinsAction | null {
  switch (kind) {
    case "enter":
    case "exit":
    case "recall":
      return { kind };
    case "move": {
      const destination = parseFormInteger(rawDestination);
      return destination === null ? null : { kind, destination };
    }
    default:
      return null;
  }
}

router.post("/action", (req, res) => {
  const revision = parseFormInteger(req.body?.revision);
  const action = parseRuinsAction(req.body?.action, req.body?.destination);
  if (revision === null || !action) return res.redirect(303, "/game/ruins");

  const result = actInRuins(getAuthenticatedPlayer(res).id, revision, action);
  if (result.battle) req.session.ruinsBattle = result.battle;
  const path = result.left ? "/game/nexaris" : "/game/ruins";
  const query = new URLSearchParams();
  if (result.message) query.set("message", result.message);
  if (!result.left && (action.kind === "enter" || action.kind === "move"))
    query.set("focus", "map");
  return res.redirect(303, query.size ? `${path}?${query}` : path);
});

export default router;
