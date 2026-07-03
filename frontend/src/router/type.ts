import type { RouteRecordRaw } from "vue-router";

export type Route = RouteRecordRaw & {
  meta: {
    auth: "required" | "optional" | "none";
    scroll?: boolean;
  };
};