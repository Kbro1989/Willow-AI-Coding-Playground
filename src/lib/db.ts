import { init } from "@instantdb/react";
import schema from "../instant.schema";

// Pick of Gods Configuration
// Using the Client ID provided by the project settings
const INSTANT_APP_ID = "af4e550c-12a0-400c-913e-610161182ee7";

export const db = init({
    appId: INSTANT_APP_ID,
    schema,
    useDateObjects: true,
});
