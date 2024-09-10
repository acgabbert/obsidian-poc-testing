import { writable } from "svelte/store";
import type { SvelteSidebar } from "../utils";

const sidebar = writable<SvelteSidebar>();
export default { sidebar };