
import { Buffer } from 'buffer';
import { decompress } from "./compression";
// // In Vite, we'll use import.meta.url for the wasm file
// // and import for the JS part if possible, or use a dynamic import.
// import initSqlJs from "../libs/sqljsfork/dist/sql-wasm-workerfs.js";
// // const initSqlJs: any = null;

//load the library from the public directory to avoid vite build errors
(self as any).importScripts("/libs/sql-wasm-workerfs.js");
const initSqlJs = (self as any).initSqlJs;

export type WorkerPackets = {
	type: "getfile", major: number, minor: number, crc?: number
} | {
	type: "getindex", major: number
} | {
	type: "blobs", blobs: Record<string, Blob>
};

type CacheTable = {
	dbprom: Promise<any>;
	dbget: (q: string, params: any[]) => Promise<any>,
	dbrun: (q: string, params: any[]) => Promise<any>
};

let opentables = new Map<number, CacheTable>();
let dbfiles: Record<string, Blob> = {};

self.addEventListener("message", async (e: MessageEvent) => {
	let id = e.data.id;
	let packet: WorkerPackets = e.data.packet;
	try {
		switch (packet.type) {
			case "blobs":
				giveBlobs(packet.blobs);
				(self as any).postMessage({ id });
				break;
			case "getfile":
				let file = await getFile(packet.major, packet.minor, packet.crc);
				(self as any).postMessage({ id, packet: file });
				break;
			case "getindex":
				let index = await getIndex(packet.major);
				(self as any).postMessage({ id, packet: index });
				break;
		}
	} catch (err: any) {
		(self as any).postMessage({ id, error: err.message });
	}
});

function giveBlobs(blobs: Record<string, Blob>) {
	Object.assign(dbfiles, blobs);
}

function openTable(major: number) {
	if (!opentables.has(major)) {
		let file = `js5-${major}.jcache`;
		if (!dbfiles[file]) {
			throw new Error(`need file ${file}`);
		}

		let dbprom = initSqlJs({
			locateFile: (path: string) => {
				if (path.endsWith(".wasm")) return "/libs/sql-wasm-workerfs.wasm";
				return path;
			}
		}).then((sqlite: any) => {
			return new sqlite.Database(dbfiles[file] as any);
		});

		let dbget = async (query: string, args: any[]) => {
			let db = await dbprom;
			let row = db.exec(query, args);
			if (row.length == 0) { throw new Error(`entry not found`); }
			let rawres = row[0];
			for (let rawrow of rawres.values) {
				let row_obj: any = {};
				for (let i = 0; i < rawres.columns.length; i++) {
					row_obj[rawres.columns[i]] = rawrow[i];
				}
				return row_obj;
			}
		};
		let dbrun = dbget;
		opentables.set(major, { dbprom, dbget, dbrun });
	}
	return opentables.get(major)!;
}

async function getFile(major: number, minor: number, crc?: number) {
	let { dbget } = openTable(major);
	let row = await dbget(`SELECT DATA,CRC FROM cache WHERE KEY=?`, [minor]);
	let file = Buffer.from(row.DATA.buffer, row.DATA.byteOffset, row.DATA.byteLength);
	return decompress(file);
}

async function getIndex(major: number) {
	let { dbget } = openTable(major);
	let row = await dbget(`SELECT DATA FROM cache_index`, []);
	let file = Buffer.from(row.DATA.buffer, row.DATA.byteOffset, row.DATA.byteLength);
	return decompress(file);
}
