export default {};
export const promises = {};
export function readFileSync() { throw new Error("fs.readFileSync is not supported in browser"); }
export function writeFileSync() { throw new Error("fs.writeFileSync is not supported in browser"); }
export const constants = {};
const notSupported = async () => { throw new Error("File system not supported in browser"); };
export const mkdir = notSupported;
export const readdir = notSupported;
export const stat = notSupported;
export const access = notSupported;
export const rm = notSupported;
export const readFile = notSupported;
export const writeFile = notSupported;
export const open = notSupported;
export const opendir = notSupported;
