import { init } from "@instantdb/react";
import schema from "../instant.schema";

// Pick of Gods Configuration
// Using the Client ID provided by the project settings
const INSTANT_APP_ID = "13f19b79-d6e2-49b2-b26a-630243051890";

export const db = init({
    appId: INSTANT_APP_ID,
    schema,
    useDateObjects: true,
});
