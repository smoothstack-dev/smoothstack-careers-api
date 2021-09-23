
import { handlerPath } from "@libs/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "get",
        path: "webinar-redirect",
        cors: {
          origin: "*",
          headers: ["Content-Type"],
        },
      },
    },
  ],
};
