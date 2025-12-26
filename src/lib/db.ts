import { init, id, tx } from "@instantdb/react";
import schema from "../instant.schema";

// Pick of Gods Configuration
// InstantDB Auth App: "Pick of Gods (Sign in)"
// Client ID from production settings
const INSTANT_APP_ID = "13f19b79-d6e2-49b2-b26a-630243051890";

export { id, tx };

export const db = init({
    appId: INSTANT_APP_ID,
    schema,
    useDateObjects: true,
});
