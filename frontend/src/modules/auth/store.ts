import { ref } from "vue";
import { defineStore } from "pinia";
import type { Profile } from "./type";
import router from "@/router";

export default defineStore("auth", () => {
  const profile = ref<Profile>();
  const isAuthed = ref<boolean | undefined>();
  // const roles = ref<any>(null);

  const set = (data: Profile) => {
    profile.value = data;
    isAuthed.value = true;
  };

  const login = (data: Profile) => {
    set(data);
    router.push({ name: "home" });
  };

  const logout = () => {
    profile.value = undefined;
    isAuthed.value = false;
    router.push({ name: "auth-login" });
  };

  const hasPermission = (permission: string) => {
    return profile.value?.permissions?.includes(permission) ?? false;
  };

  return { profile, isAuthed, set, login, logout, hasPermission };
});