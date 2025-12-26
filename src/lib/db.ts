import { init, id, tx } from "@instantdb/react";
import schema from "../instant.schema";

// Pick of Gods Configuration
// InstantDB Auth App: "Pick of Gods (Sign in)"
// Client ID from production settings
const INSTANT_APP_ID = "af4e550c-12a0-400c-913e-610161182ee7";

export { id, tx };

export const db = init({
    appId: INSTANT_APP_ID,
    schema,
    useDateObjects: true,
});
