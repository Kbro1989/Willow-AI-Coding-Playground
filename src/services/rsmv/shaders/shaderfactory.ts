import * as THREE from 'three';
import { MaterialData } from '../3d/jmat';
import vertexShaderRaw from './RunescapeVertex.glsl?raw';
import fragmentShaderRaw from './RunescapeFragment.glsl?raw';

type InputReplacer = Record<string, string | string[] | ((arg?: string) => string | string[])>;

const inputreplace: InputReplacer = {
    uModelMatrix: "#define uModelMatrix modelMatrix",
    uViewProjMatrix: "#define uViewProjMatrix (projectionMatrix*viewMatrix)",
    uViewMatrix: "#define uViewMatrix viewMatrix",
    uProjectionMatrix: "#define uProjectionMatrix projectionMatrix",
    uCameraPosition: "#define uCameraPosition cameraPosition",
    aVertexPosition: "#define aVertexPosition position",
    aTextureUV: "#define aTextureUV uv",
    aVertexColour: "#define aVertexColour vec4(color.rgb,1.0)",
    aVertexNormal_FogProportion: "#define aVertexNormal_FogProportion vec4(normal,0.0)",
    gl_FragColor: "FragColor",
    attribute: "in",
    varying: "out",
};

const definereplace: InputReplacer = {
    UNIFORM_BUFFER_BEGIN: (name?: string) => `// UNIFORM_BUFFER_BEGIN(${name})`,
    UNIFORM_BUFFER_END: "// UNIFORM_BUFFER_END",
    TEXTURE_GRAD: "",
};

function fixShader(source: string) {
    let header = [
        `#version 300 es`,
        `precision highp float;`,
        `precision mediump sampler2D;`,
        `#define fma(a,b,c) ((a)*(b)+(c))`,
        `#define texture2D texture`,
        `#define textureCube texture`,
        `#define texture2DLod textureLod`,
        `#define textureCubeLod textureLod`,
        `#define texture2DGrad textureGrad`,
    ].join("\n") + "\n\n";

    return header + source
        .replace(/^#version ([\w ]+)$/m, "// original version $1")
        .replace(/\bprecise\b/g, "highp");
}

function replaceUniforms(source: string, unis: InputReplacer) {
    return source.replace(/^((flat) )*(in|out|uniform|attribute|varying) ((highp|mediump|lowp) )*(float|vec\d|mat\d) ((\w|,\s*)+);$/mg, (m, mods, mod, vartype, precs, prec, datatype, varnames: string) => {
        return varnames.split(/,\s*/g).map(varname => {
            let repl = unis[varname];
            if (repl != undefined) {
                let value = (typeof repl === "function" ? (repl as any)() : repl);
                value = (Array.isArray(value) ? value.join("\n") : value + "\n");
                return m.split("\n").map(q => `// ${q}`).join("\n") + "\n" + value;
            }
            return `${mods ?? ""}${vartype} ${precs ?? ""}${datatype ?? ""} ${varname};`;
        }).join("\n");
    })
}

function replaceDefines(source: string, defs: InputReplacer) {
    return source.replace(/^#define (\w+)(\(.*?\))?($| (\\\r?\n|.)*$)/mg, (m, defname) => {
        let repl = defs[defname];
        if (repl != undefined) {
            let value = (typeof repl === "function" ? (repl as any)(m.match(/\((.*?)\)/)?.[1] || "") : repl);
            value = (Array.isArray(value) ? value.join("\n") : value + "\n");
            return m.split("\n").map(q => `// ${q}`).join("\n") + "\n" + value;
        }
        return m;
    })
}

export function createRuneScapeMaterial(texture: THREE.Texture | null, materialData: MaterialData) {
    let vert = fixShader(vertexShaderRaw);
    vert = replaceUniforms(vert, inputreplace);
    vert = replaceDefines(vert, definereplace);

    let frag = fixShader(fragmentShaderRaw);
    frag = replaceUniforms(frag, inputreplace);
    frag = replaceDefines(frag, definereplace);

    // Patch out gl_FragColor to out vec4 FragColor for WebGL2
    frag = "out vec4 FragColor;\n" + frag.replace(/\bgl_FragColor\b/g, "FragColor");

    const uniforms = {
        uTextureAtlas: { value: texture },
        uTextureAnimationTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.2).normalize() },
        uAmbientColour: { value: new THREE.Color(0.2, 0.2, 0.2) },
        uSunColour: { value: new THREE.Color(1, 1, 1) },
        uAlphaTestThreshold: { value: materialData.alphamode === "cutoff" ? 0.5 : 0.01 },
        uAtlasMeta: { value: new THREE.Vector4(1, 1, 1, 1) }, // Placeholder
        uFade: { value: 0 },
        uInvSunDirection: { value: new THREE.Vector3(-0.5, -0.8, -0.2).normalize() },
    };

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: vert,
        fragmentShader: frag,
        transparent: materialData.alphamode === "blend",
        side: THREE.DoubleSide,
    });

    return material;
}
