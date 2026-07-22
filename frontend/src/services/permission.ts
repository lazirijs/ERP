import { ElMessage } from "element-plus";
import AuthStore from "@/modules/auth/store";
import { t } from "@/translate";

// Guard for dialog `open()` handlers and other programmatic actions. Disabled buttons cover the
// obvious entry points, but a dialog can still be opened by a grid row-click, a calendar-cell
// click, or any other caller — so the check lives in `open()` itself, where every path goes
// through it. Returns false (and tells the user why) when the key is missing.
export const ensurePermission = (permission: string) => {
  if (AuthStore().hasPermission(permission)) return true;
  ElMessage.error(t("noPermissionForThisAction"));
  return false;
};

export default { ensurePermission };
