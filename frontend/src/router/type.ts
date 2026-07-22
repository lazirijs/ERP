import type { RouteRecordRaw } from "vue-router";

export type Route = RouteRecordRaw & {
  meta: {
    auth: "required" | "optional" | "none";
    // The `<module>.access` key required to enter this route; enforced in the router guard.
    permission?: string;
    scroll?: boolean;
  };
};