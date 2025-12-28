const notSupported = async () => { throw new Error("File system not supported in browser"); };
const notSupportedSync = () => { throw new Error("File system (sync) not supported in browser"); };

export const readFileSync = notSupportedSync;
export const writeFileSync = notSupportedSync;
export const mkdir = notSupported;
export const readdir = notSupported;
export const stat = notSupported;
export const access = notSupported;
export const rm = notSupported;
export const readFile = notSupported;
export const writeFile = notSupported;
export const open = notSupported;
export const opendir = notSupported;

export const constants = {};
export const promises = {
    mkdir, readdir, stat, access, rm, readFile, writeFile, open, opendir
};

export default {
    readFileSync, writeFileSync, mkdir, readdir, stat, access, rm, readFile, writeFile, open, opendir,
    constants, promises
};
