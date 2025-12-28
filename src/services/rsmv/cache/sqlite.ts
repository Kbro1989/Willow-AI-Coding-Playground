import * as cache from "./index";
import { compressSqlite, decompress } from "./compression";
import { cacheMajors } from "../constants";
import { CacheIndex } from "./index";
// import * as path from "path";
// import * as fs from "fs";
//only type info, import the actual thing at runtime so it can be avoided if not used
import type * as sqlite3 from "sqlite3";


type CacheTable = {
	db: sqlite3.Database | null,
	indices: Promise<cache.CacheIndexFile>,
	readFile: (minor: number) => Promise<{ DATA: Buffer, CRC: number }>,
	readIndexFile: () => Promise<{ DATA: Buffer, CRC: number }>,
	updateFile: (minor: number, data: Buffer) => Promise<void>,
	updateIndexFile: (data: Buffer) => Promise<void>
}

export class GameCacheLoader extends cache.CacheFileSource {
	cachedir: string;
	writable: boolean;
	opentables = new Map<number, CacheTable>();
	timestamp = new Date();

	constructor(cachedir?: string, writable?: boolean) {
		super();
		if (typeof (globalThis as any).__non_webpack_require__ === "undefined") {
			// This class is Node-only. If allowed to construct in browser, it typically means
			// the bundler failed to tree-shake it, or it was instantiated by mistake.
			// We can throw or just warn. Throwing is safer to detect issues.
			// However, for type safety in isomorphic code, we might want it to exist but fail on usage.
		}
		let path = (globalThis as any).__non_webpack_require__ ? (globalThis as any).__non_webpack_require__("path") : { resolve: (a: any, b: any) => b };

		this.cachedir = cachedir || path.resolve(process.env.ProgramData!, "jagex/runescape");
		this.writable = !!writable;
	}

	getCacheMeta() {
		return {
			name: `sqlite:${this.cachedir}`,
			descr: "Directly reads NXT cache files.",
			timestamp: this.timestamp
		}
	}

	async generateRootIndex() {
		let fs = (globalThis as any).__non_webpack_require__("fs");
		let path = (globalThis as any).__non_webpack_require__("path");
		let files: string[] = fs.readdirSync(path.resolve(this.cachedir));
		console.log("using generated cache index file meta, crc size and version missing");

		let majors: CacheIndex[] = [];
		for (let file of files) {
			let m = file.match(/js5-(\d+)\.jcache$/);
			if (m) {
				majors[Number(m[1])] = {
					major: cacheMajors.index,
					minor: +m[1],
					crc: 0,
					size: 0,
					subindexcount: 1,
					subindices: [0],
					subnames: null,
					name: null,
					version: 0,
					uncompressed_crc: 0,
					uncompressed_size: 0
				};
			}
		}

		return majors;
	}

	openTable(major: number) {
		let sqlite = (globalThis as any).__non_webpack_require__ ? (globalThis as any).__non_webpack_require__("sqlite3") : null;
		if (!sqlite) throw new Error("sqlite3 not found in global require");

		let fs = (globalThis as any).__non_webpack_require__("fs");
		let path = (globalThis as any).__non_webpack_require__("path");

		if (!this.opentables.get(major)) {
			let db: CacheTable["db"] = null;
			let indices: CacheTable["indices"];
			let readFile: CacheTable["readFile"];
			let updateFile: CacheTable["updateFile"];
			let readIndexFile: CacheTable["readIndexFile"];
			let updateIndexFile: CacheTable["updateIndexFile"];

			if (major == cacheMajors.index) {
				indices = this.generateRootIndex();
				readFile = (minor) => this.openTable(minor).readIndexFile();
				readIndexFile = () => { throw new Error("root index file not accesible for sqlite cache"); }
				updateFile = (minor, data) => {
					let table = this.openTable(minor);
					return table.updateIndexFile(data);
				}
				updateIndexFile = (data) => { throw new Error("cannot write root index"); }
			} else {
				let dbfile = path.resolve(this.cachedir, `js5-${major}.jcache`);
				//need separate throw here since sqlite just crashes instead of throwing
				if (!fs.existsSync(dbfile)) { throw new Error(`cache index ${major} doesn't exist`); }
				db = new sqlite.Database(dbfile, this.writable ? sqlite.OPEN_READWRITE : sqlite.OPEN_READONLY);
				let ready = new Promise<void>(done => db!.once("open", done));
				let dbget = async (query: string, args: any[]) => {
					await ready;
					return new Promise<any>((resolve, reject) => {
						db!.get(query, args, (err: any, row: any) => {
							if (err) { reject(err); }
							else { resolve(row); }
						})
					})
				}
				let dbrun = async (query: string, args: any[]) => {
					await ready;
					return new Promise<any>((resolve, reject) => {
						db!.run(query, args, (err: any, res: any) => {
							if (err) { reject(err); }
							else { resolve(res); }
						})
					})
				}
				readFile = (minor) => dbget(`SELECT DATA,CRC FROM cache WHERE KEY=?`, [minor]);
				readIndexFile = () => dbget(`SELECT DATA FROM cache_index`, []);
				updateFile = (minor, data) => dbrun(`UPDATE cache SET DATA=? WHERE KEY=?`, [data, minor]);
				updateIndexFile = (data) => dbrun(`UPDATE cache_index SET DATA=?`, [data]);
				indices = readIndexFile().then(async row => {
					let file = decompress(Buffer.from(row.DATA.buffer, row.DATA.byteOffset, row.DATA.byteLength)) as Buffer;
					return cache.indexBufferToObject(major, file, this as any);
				});
			}
			this.opentables.set(major, { db, readFile, updateFile, readIndexFile, updateIndexFile, indices });
		}
		return this.opentables.get(major)!;
	}

	async getFile(major: number, minor: number, crc?: number): Promise<Buffer> {
		if (major == cacheMajors.index) { return this.getIndexFile(minor); }
		let { readFile: getFile } = this.openTable(major);
		let row = await getFile(minor);
		if (!row) throw new Error(`File ${major}.${minor} not found in sqlite cache`);
		if (typeof crc == "number" && row.CRC != crc) {
			//TODO this is always off by either 1 or 2
			// console.log(`crc from cache (${row.CRC}) did not match requested crc (${crc}) for ${major}.${minor}`);
		}
		let file = Buffer.from(row.DATA.buffer, row.DATA.byteOffset, row.DATA.byteLength);
		// console.log("size",file.byteLength);
		let res = decompress(file);
		return res as Buffer;
	}

	async getFileArchive(index: cache.CacheIndex) {
		let arch = await this.getFile(index.major, index.minor, index.crc);
		let res = cache.unpackSqliteBufferArchive(arch as Buffer, index.subindices, index.subnames);
		return res;
	}

	writeFile(major: number, minor: number, file: Buffer) {
		let table = this.openTable(major);
		let compressed = compressSqlite(file, "zlib");
		return table.updateFile(minor, compressed);
	}

	writeFileArchive(major: number, minor: number, files: Buffer[]) {
		let arch = cache.packSqliteBufferArchive(files);
		return this.writeFile(major, minor, arch);
	}

	async getCacheIndex(major: number) {
		return this.openTable(major).indices;
	}

	async getIndexFile(major: number): Promise<Buffer> {
		let row = await this.openTable(major).readIndexFile();
		if (!row) throw new Error(`Index file for major ${major} not found in sqlite cache`);
		let file = Buffer.from(row.DATA.buffer, row.DATA.byteOffset, row.DATA.byteLength);
		return decompress(file) as Buffer;
	}

	close() {
		for (let table of this.opentables.values()) {
			table.db?.close();
		}
	}
}
