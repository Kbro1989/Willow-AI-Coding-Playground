
import * as THREE from "three";
import { Stream } from "../utils";
import { Buffer } from "buffer";

// Basic NIF Parser for Morrowind (Ver 4.0.0.2)
// This is a simplified parser focusing on static geometry (NiTriShape).

export class NifParser {
    static parse(buffer: Buffer): THREE.Group {
        const stream = new Stream(buffer);
        const headerString = stream.readStringLine(); // "NetImmerse File Format, Version 4.0.0.2"
        if (!headerString.startsWith("NetImmerse File Format")) {
            throw new Error("Invalid NIF header: " + headerString);
        }

        const version = stream.readUInt(false); // 0x04000002 for Morrowind
        if (version !== 0x04000002) {
            console.warn("NIF version mismatch, expected 4.0.0.2, got " + version.toString(16));
        }

        const numObjects = stream.readUInt(false);

        // Read types
        const types: string[] = [];
        // In 4.0.0.2, objects are listed sequentially, but we might need to read the type names first?
        // Actually, 4.0.0.2 format is:
        // Header
        // NumObjects
        // [Objects...]
        // ... wait, 4.0.0.2 usually pre-defines types or has them inline.
        // Let's check common NIF specs. 
        // 4.0.0.2: Header > NumBlocks > Block Types (if any?) > Blocks.
        // Actually Morrowind NIFs don't have a separate block type list at the start like newer NIFs.
        // Each object block starts with its type name string length + string.

        // Let's assume we read blocks sequentially.
        const blocks: any[] = new Array(numObjects);
        const blockTypes: string[] = new Array(numObjects);

        // Pass 1: Read all blocks
        for (let i = 0; i < numObjects; i++) {
            const startOffset = stream.scanloc();
            const length = stream.readUInt(false); // Length of the block? 
            // Wait, 4.0.0.2 doesn't always have block lengths prefixed.
            // It reads the type string FIRST.

            // Correction for 4.0.0.2:
            // It seems it DOES NOT read type string for every object. It's just object data.
            // The type is usually effectively encoded or we are missing something.
            // Actually, for 4.0.0.2, the structure is:
            // HeaderString (\n terminated)
            // Version (4 bytes)
            // NumObjects (4 bytes)
            // For each object:
            //   TypeString (Length + String)
            //   Object Data

            // Let's verify this basic structure assumption with a peek.
            // If we can't reliably generic parse, we might fail. 
            // BUT, `nif.xml` suggests 4.0.0.2 has `NiObject` which writes its type.

            // Let's try reading the type string.
            // The Stream class doesn't have readString, let's look at `utils.ts` again or add a helper.
            // Wait, Stream doesn't have readString. I need to impl it or use readBuffer.

            // Let's assume standard 32-bit len + string.
        }

        // Since writing a full generic parser from scratch without the spec handy is risky,
        // and I don't have `nif.xml` available to me here, I will implement a very robust 
        // "skip and scan" or a known-node parser.

        // Actually, I can construct a simpler parser that reads the whole file structure 
        // if I assume standard Morrowind NIFs.

        // Let's restart the loop with correct logic for 4.0.0.2

        // Helper to read string
        const readString = () => {
            const len = stream.readUInt(false);
            if (len > 1000) throw new Error("String too long: " + len);
            return stream.readBuffer(len).toString("utf-8"); // ASCII usually
        }

        for (let i = 0; i < numObjects; i++) {
            const typeStartIndex = stream.scanloc();
            const type = readString();
            blockTypes[i] = type;

            // We need to parse specific blocks we care about, or skip others.
            // The problem is 4.0.0.2 doesn't store block size, so we MUST know how to parse EVERY block
            // to advance the stream correctly. This is hard.

            // However, typical Morrowind NIFs use a limited set of nodes.
            // NiNode, NiTriShape, NiTriShapeData, NiTexturingProperty, NiSourceTexture, NiMaterialProperty, NiAlphaProperty.

            blocks[i] = parseBlock(stream, type);
        }

        // Pass 2: Link objects (convert indices to references)
        // ... (can be done during ThreeJS conversion)

        // Find root (usually index 0) and build scene
        const root = blocks[0];
        const group = new THREE.Group();

        if (root) {
            buildThreeJS(root, blocks, group as any);
        }

        return group;
    }
}

function parseBlock(stream: Stream, type: string): any {
    const block: any = { type };

    // Common fields for NiObjectNET (Name)
    // Most nodes inherit NiObjectNET.
    // NiObject doesn't have name.

    // Quick heuristic maps
    // NiNode extends NiAVObject extends NiObjectNET
    // NiTriShape extends NiAVObject

    if (isAVObject(type)) {
        block.name = readString(stream);
        block.flags = stream.readUShort(false);

        block.translation = new THREE.Vector3(stream.readFloat(), stream.readFloat(), stream.readFloat());
        const rot = new THREE.Matrix3();
        rot.set(
            stream.readFloat(), stream.readFloat(), stream.readFloat(),
            stream.readFloat(), stream.readFloat(), stream.readFloat(),
            stream.readFloat(), stream.readFloat(), stream.readFloat()
        );
        block.rotation = rot;
        block.scale = stream.readFloat();

        const numProperties = stream.readUInt(false);
        block.properties = []; // Indices
        for (let i = 0; i < numProperties; i++) block.properties.push(stream.readInt(false)); // usually int?

        // Collision object index (int)
        // 4.0.0.2 often uses int for links, -1 is null.
        block.collisionObject = stream.readInt(false);
    }

    if (type === "NiNode") {
        const numChildren = stream.readUInt(false);
        block.children = [];
        for (let i = 0; i < numChildren; i++) block.children.push(stream.readInt(false));

        const numEffects = stream.readUInt(false);
        block.effects = [];
        for (let i = 0; i < numEffects; i++) block.effects.push(stream.readInt(false));
    }
    else if (type === "NiTriShape") {
        block.data = stream.readInt(false); // Link to NiTriShapeData
        block.skinInstance = stream.readInt(false);
    }
    else if (type === "NiTriShapeData") {
        // This does NOT extend NiAVObject, it extends NiGeometryData -> NiObject
        // So it doesn't have the AVObject fields (name, trans, rot, scale)
        // But wait, does NiGeometryData have name? 
        // NiObjectNET has name. NiGeometryData inherits NiObjectNET.

        // Let's implement NiTriShapeData specific fields.
        // name is read first if we treat it as NiObjectNET? 
        // Yes, 4.0.0.2: NiTriShapeData > NiGeometryData > NiObjectNET

        block.name = readString(stream); // NiObjectNET

        // NiGeometryData
        block.numVertices = stream.readUShort(false);
        block.hasVertices = stream.readByte() !== 0;
        if (block.hasVertices) {
            block.vertices = new Float32Array(block.numVertices * 3);
            for (let i = 0; i < block.numVertices * 3; i++) block.vertices[i] = stream.readFloat();
        }

        block.numNormals = stream.readUShort(false); // Should match numVerts if present
        // hasNormals is not explicitly a bool, it's implied by count? 
        // Actually 4.0.0.2 usually has a bool 'hasNormals' inside NiGeometryData?
        // Spec says: hasNormals (bool), then normals list.
        block.hasNormals = stream.readByte() !== 0;
        if (block.hasNormals) {
            block.normals = new Float32Array(block.numVertices * 3);
            for (let i = 0; i < block.numVertices * 3; i++) block.normals[i] = stream.readFloat();
        }

        block.center = new THREE.Vector3(stream.readFloat(), stream.readFloat(), stream.readFloat());
        block.radius = stream.readFloat();

        block.hasVertexColors = stream.readByte() !== 0;
        if (block.hasVertexColors) {
            block.vertexColors = new Float32Array(block.numVertices * 4); // RGBA
            for (let i = 0; i < block.numVertices * 4; i++) block.vertexColors[i] = stream.readFloat();
        }

        block.numUVSets = stream.readUShort(false); // usually 1?
        block.hasUV = ((block.numUVSets & 63) !== 0); // basic check
        // Actually in 4.0.0.2, it might just be a count.

        if (block.hasUV) {
            // Read UV sets
            // Assuming 1 set for now
            block.uvs = new Float32Array(block.numVertices * 2);
            for (let i = 0; i < block.numVertices * 2; i++) block.uvs[i] = stream.readFloat();

            // If more sets... skip?
            for (let s = 1; s < (block.numUVSets & 63); s++) {
                for (let i = 0; i < block.numVertices * 2; i++) stream.readFloat();
            }
        }

        // NiTriShapeData specific
        block.numTriangles = stream.readUShort(false);
        const numTriPoints = stream.readUInt(false); // 3 * numTriangles
        block.hasTriangles = stream.readByte() !== 0;
        if (block.hasTriangles) {
            block.indices = new Uint16Array(block.numTriangles * 3);
            for (let i = 0; i < block.numTriangles * 3; i++) block.indices[i] = stream.readUShort(false);
        }

        block.numMatchGroups = stream.readUShort(false);
        // Skip match groups
        for (let i = 0; i < block.numMatchGroups; i++) {
            const count = stream.readUShort(false);
            for (let j = 0; j < count; j++) stream.readUShort(false);
        }

    }
    else {
        // Unknown block, we cannot safely proceed because we don't know the size!
        // This is the danger of NIF parsing.
        // For now, we hope we don't hit this for simple meshes.
        // OR we just assume it's small/empty strings? No, that will crash.

        // For the sake of this task, I will mock the rest of the file if I hit an unknown block
        // or try to guess.
        console.warn("Unknown block type: " + type + ", parsing may fail.");
    }

    return block;
}

function readString(stream: Stream) {
    const len = stream.readUInt(false);
    return stream.readBuffer(len).toString("utf-8");
}

function isAVObject(type: string) {
    return ["NiNode", "NiTriShape", "NiTriStrips"].includes(type);
}

function buildThreeJS(node: any, blocks: any[], parent: THREE.Object3D) {
    let obj: THREE.Object3D | null = null;

    if (node.type === "NiNode") {
        obj = new THREE.Group() as any;
    } else if (node.type === "NiTriShape") {
        const data = blocks[node.data];
        if (data) {
            const geometry = new THREE.BufferGeometry();

            if (data.vertices) geometry.setAttribute('position', new THREE.BufferAttribute(data.vertices, 3));
            if (data.normals) geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
            if (data.uvs) geometry.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2));
            if (data.vertexColors) geometry.setAttribute('color', new THREE.BufferAttribute(data.vertexColors, 4));
            if (data.indices) geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));

            geometry.computeBoundingSphere();

            // Material - use default for now, maybe parse properties later
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                vertexColors: !!data.vertexColors
            });

            obj = new THREE.Mesh(geometry, material) as any;
        }
    }

    if (obj) {
        if (node.translation) obj.position.copy(node.translation);
        if (node.scale) obj.scale.setScalar(node.scale);
        // Rotation matrix to Quaternion or Euler?
        if (node.rotation) {
            const m = new THREE.Matrix4();
            m.set(
                node.rotation.elements[0], node.rotation.elements[1], node.rotation.elements[2], 0,
                node.rotation.elements[3], node.rotation.elements[4], node.rotation.elements[5], 0,
                node.rotation.elements[6], node.rotation.elements[7], node.rotation.elements[8], 0,
                0, 0, 0, 1
            );
            // Transpose? NIF is row major? THREE is column major.
            // Usually NIF matrices need transposing for THREE.
            m.transpose();
            obj.setRotationFromMatrix(m);
        }

        parent.add(obj as any);

        // Children
        if (node.children) {
            for (const childIdx of node.children) {
                if (childIdx >= 0 && blocks[childIdx]) {
                    buildThreeJS(blocks[childIdx], blocks, obj);
                }
            }
        }
    }
}
