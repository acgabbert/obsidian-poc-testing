import { writable } from "svelte/store";
import type { SvelteSidebar } from "src/utils";

const sidebar = writable<SvelteSidebar>();
export default { sidebar };