import Constant from "../constant";
import workersai from "./workersai";
import type { Provider } from "./type";

const providers: Record<typeof Constant.provider, Provider> = {
    workersai
};

// Swap point: add an `anthropic.ts` sibling and flip Constant.provider.
// Both providers take the same JSON Schema body for tools -- only the wrapper
// key differs -- so nothing above this line changes.
export default providers[Constant.provider];
