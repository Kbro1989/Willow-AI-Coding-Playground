// removed ts-nocheck
import * as opcode_reader from "./opcode_reader";
import commentJson from "comment-json";
import type { CacheFileSource } from "./cache/index";

const opcodesRaw = import.meta.glob("./opcodes/*.json*", { as: "raw", eager: true });

function getOpcode(path: string) {
	const raw = opcodesRaw[`./opcodes/${path}`];
	if (!raw) {
		throw new Error(`Opcode file not found: ${path}`);
	}
	return commentJson.parse(raw);
}

const typedef = getOpcode("typedef.jsonc") as any;

//alloc a large static buffer to write data to without knowing the data size
//then copy what we need out of it
//the buffer is reused so it saves a ton of buffer allocs
const scratchbuf = Buffer.alloc(2 * 1024 * 1024);

let bytesleftoverwarncount = 0;

export class FileParser<T> {
	parser: opcode_reader.ChunkParser;
	originalSource: string;
	totaltime = 0;

	static fromJson<T>(jsonObject: string) {
		let opcodeobj = commentJson.parse(jsonObject, undefined, true) as any
		return new FileParser<T>(opcodeobj, jsonObject);
	}

	constructor(opcodeobj: unknown, originalSource?: string) {
		this.parser = opcode_reader.buildParser(null, opcodeobj, typedef as any);
		this.originalSource = originalSource ?? JSON.stringify(opcodeobj, undefined, "\t");
	}

	readInternal(state: opcode_reader.DecodeState) {
		let t = performance.now();
		let res = this.parser.read(state);
		this.totaltime += performance.now() - t;
		if (state.scan != state.endoffset) {
			bytesleftoverwarncount++;
			if (bytesleftoverwarncount < 100) {
				console.log(`bytes left over after decoding file: ${state.endoffset - state.scan}`);
				// let name = `cache/bonusbytes-${Date.now()}.bin`;
				// require("fs").writeFileSync(name, scanbuf.slice(scanbuf.scan));
			}
			if (bytesleftoverwarncount == 100) {
				console.log("too many bytes left over warning, no more warnings will be logged");
			}
			// TODO remove this stupid condition, needed this to fail only in some situations
			if (state.buffer.byteLength < 100000) {
				throw new Error(`bytes left over after decoding file: ${state.endoffset - state.scan}`);
			}
		}
		return res;
	}

	read(buffer: Buffer, source: CacheFileSource, args?: Record<string, any>) {
		let state: opcode_reader.DecodeState = {
			isWrite: false,
			buffer,
			stack: [],
			hiddenstack: [],
			scan: 0,
			endoffset: buffer.byteLength,
			args: {
				...source.getDecodeArgs(),
				...args
			}
		};
		return this.readInternal(state) as T;
	}

	write(obj: T, args?: Record<string, any>) {
		let state: opcode_reader.EncodeState = {
			isWrite: true,
			stack: [],
			hiddenstack: [],
			buffer: scratchbuf,
			scan: 0,
			endoffset: scratchbuf.byteLength,
			args: {
				clientVersion: 1000,//TODO
				...args
			}
		};
		this.parser.write(state, obj);
		if (state.scan > state.endoffset) { throw new Error("tried to write file larger than scratchbuffer size"); }
		//append footer data to end of normal data
		state.buffer.copyWithin(state.scan, state.endoffset, scratchbuf.byteLength);
		state.scan += scratchbuf.byteLength - state.endoffset;
		//do the weird prototype slice since we need a copy, not a ref
		let r: Buffer = Buffer.from(Uint8Array.prototype.slice.call(scratchbuf, 0, state.scan));
		//clear it for next use
		scratchbuf.fill(0, 0, state.scan);
		return r;
	}
}

(globalThis as any).parserTimings = () => {
	let all = Object.entries(parse).map((q: [string, any]) => ({ name: q[0], t: q[1].totaltime }));
	all.sort((a, b) => b.t - a.t);
	all.slice(0, 10).filter(q => q.t > 0.01).forEach(q => console.log(`${q.name} ${q.t.toFixed(3)}s`));
}

export const parse = allParsers();

function allParsers() {
	return {
		cacheIndex: new FileParser<import("./generated/cacheindex").cacheindex>(getOpcode("cacheindex.json")),
		npc: new FileParser<import("./generated/npcs").npcs>(getOpcode("npcs.jsonc")),
		item: new FileParser<import("./generated/items").items>(getOpcode("items.jsonc")),
		object: new FileParser<import("./generated/objects").objects>(getOpcode("objects.jsonc")),
		achievement: new FileParser<import("./generated/achievements").achievements>(getOpcode("achievements.jsonc")),
		mapsquareTiles: new FileParser<import("./generated/mapsquare_tiles").mapsquare_tiles>(getOpcode("mapsquare_tiles.jsonc")),
		mapsquareTilesNxt: new FileParser<import("./generated/mapsquare_tiles_nxt").mapsquare_tiles_nxt>(getOpcode("mapsquare_tiles_nxt.jsonc")),
		mapsquareWaterTiles: new FileParser<import("./generated/mapsquare_watertiles").mapsquare_watertiles>(getOpcode("mapsquare_watertiles.json")),
		mapsquareUnderlays: new FileParser<import("./generated/mapsquare_underlays").mapsquare_underlays>(getOpcode("mapsquare_underlays.jsonc")),
		mapsquareOverlays: new FileParser<import("./generated/mapsquare_overlays").mapsquare_overlays>(getOpcode("mapsquare_overlays.jsonc")),
		mapsquareLocations: new FileParser<import("./generated/mapsquare_locations").mapsquare_locations>(getOpcode("mapsquare_locations.json")),
		mapsquareEnvironment: new FileParser<import("./generated/mapsquare_envs").mapsquare_envs>(getOpcode("mapsquare_envs.jsonc")),
		mapZones: new FileParser<import("./generated/mapzones").mapzones>(getOpcode("mapzones.json")),
		enums: new FileParser<import("./generated/enums").enums>(getOpcode("enums.json")),
		fontmetrics: new FileParser<import("./generated/fontmetrics").fontmetrics>(getOpcode("fontmetrics.jsonc")),
		mapscenes: new FileParser<import("./generated/mapscenes").mapscenes>(getOpcode("mapscenes.json")),
		sequences: new FileParser<import("./generated/sequences").sequences>(getOpcode("sequences.json")),
		framemaps: new FileParser<import("./generated/framemaps").framemaps>(getOpcode("framemaps.jsonc")),
		frames: new FileParser<import("./generated/frames").frames>(getOpcode("frames.json")),
		animgroupConfigs: new FileParser<import("./generated/animgroupconfigs").animgroupconfigs>(getOpcode("animgroupconfigs.jsonc")),
		models: new FileParser<import("./generated/models").models>(getOpcode("models.jsonc")),
		oldmodels: new FileParser<import("./generated/oldmodels").oldmodels>(getOpcode("oldmodels.jsonc")),
		classicmodels: new FileParser<import("./generated/classicmodels").classicmodels>(getOpcode("classicmodels.jsonc")),
		spotAnims: new FileParser<import("./generated/spotanims").spotanims>(getOpcode("spotanims.json")),
		rootCacheIndex: new FileParser<import("./generated/rootcacheindex").rootcacheindex>(getOpcode("rootcacheindex.jsonc")),
		skeletalAnim: new FileParser<import("./generated/skeletalanim").skeletalanim>(getOpcode("skeletalanim.jsonc")),
		materials: new FileParser<import("./generated/materials").materials>(getOpcode("materials.jsonc")),
		oldmaterials: new FileParser<import("./generated/oldmaterials").oldmaterials>(getOpcode("oldmaterials.jsonc")),
		quickchatCategories: new FileParser<import("./generated/quickchatcategories").quickchatcategories>(getOpcode("quickchatcategories.jsonc")),
		quickchatLines: new FileParser<import("./generated/quickchatlines").quickchatlines>(getOpcode("quickchatlines.jsonc")),
		environments: new FileParser<import("./generated/environments").environments>(getOpcode("environments.jsonc")),
		avatars: new FileParser<import("./generated/avatars").avatars>(getOpcode("avatars.jsonc")),
		avatarOverrides: new FileParser<import("./generated/avataroverrides").avataroverrides>(getOpcode("avataroverrides.jsonc")),
		identitykit: new FileParser<import("./generated/identitykit").identitykit>(getOpcode("identitykit.jsonc")),
		structs: new FileParser<import("./generated/structs").structs>(getOpcode("structs.jsonc")),
		params: new FileParser<import("./generated/params").params>(getOpcode("params.jsonc")),
		particles_0: new FileParser<import("./generated/particles_0").particles_0>(getOpcode("particles_0.jsonc")),
		particles_1: new FileParser<import("./generated/particles_1").particles_1>(getOpcode("particles_1.jsonc")),
		audio: new FileParser<import("./generated/audio").audio>(getOpcode("audio.jsonc")),
		proctexture: new FileParser<import("./generated/proctexture").proctexture>(getOpcode("proctexture.jsonc")),
		oldproctexture: new FileParser<import("./generated/oldproctexture").oldproctexture>(getOpcode("oldproctexture.jsonc")),
		maplabels: new FileParser<import("./generated/maplabels").maplabels>(getOpcode("maplabels.jsonc")),
		cutscenes: new FileParser<import("./generated/cutscenes").cutscenes>(getOpcode("cutscenes.jsonc")),
		clientscript: new FileParser<import("./generated/clientscript").clientscript>(getOpcode("clientscript.jsonc")),
		clientscriptdata: new FileParser<import("./generated/clientscriptdata").clientscriptdata>(getOpcode("clientscriptdata.jsonc")),
		interfaces: new FileParser<import("./generated/interfaces").interfaces>(getOpcode("interfaces.jsonc")),
		dbtables: new FileParser<import("./generated/dbtables").dbtables>(getOpcode("dbtables.jsonc")),
		dbrows: new FileParser<import("./generated/dbrows").dbrows>(getOpcode("dbrows.jsonc"))
	}
}
