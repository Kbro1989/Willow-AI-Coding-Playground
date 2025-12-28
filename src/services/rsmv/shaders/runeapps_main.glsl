
/* MATCH 0 */

#version 460

/***************************************************/
/***************** GLSL Header *********************/
/***************************************************/
#ifdef GL_EXT_gpu_shader4
#extension GL_EXT_gpu_shader4 : enable
#endif
#ifdef GL_ARB_gpu_shader5
#extension GL_ARB_gpu_shader5 : enable
#endif
#ifdef GL_ARB_derivative_control
#extension GL_ARB_derivative_control : enable
#endif

#ifdef GL_ARB_texture_gather
#extension GL_ARB_texture_gather : enable
#endif

#define OGL_BACKEND

#undef attribute
#define attribute in

#undef gl_FragColor
#define gl_FragColor FragColor

#define shadow2DCompat texture

#undef textureCube
#define textureCube texture

#undef texture2D
#define texture2D texture

#undef texture3D
#define texture3D texture

#undef texture2DLod
#define texture2DLod textureLod

#undef textureCubeLod
#define textureCubeLod textureLod

#undef texture2DGrad
#define texture2DGrad textureGrad

#define MSAA_AVAILABLE

#define TEXTURE_OFFSET_AVAILABLE
#if !defined(lowp)
#define lowp
#endif
#if !defined(mediump)
#define mediump
#endif
#if !defined(highp)
#define highp
#endif

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define shadow2DLodCompat texture2DLod

#define texture2DLodCompat texture2DLod

#define textureCubeLodCompat textureCubeLod

#define textureGatherCompat(sampler, texCoord, viewportScale) textureGather(sampler, texCoord).wzxy

#define SHADER_TYPE_PIXEL

out vec4 gl_FragColor;

#define UNIFORM_BUFFER_BEGIN(name) \
    layout(std140) uniform name    \
    {
#define UNIFORM_BUFFER_END \
    }                      \
    ;

mat3 Mat4ToMat3(const mat4 inputMatrix)
{
    return mat3(inputMatrix);
}

#define isNaN isnan

#ifndef GL_ARB_derivative_control
#define dFdxFine dFdx
#define dFdyFine dFdy
#define fwidthFine fwidth
#endif

/***************************************************/

/***************************************************/
/***************** Effect Defines ******************/
/***************************************************/
#define VIEW_TRANSFORMS

/*************************************************/

/***************************************************/
/********** Mandatory Shader Fragments *************/
/***************************************************/

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_X 3.0
#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_Y 4.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X 42.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_Y 32.0
#define MATERIAL_SETTINGS_TEXTURE_RESOLUTION 128.0
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif
#ifndef PACK_UTILS_INC
#define PACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

vec4 PackFloatToRGBA(highp float valueToPack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShift = vec4(256 * 256 * 256, 256 * 256, 256, 1.0);
    const highp vec4 bitMask = vec4(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
    highp vec4 fragColour = mod(valueToPack * bitShift * vec4(255), vec4(256)) / vec4(255);
    return fragColour - fragColour.xxyz * bitMask;
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
    const highp vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    highp vec4 fragColour = fract(valueToPack * bitShift);
    return fragColour - (fragColour.xxyz * bitMask);
#endif
}
vec2 NormalPackSphereMap(vec3 v)
{
    vec2 f = normalize(v.st) * sqrt(-v.p * .5 + .5);
    f = f * .5 + .5;
    return f * 65535.;
}
vec2 PackFloatToVec2(float v)
{
    vec2 f;
    const float b = 1. / 255.;
    vec2 h = vec2(1., 255.), r = fract(h * v);
    r.s -= r.t * b;
    return r.st;
}
#endif
#ifndef UNPACK_UTILS_INC
#define UNPACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

highp float UnpackRGBAToFloat(highp vec4 valueToUnpack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
    return dot(valueToUnpack, bitShifts);
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShifts = vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0);
    return dot(valueToUnpack, bitShifts);
#endif
}
vec3 ColourUnpack(highp float v)
{
    vec3 f;
    f.s = floor(v / 256. / 256.);
    f.t = floor((v - f.s * 256. * 256.) / 256.);
    f.p = floor(v - f.s * 256. * 256. - f.t * 256.);
    return f / 256.;
}
vec3 NormalUnpackSphereMap(vec2 v)
{
    vec4 f = vec4(v.s / 32767. - 1., v.t / 32767. - 1., 1., -1.);
    float U = dot(f.stp, -f.stq);
    f.st *= sqrt(U);
    f.p = U;
    return f.stp * 2. + vec3(0., 0., -1.);
}
highp float UnpackRGBAToIntegerFloat(highp vec4 f) { return floor(f.s * 255. + .5) * 256. * 256. * 256. + floor(f.t * 255. + .5) * 256. * 256. + floor(f.p * 255. + .5) * 256. + floor(f.q * 255. + .5); }
highp float UnpackRGBAToIntegerFloat16(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
highp int UnpackRGBAToInt(vec4 f) { return int(UnpackRGBAToIntegerFloat(f)); }
highp vec4 UnpackFloatToRGBA(highp float f)
{
    const highp vec4 v = vec4(1., 255., 65025., 1.65814e+07), s = vec4(vec3(1. / 255.), 0.);
    highp vec4 U = fract(f * v);
    U -= U.sstp * s;
    return U;
}
highp float UnpackVec2ToFloat(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
#endif
#if defined(MSAA) && defined(MSAA_AVAILABLE)
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2DMS
#define MSAA_SAMPLERS_ENABLED 1
#define texture2DMultisample(sampler, texCoord, texSize) texelFetch(sampler, ivec2((texCoord)*texSize), 0)
#else
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2D
#define MSAA_SAMPLERS_ENABLED 0
#define texture2DMultisample(sampler, texCoord, texSize) texture2DLodCompat(sampler, texCoord, 0.0)
#endif
UNIFORM_BUFFER_BEGIN(ViewportLookupScale)
uniform highp vec4 uViewportLookupScale;
uniform highp vec4 uViewportOffsetScale;
uniform highp vec4 uFullScreenLookupScale;
UNIFORM_BUFFER_END

/***************************************************/

UNIFORM_BUFFER_BEGIN(ViewTransforms)
uniform highp vec3 uCameraPosition;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;
uniform highp mat4 uViewProjMatrix;
uniform highp vec4 uZBufferParams;
UNIFORM_BUFFER_END

UNIFORM_BUFFER_BEGIN(Sunlight)
uniform highp vec3 uInvSunDirection;
uniform mediump vec3 uAmbientColour;
uniform mediump vec3 uSunColour;
uniform mediump float uDummy;
UNIFORM_BUFFER_END
uniform lowp vec4 uWaterFeatureFlags;
uniform highp vec4 uWaterNormalMapTextureScales_FlowNoiseScale;
uniform highp vec2 uWaterTickFade;
uniform vec4 uWaterNormalBRDFParams;
uniform vec3 uWaterSpecularColour;
in highp vec4 vPosition_WaterDepth;
in vec4 vColour;
in highp vec4 vFlowControlMask_ViewSpaceDepth;
in highp vec4 vNoisyPatchFlow0_NoisyPatchFlow1;
in highp vec4 vNoisyPatchFlow2_UVPack_NormalsFlow0Map0;
in highp vec4 vUVPack_NormalsFlow0Map1_NormalsFlow0Map2;
in highp vec4 vUVPack_NormalsFlow1Map0_NormalsFlow1Map1;
in highp vec4 vUVPack_NormalsFlow1Map2_NormalsFlow2Map0;
in highp vec4 vUVPack_NormalsFlow2Map1_NormalsFlow2Map2;
in highp vec4 vUVPack_NormalMapMacroUV_EmissiveUV[3];
in highp vec2 vUVPack_FoamUV;
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif

vec4 textureCubeSRGB(samplerCube sampler, vec3 reflDir)
{
    vec4 texel = textureCube(sampler, reflDir);
    return texel;
}

vec4 textureCubeSRGB(samplerCube sampler, vec3 reflDir, float lod)
{
    vec4 texel = textureCube(sampler, reflDir, lod);
    return texel;
}

vec4 textureCubeLodSRGB(samplerCube sampler, vec3 reflDir, float lod)
{
    vec4 texel = textureCubeLodCompat(sampler, reflDir, lod);
    return texel;
}
#ifndef FRESNEL_INC
#define FRESNEL_INC
vec3 FresnelSchlick(vec3 F, float f, highp float h)
{
    vec3 c = F + (1. - F) * pow(1. - f, h);
    return c;
}
vec3 FresnelSchlickRoughness(vec3 f, float F, highp float h, float v)
{
    vec3 c = f + (max(vec3(v), f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(float F, float f, highp float h)
{
    float c = F + (1. - F) * pow(1. - f, h);
    return c;
}
float FresnelSchlickRoughness(float f, float F, highp float h, float v)
{
    float c = f + (max(v, f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(vec3 F, vec3 f, float c)
{
    float h = max(0., dot(F, f));
    return c + (1. - c) * pow(1. - h, 5.);
}
float Fresnel(vec3 F, vec3 f, float c, float h)
{
    float p = 1. - max(0., dot(F, f)), v = p * p;
    v = v * v;
    v = v * p;
    return clamp(v * (1. - clamp(h, 0., 1.)) + h - c, 0., 1.);
}
#endif

vec3 UnpackCompressedNormal(vec3 U)
{
    vec3 v = vec3(U.ps * 255. / 127. - 1.00787, 0.);
    v.p = sqrt(1. - min(1., dot(v.st, v.st)));
    v.t = -v.t;
    return v;
}
vec3 UnpackNormal(vec3 v, float U)
{
    vec3 t;
#if defined(COMPRESSED_NORMALS)
    t = UnpackCompressedNormal(v);
#else
    t = v.pst * 255. / 127. - 1.00787;
    t.t = -t.t;
#endif
    t.st *= U;
    return t;
}
vec3 UnpackNormal(vec3 U) { return UnpackNormal(U, 1.); }
vec3 UnpackNormal(vec4 v) { return UnpackNormal(v.tpq, 1.); }
vec3 UnpackNormal(vec4 v, float U) { return UnpackNormal(v.tpq, U); }

const highp float CAUSTICS_FIXED_POINT_SCALE = 10000.;
#if defined(CAUSTICS) && !defined(CAUSTICS_COMPUTE) && !defined(CAUSTICS_STENCIL)
float CalculateCausticsTerm(highp vec3 u, float t, vec3 e)
{
    float i = 0., s = 0.;
    if (u.t <= uCausticsPlaneHeight)
        s = step(1., t);
    else
    {
#if defined(CAUSTICS_OVERWATER)
        s = clamp(e.t * -1., 0., 1.);
        float d = smoothstep(uCausticsOverWaterFade.s, uCausticsOverWaterFade.t, u.t - uCausticsPlaneHeight);
        s *= 1. - d;
#else
        return 0.0;
#endif
    }
    if (s > 0.)
    {
        highp vec4 C = uCausticsViewProjMatrix * vec4(u, 1.);
        C.st /= 2. * C.q;
        vec2 f = abs(C.st);
        C.st += .5;
        f = smoothstep(.4, .5, f);
        s *= max(0., 1. - (f.s + f.t));
        if (s > 0.)
            i += textureOffset(uCausticsMap, C.st, ivec2(-1, -1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(-1, 0)).s, i += textureOffset(uCausticsMap, C.st, ivec2(-1, 1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(0, -1)).s, i += texture2D(uCausticsMap, C.st).s * 5., i += textureOffset(uCausticsMap, C.st, ivec2(0, 1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(1, -1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(1, 0)).s, i += textureOffset(uCausticsMap, C.st, ivec2(1, 1)).s, i *= s / 12.;
    }
    return i;
}
#endif
#if defined(CAUSTICS_COMPUTE)
void WriteCausticsRay(vec3 t, float i)
{
    vec2 s = t.sp * i * uCausticsRefractionScale, C = (gl_FragCoord.st + s * 2.) / uCausticsComputeResolution * uCausticsMapSize;
    highp float u = min(uCausticsFade.s / i * uCausticsFade.t, 7. * uCausticsFade.t), f = smoothstep(uCausticsFade.p, uCausticsFade.q, i), E = f * u * CAUSTICS_FIXED_POINT_SCALE;
    if (E >= 1.f)
        imageAtomicAdd(uCausticsIntegerMap, ivec2(C.st), uint(E));
}
#endif

#ifndef DEPTH_UTILS_INC
#define DEPTH_UTILS_INC
highp float GetViewSpaceDepth(highp float v, highp vec3 G)
{
    return G.s / (G.t * v + G.p);
}
highp vec4 GetViewSpaceDepth(highp vec4 v, highp vec3 G) { return G.s / (G.t * v + G.p); }
highp vec3 GetViewSpacePos(vec2 v, highp float G, highp mat4 f)
{
    highp vec4 m = vec4(2. * v - 1., 2. * G - 1., 1.), h = f * m;
    h.stp /= h.q;
    return h.stp;
}
highp vec4 GetWorldSpacePos(vec2 v, highp float G, highp mat4 f)
{
    highp vec4 m = vec4(2. * v - 1., 2. * G - 1., 1.), h = f * m;
    h = h / h.q;
    return h;
}
highp float GetViewSpaceDepthFromPos(vec3 v, mat4 G)
{
    vec3 h = vec3(G[0][2], G[1][2], G[2][2]);
    return dot(v, h);
}
#if defined(SAMPLER_2D_AUTO_MULTISAMPLE)
highp vec3 GetViewSpacePos(vec2 v, SAMPLER_2D_AUTO_MULTISAMPLE G, highp mat4 h)
{
    highp float m;
#if defined(VIEWPORTLOOKUPSCALE)
    m = texture2DMultisample(G, v, uViewportLookupScale.pq).s;
#else
    m = texture2DMultisample(G, v, textureSize(G)).s;
#endif
    return GetViewSpacePos(v, m, h);
}
highp vec3 GetViewSpacePos(vec2 v, vec4 G, vec2 h, SAMPLER_2D_AUTO_MULTISAMPLE f, highp mat4 m)
{
    highp float d = texture2DMultisample(f, v * G.pq + G.st, h).s;
    return GetViewSpacePos(v, d, m);
}
#endif
#endif

#ifndef NOISE_UTILS_INC
#define NOISE_UTILS_INC
vec4 permute(vec4 t)
{
    return mod((t * 34. + 1.) * t, 289.);
}
vec2 fade(vec2 t) { return t * t * t * (t * (t * 6. - 15.) + 10.); }
float cnoise(highp vec2 t)
{
    highp vec4 v = floor(t.stst) + vec4(0., 0., 1., 1.), d = fract(t.stst) - vec4(0., 0., 1., 1.);
    v = mod(v, 289.);
    vec4 p = v.spsp, s = v.ttqq, h = d.spsp, e = d.ttqq, f = permute(permute(p) + s), m = 2. * fract(f * .0243902) - 1., c = abs(m) - .5, q = floor(m + .5);
    m = m - q;
    vec2 N = vec2(m.s, c.s), r = vec2(m.t, c.t), o = vec2(m.p, c.p), a = vec2(m.q, c.q);
    vec4 G = 1.79284 - .853735 * vec4(dot(N, N), dot(o, o), dot(r, r), dot(a, a));
    N *= G.s;
    o *= G.t;
    r *= G.p;
    a *= G.q;
    float i = dot(N, vec2(h.s, e.s)), n = dot(r, vec2(h.t, e.t)), l = dot(o, vec2(h.p, e.p)), I = dot(a, vec2(h.q, e.q));
    vec2 u = fade(d.st), S = mix(vec2(i, l), vec2(n, I), u.s);
    float g = mix(S.s, S.t, u.t);
    return 2.3 * g;
}
highp float GetInterleavedGradientNoise(highp vec2 t) { return clamp(fract(52.9829 * fract(.0671106 * t.s + .00583715 * t.t)), 0., .999); }
#endif

#ifndef LIGHTING_UTILS_H
#define LIGHTING_UTILS_H
#ifndef LIGHTING_INC
#define LIGHTING_INC
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

#ifndef FRESNEL_INC
#define FRESNEL_INC
vec3 FresnelSchlick(vec3 F, float f, highp float h)
{
    vec3 c = F + (1. - F) * pow(1. - f, h);
    return c;
}
vec3 FresnelSchlickRoughness(vec3 f, float F, highp float h, float v)
{
    vec3 c = f + (max(vec3(v), f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(float F, float f, highp float h)
{
    float c = F + (1. - F) * pow(1. - f, h);
    return c;
}
float FresnelSchlickRoughness(float f, float F, highp float h, float v)
{
    float c = f + (max(v, f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(vec3 F, vec3 f, float c)
{
    float h = max(0., dot(F, f));
    return c + (1. - c) * pow(1. - h, 5.);
}
float Fresnel(vec3 F, vec3 f, float c, float h)
{
    float p = 1. - max(0., dot(F, f)), v = p * p;
    v = v * v;
    v = v * p;
    return clamp(v * (1. - clamp(h, 0., 1.)) + h - c, 0., 1.);
}
#endif

#ifndef BRDF_INC
#define BRDF_INC
#ifndef NDF_INC
#define NDF_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float BlinnPhongNDF(float f, float N)
{
    return (f + 2.) * INV_EIGHT * pow(N, f);
}
float GGXTrowbridgeReitzNDF(float N, float f)
{
    float P = N * N, I = f * f, T = I * (P - 1.) + 1.;
    return P / (PI * (T * T + .0001));
}
float BeckmannNDF(float N, float f)
{
    float P = N * N, I = f * f;
    return exp((I - 1.) / (P * I)) / (PI * P * (I * I));
}
#endif

#ifndef VISIBILITY_FUNC_INC
#define VISIBILITY_FUNC_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float SchlickSmithVis(float V, float f, float S)
{
    float P = 1. / sqrt(PI_OVER_4 * V + PI_OVER_2), d = 1. - P, v = (f * d + P) * (S * d + P);
    return 1. / (v + .0001);
}
float KelemenSzirmayKalosVis(vec3 V, vec3 P)
{
    vec3 f = V + P;
    return 4. / max(0., dot(f, f));
}
#endif

#define GGX_NDF
#define SCHLICK_SMITH_VIS
vec3 CookTorranceBRDF(float d, float S, vec3 n, vec3 v, vec3 f, vec3 B, vec3 R, float F)
{
    float m = max(0., dot(v, f)), r = 1.;
#if defined(BLINN_PHONG_NDF)
    r = BlinnPhongNDF(d, m);
#elif defined(GGX_NDF)
    r = GGXTrowbridgeReitzNDF(PerceptualRoughnessToRoughness(S), m);
#elif defined(BECKMANN_NDF)
    r = max(0.f, BeckmannNDF(SpecPowToBeckmannRoughness(d), m));
#else

#error CookTorranceBRDF normal distribution function not specified

#endif
    float C = 1.;
#if defined(SCHLICK_SMITH_VIS)
    C = SchlickSmithVis(d, F, max(0., dot(v, B)));
#elif defined(KELEMEN_SZIRMAY_KALOS_VIS)
    C = KelemenSzirmayKalosVis(R, B);
#endif
    return n * (r * C);
}
float RunescapeLegacyBRDF(vec3 d, vec3 v, vec3 f, float B, float S)
{
    vec3 n = reflect(-d, f);
    float C = pow(max(0., dot(n, v)), B);
    return C * S;
}
float RunescapeRT5BRDF(vec3 d, vec3 v, float S) { return BlinnPhongNDF(S, max(0., dot(d, v))); }
vec3 ShiftTangent(vec3 d, vec3 S, float B) { return normalize(d + B * S); }
vec3 AnisotropicBRDF(vec3 v, vec3 d, vec3 S, vec3 f, vec3 B, float n, float m, float R, float C)
{
    const float F = 7.5, r = 1., e = .5, o = 1.;
    float s = R - .5;
    S = ShiftTangent(S, d, e + (C * 2. - 1.) * o + s);
    float p = abs(dot(S, f)), a = 1. - p, t = 1. - abs(dot(S, B)), K = p * dot(d, B);
    K += a * t;
    K = pow(K, F) * n;
    K = mix(K, K * C, o);
    float G = pow(dot(d, v), m), P = mix(G, K, r);
    return vec3(P, P, P);
}
#endif

struct LightingTerms
{
    vec3 Diffuse;
    vec3 Specular;
};
void ClearLightingTerms(inout LightingTerms v) { v.Diffuse = vec3(0., 0., 0.), v.Specular = vec3(0., 0., 0.); }
void AddLightingTerms(inout LightingTerms v, LightingTerms L) { v.Diffuse += L.Diffuse, v.Specular += L.Specular; }
void EvaluateDirLightRT5(inout LightingTerms v, vec3 f, vec3 L, vec3 d, vec3 i, float S, float c, float F, float e, float E, vec3 A)
{
    v.Diffuse += A * e;
#if defined(SPECULAR_LIGHTING)
    vec3 G = normalize(d + i);
    float r = FresnelSchlick(S, clamp(dot(i, G), 0., 1.), F);
#if defined(ANISOTROPY_BRDF)
    vec3 D = AnisotropicBRDF(G, f, L, i, d, E, c, .5, .5);
#else
    vec3 n = vec3(r) * vec3(RunescapeRT5BRDF(G, f, c));
#endif
    n *= A * e;
    v.Specular += n;
#endif
}
void EvaluateDirLightRT7(inout LightingTerms v, vec3 f, vec3 L, vec3 d, vec3 i, vec3 S, float c, float E, float G, float e, float F, vec3 A)
{
    v.Diffuse += A * e;
#if defined(SPECULAR_LIGHTING)
    vec3 r = normalize(d + i), n = FresnelSchlick(S, clamp(dot(i, r), 0., 1.), G);
#if defined(ANISOTROPY_BRDF)
    vec3 D = AnisotropicBRDF(r, f, L, i, d, F, c, .5, .5);
#else
    vec3 C = CookTorranceBRDF(c, E, n, f, r, d, i, F);
#endif
    C *= A * e;
    v.Specular += C;
#endif
}
float SpecularHorizonOcclusion(float L, vec3 i, vec3 v)
{
    vec3 d = reflect(i, v);
    float A = clamp(1. + L * dot(d, v), 0., 1.);
    A *= A;
    return A;
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#endif

#if !defined(DEFERRED_SHADOWS)
LightingTerms EvaluateSunlightRT5(inout int i, inout float E, highp vec4 v, vec3 u, vec3 f, float d, vec3 n, float p, float S, float r)
{
    float t = max(0., dot(u, uInvSunDirection)), L = t;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS)
    if (S == 0. && uMappingParams.p != 0.)
    {
        if (L > 0.)
        {
            highp vec4 h = uSunlightViewMatrix * v, e = vec4(u.st, 0., 0.) * 32.;
            E = DirLightShadowAtten(i, v + e, h + e, d, uSunlightShadowMap, uSunlightShadowTranslucencyMap, r);
        }
    }
#endif
    L *= E;
    float h = .65;
    LightingTerms D;
    ClearLightingTerms(D);
    EvaluateDirLightRT5(D, u, f, n, uInvSunDirection, h, p, 5., L, t, uSunColour);
    return D;
}
#else
LightingTerms EvaluateSunlightRT5(inout float E, vec3 u, vec3 v, vec3 f, vec2 d, float n, float S)
{
    float t = max(0., dot(u, uInvSunDirection)), L = t;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS) && defined(DEFERRED_SHADOWS)
    if (S == 0. && uMappingParams.p != 0.)
        E = texture2DLod(uShadowBuffer, d, 0.).s;
#endif
    L *= E;
    float h = .65;
    LightingTerms D;
    ClearLightingTerms(D);
    EvaluateDirLightRT5(D, u, v, f, uInvSunDirection, h, n, 5., L, uSunColour);
    return D;
}
#endif
#if !defined(DEFERRED_SHADOWS)
LightingTerms EvaluateSunlightRT7(inout int u, inout float E, highp vec4 v, vec3 f, vec3 d, float n, vec3 h, vec3 L, float p, float i, float t, float S)
{
    float D = max(0., dot(f, uInvSunDirection)), e = D;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS)
    if (uMappingParams.p != 0.)
    {
        if (D > 0.)
        {
            highp vec4 r = uSunlightViewMatrix * v, a = vec4(f.st, 0., 0.) * 32.;
            E = DirLightShadowAtten(u, v + a, r + a, n, uSunlightShadowMap, uSunlightShadowTranslucencyMap, S);
        }
    }
#endif
    e *= E;
    LightingTerms r;
    ClearLightingTerms(r);
    EvaluateDirLightRT7(r, f, d, h, uInvSunDirection, L, p, i, t, e, D, uSunColour);
    return r;
}
#else
LightingTerms EvaluateSunlightRT7(inout float E, vec3 u, vec3 v, vec3 f, vec2 d, vec3 n, float h, float L, float r)
{
    float t = max(0., dot(u, uInvSunDirection)), p = t;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS) && defined(DEFERRED_SHADOWS)
    if (uMappingParams.p != 0.)
        E = texture2DLod(uShadowBuffer, d, 0.).s;
#endif
    LightingTerms D;
    ClearLightingTerms(D);
    EvaluateDirLightRT7(D, u, v, f, uInvSunDirection, n, h, L, r, t, p, uSunColour);
    return D;
}
#endif
#endif

#ifndef DISTANCE_FOG_UNIFORMS
#define DISTANCE_FOG_UNIFORMS
#if defined(FOG_DISTANCE)
UNIFORM_BUFFER_BEGIN(DistanceFog)
uniform mediump vec4 uFogColour;
uniform highp vec4 uFogParams;
UNIFORM_BUFFER_END
#endif
#endif

#ifndef DISTANCE_FOG_FUNCTIONS
#define DISTANCE_FOG_FUNCTIONS
#if defined(FOG_DISTANCE)
float FogBasedOnDistance(highp float f)
{
    highp float F = (uFogParams.t - f) * uFogParams.s;
    return 1. - clamp(F, 0., 1.);
}
float FogBasedOnAngle(highp vec3 f)
{
    highp float F = 1. - clamp(f.t + uFogParams.q, 0., 1.);
    F = pow(F, uFogParams.p);
    return clamp(F, 0., 1.);
}
#endif
#endif

#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

float GenerateNoise()
{
    const float d = 512., v = .125;
    return clamp(cnoise(vPosition_WaterDepth.sp / d) * v, 0., 1.);
}
vec2 GetCombinedFlow() { return vNoisyPatchFlow0_NoisyPatchFlow1.st * vFlowControlMask_ViewSpaceDepth.s + vNoisyPatchFlow0_NoisyPatchFlow1.pq * vFlowControlMask_ViewSpaceDepth.t + vNoisyPatchFlow2_UVPack_NormalsFlow0Map0.st * vFlowControlMask_ViewSpaceDepth.p; }
#if defined(WATER_NORMAL_MAPS)
vec4 WeightedNormalMap_XY_DXDY(highp float v, sampler2D d, vec2 f, vec2 p, float E)
{
    if (v <= 0.)
        return vec4(0.);
    vec3 u = UnpackNormal(texture2D(d, f));
    vec2 t = u.st / u.p;
    const float W = 6.;
    float q = clamp(length(p) * W + uWaterStillWaterNormalStrength_spareyzw.s, 0., 1.);
    return vec4(u.st, t * q) * v * E;
}
vec2 GetNormalDXDYWeightedSum(highp vec4 d, highp vec4 v, highp vec4 u, vec2 f, vec2 p, vec2 t, vec2 W, float E)
{
    vec4 h = vec4(0.);
    h += WeightedNormalMap_XY_DXDY(d.s, uWaterNormalMapTexture0, f, W, 1.);
    p += h.st * v.t * E;
    h += WeightedNormalMap_XY_DXDY(v.s, uWaterNormalMapTexture1, p, W, 1.);
    t += h.st * u.t * E;
    h += WeightedNormalMap_XY_DXDY(u.s, uWaterNormalMapTexture2, t, W, 1.);
    return h.pq;
}
vec3 WaterDetailNormalWeightedSum(vec2 v, vec2 p, vec2 d, vec2 f, vec3 h)
{
    const float u = .5;
    vec2 t = v + h.st * u * uSampleWeight_uvDistortion_sparezw[0].t, q = p + h.st * u * uSampleWeight_uvDistortion_sparezw[1].t, s = d + h.st * u * uSampleWeight_uvDistortion_sparezw[2].t;
    const float E = .8;
    vec2 W = GetNormalDXDYWeightedSum(uSampleWeight_uvDistortion_sparezw[0], uSampleWeight_uvDistortion_sparezw[1], uSampleWeight_uvDistortion_sparezw[2], t, q, s, f, E);
    return normalize(vec3(W, 1.));
}
#if !defined(GLES2_COMPAT_MODE)
vec3 WaterMacroNormalWeightedSum()
{
    const float d = .25;
    const vec2 v = vec2(.1, -.13) * d;
    const float f = .1;
    vec2 p = GetNormalDXDYWeightedSum(uMacroSampleWeight_uvDistortion_sparezw[0], uMacroSampleWeight_uvDistortion_sparezw[1], uMacroSampleWeight_uvDistortion_sparezw[2], vUVPack_NormalMapMacroUV_EmissiveUV[0].st, vUVPack_NormalMapMacroUV_EmissiveUV[1].st, vUVPack_NormalMapMacroUV_EmissiveUV[2].st, v, f);
    return normalize(vec3(p, 1.));
}
#else
vec3 WaterMacroNormalWeightedSum()
{
    const float d = .25;
    const vec2 v = vec2(.1, -.13) * d;
    const float f = .1, p = .1;
    vec2 W = vPosition_WaterDepth.sp * uWaterNormalMapTextureScales_FlowNoiseScale.s * p, u = vPosition_WaterDepth.sp * uWaterNormalMapTextureScales_FlowNoiseScale.t * p, t = vPosition_WaterDepth.sp * uWaterNormalMapTextureScales_FlowNoiseScale.p * p;
    const float E = .01;
    vec2 q = vec2(.1, -.13), s = vec2(-.08, .1), r = vec2(.11, -.9);
    const float n = .5;
    highp float m = uWaterTickFade.s * n;
    vec2 h = W + q * d * m, e = u + s * d * m, c = t + r * d * m, G = GetNormalDXDYWeightedSum(uMacroSampleWeight_uvDistortion_sparezw[0], uMacroSampleWeight_uvDistortion_sparezw[1], uMacroSampleWeight_uvDistortion_sparezw[2], h, e, c, v, f);
    return normalize(vec3(G, 1.));
}
#endif
vec3 WaterNormal()
{
    vec3 v = WaterMacroNormalWeightedSum(), u = vec3(0.);
    vec2 f = vNoisyPatchFlow0_NoisyPatchFlow1.pq - vNoisyPatchFlow0_NoisyPatchFlow1.st, p = vNoisyPatchFlow2_UVPack_NormalsFlow0Map0.st - vNoisyPatchFlow0_NoisyPatchFlow1.st, t = vec2(0., 0.), q = vec2(0., 0.), s = vec2(0., 0.), W = vec2(0., 0.), r = vec2(0., 0.), c = vec2(0., 0.), i = vec2(0., 0.), h = vec2(0., 0.), e = vec2(0., 0.);
#if !defined(GLES2_COMPAT_MODE)
    t = vNoisyPatchFlow2_UVPack_NormalsFlow0Map0.pq;
    q = vUVPack_NormalsFlow0Map1_NormalsFlow0Map2.st;
    s = vUVPack_NormalsFlow0Map1_NormalsFlow0Map2.pq;
    W = vUVPack_NormalsFlow1Map0_NormalsFlow1Map1.st;
    r = vUVPack_NormalsFlow1Map0_NormalsFlow1Map1.pq;
    c = vUVPack_NormalsFlow1Map2_NormalsFlow2Map0.st;
    i = vUVPack_NormalsFlow1Map2_NormalsFlow2Map0.pq;
    h = vUVPack_NormalsFlow2Map1_NormalsFlow2Map2.st;
    e = vUVPack_NormalsFlow2Map1_NormalsFlow2Map2.pq;
#else
    vec2 d = vNoisyPatchFlow2_UVPack_NormalsFlow0Map0.pq, m = vUVPack_NormalsFlow1Map0_NormalsFlow2Map0.st, E = vUVPack_NormalsFlow1Map0_NormalsFlow2Map0.pq;
    t = d;
    q = d * vec2(-.96, .95);
    s = d * vec2(.97, -.94);
    W = m;
    r = m * vec2(-.96, .95);
    c = m * vec2(.97, -.94);
    i = E;
    h = E * vec2(-.96, .95);
    e = E * vec2(.97, -.94);
#endif
    const float G = 1e-07;
    if (dot(f, f) <= G && dot(p, p) <= G)
        u = WaterDetailNormalWeightedSum(t, q, s, vNoisyPatchFlow0_NoisyPatchFlow1.st, v) + v;
    else
        u += (WaterDetailNormalWeightedSum(t, q, s, vNoisyPatchFlow0_NoisyPatchFlow1.st, v) + v) * vFlowControlMask_ViewSpaceDepth.s, u += (WaterDetailNormalWeightedSum(W, r, c, vNoisyPatchFlow0_NoisyPatchFlow1.pq, v) + v) * vFlowControlMask_ViewSpaceDepth.t, u += (WaterDetailNormalWeightedSum(i, h, e, vNoisyPatchFlow2_UVPack_NormalsFlow0Map0.st, v) + v) * vFlowControlMask_ViewSpaceDepth.p;
    return normalize(u).spt;
}
#else
vec3 WaterNormal()
{
    return vec3(0., 1., 0.);
}
#endif
vec3 WaterAlbedo(float v, float d, float E)
{
    vec3 f = vColour.stp;
#if defined(WATER_FOAM_MAP)
    float p = uWaterFoamScaleFoamDepth.t, u = clamp((1. - step(p, 0.)) * min(1., 1. - min(v / p, 1.)), 0., 1.), q = uWaterTickFade.s + vPosition_WaterDepth.s * .0001 + vPosition_WaterDepth.p * .0001, t = pow(max(0., cos(abs(v) * .005 + q + E * 4.)), 8.), s = pow(max(0., cos(abs(v) * .005 - q + E * 8.)), 4.), r = min(1., t + s * u) * max(.2 - d, 0.);
#if !defined(GLES2_COMPAT_MODE)
    vec4 h = texture2D(uWaterTextureFoam, vUVPack_FoamUV.st) * uWaterFoamScaleFoamDepth.s;
    vec3 W = h.stp * h.q;
    f = mix(vColour.stp, W, r * u);
#else
    f = vColour.stp;
#endif

#endif
    return f;
}
float WaterSoftEdgeAlpha(float v)
{
    const float p = .004, u = 1.;
    float f;
#if defined(WATER_EXTINCTION)
    const float d = .002;
    float W = uWaterExtinctionVisibilityMetres / d, t = p + 1. / (W + .001), s = pow(v * t, u);
    f = clamp(s, 0., 1.);
#else
    float q = pow(v * p, u);
    f = clamp(q, 0., 1.);
#endif
    return f;
}
float SunLightShadowAttenuation(vec3 d, vec3 p, vec2 v, vec3 f, float E)
{
    float W = 1.;
#if defined(SUNLIGHT_SHADOWS)
    int u = -1;
    vec4 t = uSunlightViewMatrix * vec4(vPosition_WaterDepth.stp, 1.);
    W = DirLightShadowAtten(u, vec4(vPosition_WaterDepth.stp, 1.) + vec4(v, 0., 0.), t + vec4(v, 0., 0.), vFlowControlMask_ViewSpaceDepth.q, uSunlightShadowMap, uSunlightShadowTranslucencyMap, 1.);
#endif
    return W;
}
vec3 SunLightDiffuseContribution(vec3 v, vec3 d, vec2 p, vec3 f, float E, float u)
{
    vec3 r = vec3(0.);
#if defined(SUNLIGHT_DIRECT_LIGHTING)
    r = v * (dot(d, uInvSunDirection) * .5 + .5) * (1. - E) * uSunColour;
#else
    const float W = 2.;
    r = v * W;
#endif
    return r * u;
}
vec3 SunLightSpecularContribution(vec3 d, vec3 v, vec2 p, vec3 f, float t, float E)
{
    vec3 W = vec3(0.);
#if defined(SPECULAR_LIGHTING)
    vec3 u = normalize(uInvSunDirection - f);
    float q = clamp(dot(u, v), 0., 1.);
    W = uSunColour * uSunColour * t * clamp(uInvSunDirection.t, 0., 1.) * pow(q, uWaterNormalBRDFParams.p * .25) * (uWaterNormalBRDFParams.q * 1.8 + .2) * clamp(uWaterNormalBRDFParams.q - .05, 0., 1.) * 25.;
#endif
    return W * E;
}
#if defined(GLOBAL_ENVIRONMENTMAPPING)
vec3 GetEnvironmentMapReflection(vec3 v, vec3 f)
{
    vec3 u = reflect(v, f);
    u.p = -u.p;
    u.t = abs(u.t);
    vec3 d = textureCubeSRGB(uGlobalEnvironmentMap, u).stp;
#if defined(FOG_DISTANCE)
    float E = FogBasedOnAngle(normalize(reflect(v, f)));
    d = mix(d.stp, uFogColour.stp, E);
#endif
    return d;
}
#endif
vec3 EnvMapContribution(vec3 v, vec3 f, vec3 d, float E)
{
    vec3 W = vec3(0.);
    float u = 1.;
#if defined(GLOBAL_ENVIRONMENTMAPPING)

#if defined(REFLECTION)
    u = uWaterReflectionStrength;
    if (uWaterReflectionMapContribution < 1.)
#endif
    {
        vec3 t = GetEnvironmentMapReflection(d, f);
#if defined(REFLECTION)
        t *= 1. - uWaterReflectionMapContribution;
#endif
        W = t * mix(v, vec3(1., 1., 1.), E);
    }
#endif
    return W * u;
}
vec3 WaterReflection(vec3 v, vec3 f, vec2 d, vec3 p, float E)
{
    vec3 W = vec3(0.);
#if defined(REFLECTION)
    vec2 u = uViewportOffsetScale.st * uFullScreenLookupScale.pq, h = gl_FragCoord.st + d;
    h = (h - u) * uViewportLookupScale.st;
    vec4 r = texture2DLodCompat(uReflectionMap, vec2(1. - h.s, h.t), 0.);
    if (r.q < 1.)
    {
        h = gl_FragCoord.st;
        h = (h - u) * uViewportLookupScale.st;
        r = texture2DLodCompat(uReflectionMap, vec2(1. - h.s, h.t), 0.);
#if defined(GLOBAL_ENVIRONMENTMAPPING)
        if (r.q == 0.)
            r.stp = GetEnvironmentMapReflection(p, f), r.q = 1.;
#endif
    }
    W = r.stp * mix(v, vec3(1.), E) * uWaterReflectionMapContribution * uWaterReflectionStrength;
#endif
    return W;
}
vec3 WaterExtinction(vec3 v, vec3 d, float f, vec2 p, vec3 W, float E)
{
    vec3 t = d;
#if defined(WATER_EXTINCTION) && defined(REFRACTION)
    const float u = .002;
    if (uWaterFeatureFlags.t >= 1.)
    {
        vec3 h = GetWorldSpacePos(p, f, uSceneInvViewProjMatrix).stp;
        float r = length(h - vPosition_WaterDepth.stp) * u;
        highp float q = abs(h.t - vPosition_WaterDepth.t) * u, s = mix(.04, 1., clamp(uWaterExtinctionVisibilityMetres, 0., 1.));
        vec3 m = W / v, c = v / max(max(v.s, v.t), v.p), n = m * c, e = uWaterExtinctionOpaqueWaterColour * n;
        float G = clamp(r / uWaterExtinctionVisibilityMetres, 0., 1.), S = pow(G, s);
        vec3 i = mix(d, e, S);
        const float N = .25;
        vec3 C = clamp(q / (uWaterExtinctionRGBDepthMetres * c), 0., 1.), P = pow(C, vec3(N));
        t = i * (1. - P);
        t = mix(d, t, E);
    }
#endif
    return t;
}
vec3 WaterRefractionWithExtinction(vec3 v, vec3 d, float p, float t, vec3 f, float u)
{
    vec3 W = vec3(0.);
#if defined(REFRACTION)
    vec2 E = uViewportOffsetScale.st * uFullScreenLookupScale.pq;
    vec3 q = vec3(0.);
    float r = 0.;
    highp vec2 h = d.sp * min(sqrt(p) * u * 2., 128.);
    vec2 s = gl_FragCoord.st + h * t * 2.;
    s = (s - E) * uViewportLookupScale.st;
    if (uWaterFeatureFlags.s >= 1.)
    {
#if !defined(NXT_MOBILE)
        r = texture2DLodCompat(uRefractionDepth, s, 0.).s;
        if (r < gl_FragCoord.p || r >= 1.)
            s = gl_FragCoord.st, s = (s - E) * uViewportLookupScale.st;
#endif
        q = texture2DLodCompat(uRefractionMap, vec3(s, 0.), 0.).stp;
    }
    W = WaterExtinction(v, q, r, s, f, u);
#endif
    return W;
}
#if defined(WATER_EMISSIVE) && !defined(GLES2_COMPAT_MODE)
#define EMISSIVE_MAP_MASK (0)
#define EMISSIVE_MAP_RGBMAP_MASK (1)
vec4 SampleEmissiveMap(sampler2D v, vec2 E)
{
    vec2 u = vUVPack_NormalMapMacroUV_EmissiveUV[1].pq - vUVPack_NormalMapMacroUV_EmissiveUV[0].pq, p = vUVPack_NormalMapMacroUV_EmissiveUV[2].pq - vUVPack_NormalMapMacroUV_EmissiveUV[0].pq;
    const float W = 1e-07;
    if (dot(u, u) <= W && dot(p, p) <= W)
        return texture2D(v, vUVPack_NormalMapMacroUV_EmissiveUV[0].pq + E);
    else
    {
        vec4 f = texture2D(v, vUVPack_NormalMapMacroUV_EmissiveUV[0].pq + E) * vFlowControlMask_ViewSpaceDepth.s;
        f += texture2D(v, vUVPack_NormalMapMacroUV_EmissiveUV[1].pq + E) * vFlowControlMask_ViewSpaceDepth.t;
        f += texture2D(v, vUVPack_NormalMapMacroUV_EmissiveUV[2].pq + E) * vFlowControlMask_ViewSpaceDepth.p;
        return f;
    }
}
vec4 EmissiveContribution_Mask(vec3 v, vec2 f)
{
    float E = SampleEmissiveMap(uWaterEmissiveMapTexture, f).s;
    vec3 d = mix(v, uWaterEmissiveColourEmissiveSource.stp, uWaterEmissiveColourEmissiveSource.q);
    float W = uEmissiveScale_MapRefractionDepth_EmissiveMapMode_EmissiveMapExists.s;
    return vec4(d * (1. + W), E);
}
vec4 EmissiveContribution_RGBMapMask(vec3 v, vec2 f)
{
    vec4 h = SampleEmissiveMap(uWaterEmissiveMapTexture, f);
    vec3 d = mix(v, h.stp * uWaterEmissiveColourEmissiveSource.stp, uWaterEmissiveColourEmissiveSource.q);
    float E = uEmissiveScale_MapRefractionDepth_EmissiveMapMode_EmissiveMapExists.s;
    return vec4(d * (1. + E), h.q);
}
vec4 EmissiveContribution_NoMap(vec3 v)
{
    vec3 d = mix(v, uWaterEmissiveColourEmissiveSource.stp, uWaterEmissiveColourEmissiveSource.q);
    float E = uEmissiveScale_MapRefractionDepth_EmissiveMapMode_EmissiveMapExists.s;
    return vec4(d * (1. + E), 1.);
}
vec4 EmissiveContribution(vec3 v, vec3 d, float E)
{
    int W = int(uEmissiveScale_MapRefractionDepth_EmissiveMapMode_EmissiveMapExists.q);
    if (W == 0)
        return EmissiveContribution_NoMap(v);
    vec2 f = d.sp * uEmissiveScale_MapRefractionDepth_EmissiveMapMode_EmissiveMapExists.t * E * 2.;
    int u = int(uEmissiveScale_MapRefractionDepth_EmissiveMapMode_EmissiveMapExists.p);
    if (u == EMISSIVE_MAP_MASK)
        return EmissiveContribution_Mask(v, f);
    else
        return EmissiveContribution_RGBMapMask(v, f);
}
#endif
#if (defined(SUNLIGHT_SHADOWS) && defined(DEBUG_SUNLIGHT_SHADOW_CASCADE) && !defined(DEFERRED_SHADOWS)) || defined(DEBUG_ALBEDO) || defined(DEBUG_NORMALS)
#define WATER_DEBUG_OUTPUT
#endif
#if defined(WATER_DEBUG_OUTPUT)
void WaterWriteDebugColour(vec3 v, vec3 d)
{
#if defined(DEBUG_ALBEDO)
    gl_FragColor = vec4(v, 1.);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(DEBUG_NORMALS)
    gl_FragColor = vec4(d * .5 + .5, 1.);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(SUNLIGHT_SHADOWS) && defined(DEBUG_SUNLIGHT_SHADOW_CASCADE) && !defined(DEFERRED_SHADOWS)
    gl_FragColor = vec4(ShadowMapCascadeColour(iCascade, int(uMappingParams.q)).stp, 1.);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif
}
#endif
void WaterFragment()
{
    vec3 v = vPosition_WaterDepth.stp - uCameraPosition;
    float d = length(v);
    vec3 f = v / d;
    vec2 u = GetCombinedFlow();
    float p = length(u), E = GenerateNoise();
    vec3 W = WaterAlbedo(vPosition_WaterDepth.q, p, E), h = WaterNormal();
    vec2 t = h.sp * min(vPosition_WaterDepth.q, 32.);
    float q = WaterSoftEdgeAlpha(vPosition_WaterDepth.q);
    vec4 r = vec4(0.);
    r.q = q;
    const float s = .28, e = 0., c = .6;
    float G = clamp(FresnelSchlick(h, -f, s), e, c), S = clamp(G + uWaterNormalBRDFParams.s, e, c);
    r.q *= G;
    r.stp += WaterReflection(W, h, t, f, S);
    r.stp += EnvMapContribution(W, h, f, S);
    float N = SunLightShadowAttenuation(W, h, t, f, G);
    vec3 m = SunLightDiffuseContribution(W, h, t, f, G, N), n = SunLightSpecularContribution(W, h, t, f, S, N);
    r.stp += n;
#if defined(SUNLIGHT_DIRECT_LIGHTING) && (defined(LIGHT_SCATTERING) || defined(FOG_DISTANCE))
    vec3 i = vOutScattering, P = vInScattering;
    r.stp = ApplyInOutScattering(r.stp, i, P);
    r.q = mix(r.q, 1., vColour.q);
#endif

#if !defined(REFRACTION)
    r.stp += m;
#if defined(WATER_EMISSIVE) && !defined(GLES2_COMPAT_MODE)
    vec4 C = EmissiveContribution(W, h, G);
    r.stp = mix(r.stp, C.stp, C.q * q * uEmissiveBlend);
#endif

#else
    vec3 D = WaterRefractionWithExtinction(W, h, vPosition_WaterDepth.q, G, m, q);
#if defined(WATER_EMISSIVE) && !defined(GLES2_COMPAT_MODE)
    r.stp = mix(D, r.stp, G);
    vec4 g = EmissiveContribution(W, h, G);
    r.stp = mix(r.stp, g.stp, g.q * uEmissiveBlend);
    r.stp = mix(D, r.stp, q);
#else
    r.stp = mix(D, r.stp, r.q);
#endif

#endif

#if !defined(SUNLIGHT_DIRECT_LIGHTING)
    r.q = 1.;
#endif
    gl_FragColor = r;
#if defined(WATER_DEBUG_OUTPUT)
    WaterWriteDebugColour(W, h);
#endif
}
#if defined(CAUSTICS_STENCIL)
void CausticsStencil()
{
    gl_FragColor.s = float(texture2D(uCausticsMap, gl_FragCoord.st / uCausticsMapSize).s) * uCausticsScale / CAUSTICS_FIXED_POINT_SCALE;
}
#endif
#if defined(CAUSTICS_COMPUTE)
void CausticsCompute()
{
    vec3 v = WaterNormal();
    WriteCausticsRay(v, vPosition_WaterDepth.q);
    discard;
    return;
}
#endif
#if defined(CLIP_PLANE_CLAMP)
void ClipPlaneClamp()
{
    const float E = 200.;
    if (abs(vPosition_WaterDepth.t + uClipPlane.q) < E)
        gl_FragDepth = 1., gl_FragColor = vec4(uFogColour.stp, 1.);
    else
    {
        discard;
    }
}
#endif
void main()
{
#if defined(CLIP_PLANE_CLAMP)
    ClipPlaneClamp();
#elif defined(CAUSTICS_STENCIL)
    CausticsStencil();
#elif defined(CAUSTICS_COMPUTE)
    CausticsCompute();
#else
    WaterFragment();
#endif
}


/* MATCH 1 */

#version 460

/***************************************************/
/***************** GLSL Header *********************/
/***************************************************/
#ifdef GL_EXT_gpu_shader4
#extension GL_EXT_gpu_shader4 : enable
#endif
#ifdef GL_ARB_gpu_shader5
#extension GL_ARB_gpu_shader5 : enable
#endif
#ifdef GL_ARB_derivative_control
#extension GL_ARB_derivative_control : enable
#endif

#ifdef GL_ARB_texture_gather
#extension GL_ARB_texture_gather : enable
#endif

#define OGL_BACKEND

#undef attribute
#define attribute in

#undef gl_FragColor
#define gl_FragColor FragColor

#define shadow2DCompat texture

#undef textureCube
#define textureCube texture

#undef texture2D
#define texture2D texture

#undef texture3D
#define texture3D texture

#undef texture2DLod
#define texture2DLod textureLod

#undef textureCubeLod
#define textureCubeLod textureLod

#undef texture2DGrad
#define texture2DGrad textureGrad

#define MSAA_AVAILABLE

#define TEXTURE_OFFSET_AVAILABLE
#if !defined(lowp)
#define lowp
#endif
#if !defined(mediump)
#define mediump
#endif
#if !defined(highp)
#define highp
#endif

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define shadow2DLodCompat texture2DLod

#define texture2DLodCompat texture2DLod

#define textureCubeLodCompat textureCubeLod

#define textureGatherCompat(sampler, texCoord, viewportScale) textureGather(sampler, texCoord).wzxy

#define UNIFORM_BUFFER_BEGIN(name) \
    layout(std140) uniform name    \
    {
#define UNIFORM_BUFFER_END \
    }                      \
    ;

mat3 Mat4ToMat3(const mat4 inputMatrix)
{
    return mat3(inputMatrix);
}

#define isNaN isnan

#ifndef GL_ARB_derivative_control
#define dFdxFine dFdx
#define dFdyFine dFdy
#define fwidthFine fwidth
#endif

/***************************************************/

/***************************************************/
/***************** Effect Defines ******************/
/***************************************************/
#define VIEW_TRANSFORMS
#define WATER_COMMON

/*************************************************/

/***************************************************/
/********** Mandatory Shader Fragments *************/
/***************************************************/

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_X 3.0
#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_Y 4.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X 42.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_Y 32.0
#define MATERIAL_SETTINGS_TEXTURE_RESOLUTION 128.0
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif
#ifndef PACK_UTILS_INC
#define PACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

vec4 PackFloatToRGBA(highp float valueToPack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShift = vec4(256 * 256 * 256, 256 * 256, 256, 1.0);
    const highp vec4 bitMask = vec4(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
    highp vec4 fragColour = mod(valueToPack * bitShift * vec4(255), vec4(256)) / vec4(255);
    return fragColour - fragColour.xxyz * bitMask;
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
    const highp vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    highp vec4 fragColour = fract(valueToPack * bitShift);
    return fragColour - (fragColour.xxyz * bitMask);
#endif
}
vec2 NormalPackSphereMap(vec3 v)
{
    vec2 f = normalize(v.st) * sqrt(-v.p * .5 + .5);
    f = f * .5 + .5;
    return f * 65535.;
}
vec2 PackFloatToVec2(float v)
{
    vec2 f;
    const float b = 1. / 255.;
    vec2 h = vec2(1., 255.), r = fract(h * v);
    r.s -= r.t * b;
    return r.st;
}
#endif
#ifndef UNPACK_UTILS_INC
#define UNPACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

highp float UnpackRGBAToFloat(highp vec4 valueToUnpack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
    return dot(valueToUnpack, bitShifts);
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShifts = vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0);
    return dot(valueToUnpack, bitShifts);
#endif
}
vec3 ColourUnpack(highp float v)
{
    vec3 f;
    f.s = floor(v / 256. / 256.);
    f.t = floor((v - f.s * 256. * 256.) / 256.);
    f.p = floor(v - f.s * 256. * 256. - f.t * 256.);
    return f / 256.;
}
vec3 NormalUnpackSphereMap(vec2 v)
{
    vec4 f = vec4(v.s / 32767. - 1., v.t / 32767. - 1., 1., -1.);
    float U = dot(f.stp, -f.stq);
    f.st *= sqrt(U);
    f.p = U;
    return f.stp * 2. + vec3(0., 0., -1.);
}
highp float UnpackRGBAToIntegerFloat(highp vec4 f) { return floor(f.s * 255. + .5) * 256. * 256. * 256. + floor(f.t * 255. + .5) * 256. * 256. + floor(f.p * 255. + .5) * 256. + floor(f.q * 255. + .5); }
highp float UnpackRGBAToIntegerFloat16(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
highp int UnpackRGBAToInt(vec4 f) { return int(UnpackRGBAToIntegerFloat(f)); }
highp vec4 UnpackFloatToRGBA(highp float f)
{
    const highp vec4 v = vec4(1., 255., 65025., 1.65814e+07), s = vec4(vec3(1. / 255.), 0.);
    highp vec4 U = fract(f * v);
    U -= U.sstp * s;
    return U;
}
highp float UnpackVec2ToFloat(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
#endif
#if defined(MSAA) && defined(MSAA_AVAILABLE)
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2DMS
#define MSAA_SAMPLERS_ENABLED 1
#define texture2DMultisample(sampler, texCoord, texSize) texelFetch(sampler, ivec2((texCoord)*texSize), 0)
#else
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2D
#define MSAA_SAMPLERS_ENABLED 0
#define texture2DMultisample(sampler, texCoord, texSize) texture2DLodCompat(sampler, texCoord, 0.0)
#endif
UNIFORM_BUFFER_BEGIN(ViewportLookupScale)
uniform highp vec4 uViewportLookupScale;
uniform highp vec4 uViewportOffsetScale;
uniform highp vec4 uFullScreenLookupScale;
UNIFORM_BUFFER_END

/***************************************************/

uniform lowp vec4 uWaterFeatureFlags;
uniform highp vec4 uWaterNormalMapTextureScales_FlowNoiseScale;
uniform highp vec2 uWaterTickFade;
uniform mat4 uModelMatrix;

UNIFORM_BUFFER_BEGIN(ViewTransforms)
uniform highp vec3 uCameraPosition;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;
uniform highp mat4 uViewProjMatrix;
uniform highp vec4 uZBufferParams;
UNIFORM_BUFFER_END
out highp vec4 vPosition_WaterDepth;
out vec4 vColour;
out highp vec4 vFlowControlMask_ViewSpaceDepth;
out highp vec4 vNoisyPatchFlow0_NoisyPatchFlow1;
out highp vec4 vNoisyPatchFlow2_UVPack_NormalsFlow0Map0;
out highp vec4 vUVPack_NormalsFlow0Map1_NormalsFlow0Map2;
out highp vec4 vUVPack_NormalsFlow1Map0_NormalsFlow1Map1;
out highp vec4 vUVPack_NormalsFlow1Map2_NormalsFlow2Map0;
out highp vec4 vUVPack_NormalsFlow2Map1_NormalsFlow2Map2;
out highp vec4 vUVPack_NormalMapMacroUV_EmissiveUV[3];
out highp vec2 vUVPack_FoamUV;
attribute vec4 aWaterPosition_Depth, aVertexColour;
attribute vec2 aWaterFlowDataPatchFlow0, aWaterFlowDataPatchFlow1, aWaterFlowDataPatchFlow2;
attribute vec4 aWaterFlowDataFlowNoise0_FlowNoise1, aWaterFlowDataFlowNoise2_FlowIndex_Spare;
#ifndef DISTANCE_FOG_UNIFORMS
#define DISTANCE_FOG_UNIFORMS
#if defined(FOG_DISTANCE)
UNIFORM_BUFFER_BEGIN(DistanceFog)
uniform mediump vec4 uFogColour;
uniform highp vec4 uFogParams;
UNIFORM_BUFFER_END
#endif
#endif

#ifndef DISTANCE_FOG_FUNCTIONS
#define DISTANCE_FOG_FUNCTIONS
#if defined(FOG_DISTANCE)
float FogBasedOnDistance(highp float f)
{
    highp float F = (uFogParams.t - f) * uFogParams.s;
    return 1. - clamp(F, 0., 1.);
}
float FogBasedOnAngle(highp vec3 f)
{
    highp float F = 1. - clamp(f.t + uFogParams.q, 0., 1.);
    F = pow(F, uFogParams.p);
    return clamp(F, 0., 1.);
}
#endif
#endif

#ifndef VOLUMETRIC_FUNCTIONS_INC
#define VOLUMETRIC_FUNCTIONS_INC
#if defined(SUNLIGHT_SHADOWS) && defined(VOLUMETRIC_SCATTERING) && defined(SUNLIGHT_DIRECT_LIGHTING)
#define VOLUMETRIC_SCATTERING_SUPPORTED
uniform vec4 uMieG, uVolumetricScatteringParameters;
#if defined(VOLUMETRIC_GROUND_FOG)
uniform vec4 uGroundFogHeight_Falloff;
#endif
#if defined(VOLUMETRIC_SCATTERING_NOISE)
uniform sampler3D sNoiseTex;
uniform vec4 u3DNoiseFrequency_Strength, u3DNoiseWind_Power;
#endif
uniform float uTime;
float ShadowSample(vec4 u, vec4 v, float s)
{
    int d = int(uMappingParams.q);
    vec4 f;
    int G;
#if defined(CASCADE_SPLIT_SELECTION)
    G = ShadowMapSelectCascadeBySplit(s, uCascadeFrustumViewDepths, uCascadeSplitSelectionFlags);
#if defined(USE_LIGHT_VIEW_PROJ_TEX_MATRIX)
    f = uSunlightViewProjTexMatrix[G] * u;
#else
    f = v * uSunlightProjTexMatScale[G] + uSunlightProjTexMatOffset[G];
#endif

#else

#if defined(USE_LIGHT_VIEW_PROJ_TEX_MATRIX)
    G = ShadowMapSelectCascadeByMap(f, u, uSunlightViewProjTexMatrix, uCascadeMinAtlasExtents);
#else
    G = ShadowMapSelectCascadeByMap(f, v, uSunlightProjTexMatScale, uSunlightProjTexMatOffset, uCascadeMinAtlasExtents);
#endif

#endif
    return G >= d ? 1. : ShadowDepthMapFilter1x1(uSunlightShadowMap, f);
}
float PhaseFunction(float v, vec4 s) { return s.q * (s.s / pow(s.t - s.p * v, 1.5)); }
vec4 GetScatteredInRay(int s, vec3 u, float v, float d, vec4 f)
{
    float G = uSunlightFadeAttenParams.t * 1.4, m = min(G, v);
    vec3 V = uCameraPosition, t = V + u * m;
    vec4 x = uSunlightViewMatrix * vec4(V, 1.), e = uSunlightViewMatrix * vec4(t, 1.), i = uSunlightViewMatrix * vec4(V, 0.), n = uSunlightViewMatrix * vec4(t, 0.);
    vec3 E = vec3(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2]);
    int S = int(uMappingParams.q);
    float q = 0., p = 1. / float(s), N = d * p, h = m * p;
    vec2 r = vec2(0., 0.);
#if defined(VOLUMETRIC_SCATTERING_NOISE)
    vec3 P = vec3(.05 * uTime), a = u3DNoiseWind_Power.stp * uTime;
    const float o = .31;
    float c = u3DNoiseFrequency_Strength.s * o;
    vec3 l = a * u3DNoiseFrequency_Strength.s, T = a * c;
#endif
    for (int X = 0; X < s; ++X)
    {
        vec3 U = mix(V, t, N);
        vec4 I = mix(x, e, N);
#if defined(VOLUMETRIC_SCATTERING_NOISE)
        vec4 M = mix(i, n, N);
        vec3 C = M.sts * vec3(.001) + P, g = M.sts * vec3(.001) - P;
        I.sp += vec2(texture3D(sNoiseTex, g).s, texture3D(sNoiseTex, g).s) * 128. - 64.;
#endif
        float R = 0.;
#if defined(USE_CASCADE_SPLIT_SELECTION)
        vec3 O = U.stp - uCameraPosition;
        R = abs(dot(O, E));
#endif
        float F = ShadowSample(vec4(U, 1.f), I, R), D = 1., w = 1.;
#if defined(VOLUMETRIC_GROUND_FOG)
        if (uGroundFogHeight_Falloff.t != 0.)
        {
            float L = max(0., (U.t - uGroundFogHeight_Falloff.s) * uGroundFogHeight_Falloff.t);
            w = exp(-L) * 100.;
        }
#endif

#if defined(VOLUMETRIC_SCATTERING_NOISE)
        if (u3DNoiseFrequency_Strength.t != 0.)
        {
            vec3 L = U * u3DNoiseFrequency_Strength.s + l;
            float y = float(texture3D(sNoiseTex, L));
            vec3 A = U * c + T;
            float H = float(texture3D(sNoiseTex, A)), W = pow(mix(y, H, .8) + .5, u3DNoiseWind_Power.q);
            w *= max(0, mix(1., W, u3DNoiseFrequency_Strength.t));
        }
#endif
        D += w;
        float L = D * h, W = uVolumetricScatteringParameters.s * L;
        q += uVolumetricScatteringParameters.t * L;
        r += W * exp(-q) * vec2(F, 1. - F);
        N += p;
    }
    if (v > G)
    {
        float L = v - G, U = uVolumetricScatteringParameters.s * L;
        q += uVolumetricScatteringParameters.t * L;
        r += vec2(U * exp(-q), 0.);
    }
    float U = r.s + r.t;
    if (U > 0.)
    {
        float L = r.s / U, g = uVolumetricScatteringParameters.q;
        L = pow(L, g);
        r.st = U * vec2(L, 1. - L);
        r.s = r.s * PhaseFunction(dot(u, uInvSunDirection), f);
    }
    return vec4(r.s, q, r.t, 1.);
}
vec4 GetScatteredInRay2(int s, vec3 u, float v, float f) { return GetScatteredInRay(s, u, v, f, uMieG); }
vec4 GetScatteredInRayLine(int s, vec3 u, float v, vec3 f, float d, float G)
{
    vec4 L = GetScatteredInRay2(s, u, v, G), t = GetScatteredInRay2(s, mix(u, f, .33), mix(v, d, .33), G), m = GetScatteredInRay2(s, mix(u, f, .66), mix(v, d, .66), G), U = GetScatteredInRay2(s, f, d, G);
    return L * .15 + t * .2 + m * .3 + U * .35;
}
#endif
#endif

#ifndef APPLY_VOLUMETRICS_INC
#define APPLY_VOLUMETRICS_INC
#ifndef VOLUMETRIC_FUNCTIONS_INC
#define VOLUMETRIC_FUNCTIONS_INC
#if defined(SUNLIGHT_SHADOWS) && defined(VOLUMETRIC_SCATTERING) && defined(SUNLIGHT_DIRECT_LIGHTING)
#define VOLUMETRIC_SCATTERING_SUPPORTED
uniform vec4 uMieG, uVolumetricScatteringParameters;
#if defined(VOLUMETRIC_GROUND_FOG)
uniform vec4 uGroundFogHeight_Falloff;
#endif
#if defined(VOLUMETRIC_SCATTERING_NOISE)
uniform sampler3D sNoiseTex;
uniform vec4 u3DNoiseFrequency_Strength, u3DNoiseWind_Power;
#endif
uniform float uTime;
float ShadowSample(vec4 u, vec4 v, float s)
{
    int d = int(uMappingParams.q);
    vec4 f;
    int G;
#if defined(CASCADE_SPLIT_SELECTION)
    G = ShadowMapSelectCascadeBySplit(s, uCascadeFrustumViewDepths, uCascadeSplitSelectionFlags);
#if defined(USE_LIGHT_VIEW_PROJ_TEX_MATRIX)
    f = uSunlightViewProjTexMatrix[G] * u;
#else
    f = v * uSunlightProjTexMatScale[G] + uSunlightProjTexMatOffset[G];
#endif

#else

#if defined(USE_LIGHT_VIEW_PROJ_TEX_MATRIX)
    G = ShadowMapSelectCascadeByMap(f, u, uSunlightViewProjTexMatrix, uCascadeMinAtlasExtents);
#else
    G = ShadowMapSelectCascadeByMap(f, v, uSunlightProjTexMatScale, uSunlightProjTexMatOffset, uCascadeMinAtlasExtents);
#endif

#endif
    return G >= d ? 1. : ShadowDepthMapFilter1x1(uSunlightShadowMap, f);
}
float PhaseFunction(float v, vec4 s) { return s.q * (s.s / pow(s.t - s.p * v, 1.5)); }
vec4 GetScatteredInRay(int s, vec3 u, float v, float d, vec4 f)
{
    float G = uSunlightFadeAttenParams.t * 1.4, m = min(G, v);
    vec3 V = uCameraPosition, t = V + u * m;
    vec4 x = uSunlightViewMatrix * vec4(V, 1.), e = uSunlightViewMatrix * vec4(t, 1.), i = uSunlightViewMatrix * vec4(V, 0.), n = uSunlightViewMatrix * vec4(t, 0.);
    vec3 E = vec3(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2]);
    int S = int(uMappingParams.q);
    float q = 0., p = 1. / float(s), N = d * p, h = m * p;
    vec2 r = vec2(0., 0.);
#if defined(VOLUMETRIC_SCATTERING_NOISE)
    vec3 P = vec3(.05 * uTime), a = u3DNoiseWind_Power.stp * uTime;
    const float o = .31;
    float c = u3DNoiseFrequency_Strength.s * o;
    vec3 l = a * u3DNoiseFrequency_Strength.s, T = a * c;
#endif
    for (int X = 0; X < s; ++X)
    {
        vec3 U = mix(V, t, N);
        vec4 I = mix(x, e, N);
#if defined(VOLUMETRIC_SCATTERING_NOISE)
        vec4 M = mix(i, n, N);
        vec3 C = M.sts * vec3(.001) + P, g = M.sts * vec3(.001) - P;
        I.sp += vec2(texture3D(sNoiseTex, g).s, texture3D(sNoiseTex, g).s) * 128. - 64.;
#endif
        float R = 0.;
#if defined(USE_CASCADE_SPLIT_SELECTION)
        vec3 O = U.stp - uCameraPosition;
        R = abs(dot(O, E));
#endif
        float F = ShadowSample(vec4(U, 1.f), I, R), D = 1., w = 1.;
#if defined(VOLUMETRIC_GROUND_FOG)
        if (uGroundFogHeight_Falloff.t != 0.)
        {
            float L = max(0., (U.t - uGroundFogHeight_Falloff.s) * uGroundFogHeight_Falloff.t);
            w = exp(-L) * 100.;
        }
#endif

#if defined(VOLUMETRIC_SCATTERING_NOISE)
        if (u3DNoiseFrequency_Strength.t != 0.)
        {
            vec3 L = U * u3DNoiseFrequency_Strength.s + l;
            float y = float(texture3D(sNoiseTex, L));
            vec3 A = U * c + T;
            float H = float(texture3D(sNoiseTex, A)), W = pow(mix(y, H, .8) + .5, u3DNoiseWind_Power.q);
            w *= max(0, mix(1., W, u3DNoiseFrequency_Strength.t));
        }
#endif
        D += w;
        float L = D * h, W = uVolumetricScatteringParameters.s * L;
        q += uVolumetricScatteringParameters.t * L;
        r += W * exp(-q) * vec2(F, 1. - F);
        N += p;
    }
    if (v > G)
    {
        float L = v - G, U = uVolumetricScatteringParameters.s * L;
        q += uVolumetricScatteringParameters.t * L;
        r += vec2(U * exp(-q), 0.);
    }
    float U = r.s + r.t;
    if (U > 0.)
    {
        float L = r.s / U, g = uVolumetricScatteringParameters.q;
        L = pow(L, g);
        r.st = U * vec2(L, 1. - L);
        r.s = r.s * PhaseFunction(dot(u, uInvSunDirection), f);
    }
    return vec4(r.s, q, r.t, 1.);
}
vec4 GetScatteredInRay2(int s, vec3 u, float v, float f) { return GetScatteredInRay(s, u, v, f, uMieG); }
vec4 GetScatteredInRayLine(int s, vec3 u, float v, vec3 f, float d, float G)
{
    vec4 L = GetScatteredInRay2(s, u, v, G), t = GetScatteredInRay2(s, mix(u, f, .33), mix(v, d, .33), G), m = GetScatteredInRay2(s, mix(u, f, .66), mix(v, d, .66), G), U = GetScatteredInRay2(s, f, d, G);
    return L * .15 + t * .2 + m * .3 + U * .35;
}
#endif
#endif

#if defined(VOLUMETRIC_SCATTERING) && defined(SUNLIGHT_DIRECT_LIGHTING)
uniform vec3 uVolumetricLitFogColour, uVolumetricUnlitFogColour;
uniform mat4 uVolumetricDitherMat;
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

void GetInAndOutScattering(vec4 v, out vec3 u, out vec3 G)
{
    vec3 A = uSunColour * uVolumetricLitFogColour, o = uAmbientColour * uVolumetricUnlitFogColour;
    u = vec3(exp(-v.t));
    G = v.s * A + v.p * o;
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

vec4 ApplyVolumetricScattering(vec4 v, vec4 u)
{
    vec3 A = vec3(1.), o = vec3(0.);
    GetInAndOutScattering(u, A, o);
    return vec4(v.stp * A + o, v.q);
}
float CalculateScatteringOffset(vec2 v)
{
    vec2 u = vec2(floor(mod(v.st, 4.)));
    return uVolumetricDitherMat[int(u.s)][int(u.t)];
}
#endif
#endif

#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

vec2 GetFlowOrientedUV(vec2 v, vec2 u, float d, float E)
{
    float T = dot(u, u);
    const float q = 1e-06;
    vec2 e = T < q ? vec2(0., 1.) : normalize(u), t = vec2(e.t, -e.s);
    highp float f = length(u * d * E);
    return vec2(dot(t, v), dot(e, v) + f);
}
vec2 GetFlowOrientedUV(vec4 e, vec2 v, float d, vec2 u, float f)
{
    vec2 q = vec2(e.sp);
    float t = sign(u.t);
    return GetFlowOrientedUV(q, v * t, d, f) * u;
}
#if defined(WATER_NORMAL_MAPS)
vec2 TransformNormalMapTexCoordFlowAligned(in NormalMapTexCoordParams v, vec2 u, vec2 d, vec2 f)
{
    const float q = .5;
    highp float E = uWaterTickFade.s * q;
    float t = v.flowSpeed_spareyzw.s;
    vec2 T = GetFlowOrientedUV(u, v.flowRotation * d, t, E), a = (v.uvRotation * T + f * t * E) * v.uvScale_uvOffset.st + v.uvScale_uvOffset.pq;
    return a;
}
vec2 TransformNormalMapTexCoordAxisAligned(in NormalMapTexCoordParams v, vec2 u, vec2 d, vec2 f)
{
    const float q = .5;
    highp float t = uWaterTickFade.s * q;
    vec2 p = (d + f) * v.flowSpeed_spareyzw.s, E = v.flowRotation * p * t, a = v.uvRotation * (u + E) * v.uvScale_uvOffset.st + v.uvScale_uvOffset.pq;
    return a;
}
#if !defined(GLES2_COMPAT_MODE)
void ComputeNormalMapDetailTexCoords(vec2 v, vec2 d, vec2 f, vec2 u, vec2 t, vec2 a, vec2 p, vec2 s, vec2 E)
{
    vec2 q = vec2(1.), S = vec2(-1.), g = vec2(1., -1.), T = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[0], v, u, p * q), e = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[1], d, u, p * S), G = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[2], f, u, p * g), C = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[0], v, t, s * q), P = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[1], d, t, s * S), W = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[2], f, t, s * g), D = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[0], v, a, E * q), o = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[1], d, a, E * S), r = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[2], f, a, E * g);
    vNoisyPatchFlow2_UVPack_NormalsFlow0Map0.pq = T;
    vUVPack_NormalsFlow0Map1_NormalsFlow0Map2 = vec4(e, G);
    vUVPack_NormalsFlow1Map0_NormalsFlow1Map1 = vec4(C, P);
    vUVPack_NormalsFlow1Map2_NormalsFlow2Map0 = vec4(W, D);
    vUVPack_NormalsFlow2Map1_NormalsFlow2Map2 = vec4(o, r);
}
void ComputeNormalMapMacroTexCoords(vec2 v, vec2 d, vec2 f)
{
    const float q = .25;
    const vec2 t = vec2(.1, -.13) * q;
    const float u = .1;
    vUVPack_NormalMapMacroUV_EmissiveUV[0].st = TransformNormalMapTexCoordAxisAligned(uWaterNormalMapMacroTexCoordParams[0], v * u, t, vec2(0.));
    vUVPack_NormalMapMacroUV_EmissiveUV[1].st = TransformNormalMapTexCoordAxisAligned(uWaterNormalMapMacroTexCoordParams[1], d * u, t, vec2(0.));
    vUVPack_NormalMapMacroUV_EmissiveUV[2].st = TransformNormalMapTexCoordAxisAligned(uWaterNormalMapMacroTexCoordParams[2], f * u, t, vec2(0.));
}
#else
void ComputeNormalMapDetailTexCoords(vec2 v, vec2 d, vec2 f, vec2 t, vec2 u, vec2 E, vec2 a)
{
    vec2 q = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[0], v, d, u), e = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[0], v, f, E), S = TransformNormalMapTexCoordFlowAligned(uWaterNormalMapTexCoordParams[0], v, t, a);
    vNoisyPatchFlow2_UVPack_NormalsFlow0Map0.pq = q;
    vUVPack_NormalsFlow1Map0_NormalsFlow2Map0 = vec4(e, S);
}
#endif
#endif
#if defined(WATER_EMISSIVE) && !defined(GLES2_COMPAT_MODE)
#define EMISSIVE_UV_MODE_AXIS_ALIGNED (0)
#define EMISSIVE_UV_MODE_FLOW_ALIGNED (1)
void GetEmissiveFlow(out vec2 v, out vec2 d, out vec2 t, vec2 u, vec2 f, vec2 q, float E)
{
    float a = cos(E), S = sin(E);
    mat2 T = mat2(vec2(a, -S), vec2(S, a));
    vec2 G = T * u, e = T * f, p = T * q;
    const float g = 1e-06;
    vec3 C = vec3(G, dot(G, G)), s = vec3(e, dot(e, e)), r = vec3(p, dot(p, p));
    if (C.p < g)
        C = s.p > r.p ? s : r;
    if (s.p < g)
        s = r.p > C.p ? r : C;
    if (r.p < g)
        r = C.p > s.p ? C : s;
    v = C.st;
    d = s.st;
    t = r.st;
}
void ComputeEmissiveTexCoords(vec4 v, vec2 d, vec2 f, vec2 E)
{
    float t = uEmissiveFlowSpeed_EmissiveFlowRotation_EmissiveUVScale.s, q = uEmissiveFlowSpeed_EmissiveFlowRotation_EmissiveUVScale.t, u = uEmissiveMapScale_EmissiveUVMode.s;
    vec2 a = uEmissiveFlowSpeed_EmissiveFlowRotation_EmissiveUVScale.pq, p = vec2(0., 0.), s = vec2(0., 0.), e = vec2(0., 0.);
    GetEmissiveFlow(p, s, e, d, f, E, q);
    const float T = .5;
    highp float S = uWaterTickFade.s * T;
    vec2 G = v.sp * u;
    if (int(uEmissiveMapScale_EmissiveUVMode.t) == EMISSIVE_UV_MODE_FLOW_ALIGNED)
        vUVPack_NormalMapMacroUV_EmissiveUV[0].pq = GetFlowOrientedUV(G, p, t, S) * a, vUVPack_NormalMapMacroUV_EmissiveUV[1].pq = GetFlowOrientedUV(G, s, t, S) * a, vUVPack_NormalMapMacroUV_EmissiveUV[2].pq = GetFlowOrientedUV(G, e, t, S) * a;
    else
    {
        vec2 g = sign(a);
        vUVPack_NormalMapMacroUV_EmissiveUV[0].pq = G * a + p * g * t * S;
        vUVPack_NormalMapMacroUV_EmissiveUV[1].pq = G * a + s * g * t * S;
        vUVPack_NormalMapMacroUV_EmissiveUV[2].pq = G * a + e * g * t * S;
    }
}
#endif
void main()
{
    vec3 u = aWaterPosition_Depth.stp;
    vec4 v = uModelMatrix * vec4(u, 1.);
    vPosition_WaterDepth.stp = v.stp;
    vPosition_WaterDepth.q = aWaterPosition_Depth.q;
#if defined(CLIP_PLANE_CLAMP) && defined(CLIP_PLANE)
    v.t = -uClipPlane.q;
#endif
    gl_Position = uViewProjMatrix * v;
#if defined(CLIP_PLANE_CLAMP) && defined(CLIP_PLANE)
    return;
#endif

#if defined(CAUSTICS_COMPUTE) || defined(CAUSTICS_STENCIL)
    const float E = 256.;
    if (abs(vPosition_WaterDepth.t - uCausticsPlaneHeight) > E)
    {
        gl_Position.q = -1.;
        return;
    }
#endif
    vColour = aVertexColour;
#if defined(LIGHT_SCATTERING) || defined(FOG_DISTANCE) || defined(SUNLIGHT_SHADOWS) || defined(VOLUMETRIC_SCATTERING_SUPPORTED)
    vec3 t = v.stp - uCameraPosition;
    float d = length(t);
#endif

#if defined(SUNLIGHT_SHADOWS)
    vec3 f = vec3(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2]);
    vFlowControlMask_ViewSpaceDepth.q = abs(dot(t.stp, f));
#endif

#if defined(LIGHT_SCATTERING) || defined(FOG_DISTANCE)
    t /= d;
#if defined(LIGHT_SCATTERING) && defined(SUNLIGHT_DIRECT_LIGHTING)
    ComputeInOutScattering(t, d, uInvSunDirection, vOutScattering, vInScattering);
#else
    vOutScattering = vec3(1.);
    vInScattering = vec3(0.);
#endif

#if defined(FOG_DISTANCE)
    float q = FogBasedOnDistance(d);
    q = q + q * uWaterTickFade.t - uWaterTickFade.t;
    vInScattering = mix(vInScattering, uFogColour.stp, q);
    vOutScattering *= 1. - q;
    vColour.q = q;
#else
    vColour.q = 0.;
#endif

#endif

#if defined(VOLUMETRIC_SCATTERING_SUPPORTED)
    vec4 a = GetScatteredInRay2(8, t, d, 100.);
    vec3 T = vec3(1.), S = vec3(0.);
    GetInAndOutScattering(a, T, S);
    vInScattering += S;
    vOutScattering *= T;
#endif
    float g = uWaterNormalMapTextureScales_FlowNoiseScale.q;
    vec2 p = aWaterFlowDataFlowNoise0_FlowNoise1.st / 127. * g, e = aWaterFlowDataFlowNoise0_FlowNoise1.pq / 127. * g, s = aWaterFlowDataFlowNoise2_FlowIndex_Spare.st / 127. * g, G = -aWaterFlowDataPatchFlow0 * (1. / 4095.), r = -aWaterFlowDataPatchFlow1 * (1. / 4095.), C = -aWaterFlowDataPatchFlow2 * (1. / 4095.);
    int W = int(aWaterFlowDataFlowNoise2_FlowIndex_Spare.p);
    vFlowControlMask_ViewSpaceDepth.stp = vec3(W == 0 ? 1. : 0., W == 1 ? 1. : 0., W == 2 ? 1. : 0.);
    vNoisyPatchFlow0_NoisyPatchFlow1.st = G + p;
    vNoisyPatchFlow0_NoisyPatchFlow1.pq = r + e;
    vNoisyPatchFlow2_UVPack_NormalsFlow0Map0.st = C + s;
#if defined(WATER_NORMAL_MAPS) || defined(WATER_FOAM_MAP)

#if !defined(GLES2_COMPAT_MODE)
    vUVPack_FoamUV = v.sp * uWaterNormalMapTextureScales_FlowNoiseScale.s;
#endif
    vec2 o = v.sp * uWaterNormalMapTextureScales_FlowNoiseScale.s, P = v.sp * uWaterNormalMapTextureScales_FlowNoiseScale.t, D = v.sp * uWaterNormalMapTextureScales_FlowNoiseScale.p;
#if defined(WATER_NORMAL_MAPS)

#if !defined(GLES2_COMPAT_MODE)
    ComputeNormalMapDetailTexCoords(o, P, D, G, r, C, p, e, s);
    ComputeNormalMapMacroTexCoords(o, P, D);
#else
    ComputeNormalMapDetailTexCoords(o, G, r, C, p, e, s);
#endif

#endif

#endif

#if defined(WATER_EMISSIVE) && !defined(GLES2_COMPAT_MODE)
    ComputeEmissiveTexCoords(v, G, r, C);
#endif
}


/* MATCH 2 */

#version 460

/***************************************************/
/***************** GLSL Header *********************/
/***************************************************/
#ifdef GL_EXT_gpu_shader4
#extension GL_EXT_gpu_shader4 : enable
#endif
#ifdef GL_ARB_gpu_shader5
#extension GL_ARB_gpu_shader5 : enable
#endif
#ifdef GL_ARB_derivative_control
#extension GL_ARB_derivative_control : enable
#endif

#ifdef GL_ARB_texture_gather
#extension GL_ARB_texture_gather : enable
#endif

#define OGL_BACKEND

#undef attribute
#define attribute in

#undef gl_FragColor
#define gl_FragColor FragColor

#define shadow2DCompat texture

#undef textureCube
#define textureCube texture

#undef texture2D
#define texture2D texture

#undef texture3D
#define texture3D texture

#undef texture2DLod
#define texture2DLod textureLod

#undef textureCubeLod
#define textureCubeLod textureLod

#undef texture2DGrad
#define texture2DGrad textureGrad

#define MSAA_AVAILABLE

#define TEXTURE_OFFSET_AVAILABLE
#if !defined(lowp)
#define lowp
#endif
#if !defined(mediump)
#define mediump
#endif
#if !defined(highp)
#define highp
#endif

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define shadow2DLodCompat texture2DLod

#define texture2DLodCompat texture2DLod

#define textureCubeLodCompat textureCubeLod

#define textureGatherCompat(sampler, texCoord, viewportScale) textureGather(sampler, texCoord).wzxy

#define SHADER_TYPE_PIXEL

out vec4 gl_FragColor;

#define UNIFORM_BUFFER_BEGIN(name) \
    layout(std140) uniform name    \
    {
#define UNIFORM_BUFFER_END \
    }                      \
    ;

mat3 Mat4ToMat3(const mat4 inputMatrix)
{
    return mat3(inputMatrix);
}

#define isNaN isnan

#ifndef GL_ARB_derivative_control
#define dFdxFine dFdx
#define dFdyFine dFdy
#define fwidthFine fwidth
#endif

/***************************************************/

/***************************************************/
/***************** Effect Defines ******************/
/***************************************************/
#define AMBIENT_LIGHTING
#define DIFFUSE_LIGHTING
#define ALBEDO_LIGHTING
#define SUNLIGHT_DIRECT_LIGHTING
#define TEXTURE_ATLAS
#define TEXTURE_FORCED_FLAG

/*************************************************/

/***************************************************/
/********** Mandatory Shader Fragments *************/
/***************************************************/

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_X 3.0
#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_Y 4.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X 42.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_Y 32.0
#define MATERIAL_SETTINGS_TEXTURE_RESOLUTION 128.0
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif
#ifndef PACK_UTILS_INC
#define PACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

vec4 PackFloatToRGBA(highp float valueToPack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShift = vec4(256 * 256 * 256, 256 * 256, 256, 1.0);
    const highp vec4 bitMask = vec4(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
    highp vec4 fragColour = mod(valueToPack * bitShift * vec4(255), vec4(256)) / vec4(255);
    return fragColour - fragColour.xxyz * bitMask;
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
    const highp vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    highp vec4 fragColour = fract(valueToPack * bitShift);
    return fragColour - (fragColour.xxyz * bitMask);
#endif
}
vec2 NormalPackSphereMap(vec3 v)
{
    vec2 f = normalize(v.st) * sqrt(-v.p * .5 + .5);
    f = f * .5 + .5;
    return f * 65535.;
}
vec2 PackFloatToVec2(float v)
{
    vec2 f;
    const float b = 1. / 255.;
    vec2 h = vec2(1., 255.), r = fract(h * v);
    r.s -= r.t * b;
    return r.st;
}
#endif
#ifndef UNPACK_UTILS_INC
#define UNPACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

highp float UnpackRGBAToFloat(highp vec4 valueToUnpack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
    return dot(valueToUnpack, bitShifts);
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShifts = vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0);
    return dot(valueToUnpack, bitShifts);
#endif
}
vec3 ColourUnpack(highp float v)
{
    vec3 f;
    f.s = floor(v / 256. / 256.);
    f.t = floor((v - f.s * 256. * 256.) / 256.);
    f.p = floor(v - f.s * 256. * 256. - f.t * 256.);
    return f / 256.;
}
vec3 NormalUnpackSphereMap(vec2 v)
{
    vec4 f = vec4(v.s / 32767. - 1., v.t / 32767. - 1., 1., -1.);
    float U = dot(f.stp, -f.stq);
    f.st *= sqrt(U);
    f.p = U;
    return f.stp * 2. + vec3(0., 0., -1.);
}
highp float UnpackRGBAToIntegerFloat(highp vec4 f) { return floor(f.s * 255. + .5) * 256. * 256. * 256. + floor(f.t * 255. + .5) * 256. * 256. + floor(f.p * 255. + .5) * 256. + floor(f.q * 255. + .5); }
highp float UnpackRGBAToIntegerFloat16(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
highp int UnpackRGBAToInt(vec4 f) { return int(UnpackRGBAToIntegerFloat(f)); }
highp vec4 UnpackFloatToRGBA(highp float f)
{
    const highp vec4 v = vec4(1., 255., 65025., 1.65814e+07), s = vec4(vec3(1. / 255.), 0.);
    highp vec4 U = fract(f * v);
    U -= U.sstp * s;
    return U;
}
highp float UnpackVec2ToFloat(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
#endif
#if defined(MSAA) && defined(MSAA_AVAILABLE)
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2DMS
#define MSAA_SAMPLERS_ENABLED 1
#define texture2DMultisample(sampler, texCoord, texSize) texelFetch(sampler, ivec2((texCoord)*texSize), 0)
#else
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2D
#define MSAA_SAMPLERS_ENABLED 0
#define texture2DMultisample(sampler, texCoord, texSize) texture2DLodCompat(sampler, texCoord, 0.0)
#endif
UNIFORM_BUFFER_BEGIN(ViewportLookupScale)
uniform highp vec4 uViewportLookupScale;
uniform highp vec4 uViewportOffsetScale;
uniform highp vec4 uFullScreenLookupScale;
UNIFORM_BUFFER_END

/***************************************************/

UNIFORM_BUFFER_BEGIN(ViewTransforms)
uniform highp vec3 uCameraPosition;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;
uniform highp mat4 uViewProjMatrix;
uniform highp vec4 uZBufferParams;
UNIFORM_BUFFER_END

UNIFORM_BUFFER_BEGIN(Sunlight)
uniform highp vec3 uInvSunDirection;
uniform mediump vec3 uAmbientColour;
uniform mediump vec3 uSunColour;
uniform mediump float uDummy;
UNIFORM_BUFFER_END
#ifndef LIGHT_SCATTERING_VS_UNIFORMS
#define LIGHT_SCATTERING_VS_UNIFORMS
UNIFORM_BUFFER_BEGIN(SimpleScattering)
uniform mediump vec3 uOutscatteringAmount;
uniform mediump vec3 uInscatteringAmount;
uniform mediump vec3 uScatteringTintColour;
uniform highp vec4 uScatteringParameters;
UNIFORM_BUFFER_END
#endif
#ifndef BRDF_INC
#define BRDF_INC
#ifndef NDF_INC
#define NDF_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float BlinnPhongNDF(float f, float N)
{
    return (f + 2.) * INV_EIGHT * pow(N, f);
}
float GGXTrowbridgeReitzNDF(float N, float f)
{
    float P = N * N, I = f * f, T = I * (P - 1.) + 1.;
    return P / (PI * (T * T + .0001));
}
float BeckmannNDF(float N, float f)
{
    float P = N * N, I = f * f;
    return exp((I - 1.) / (P * I)) / (PI * P * (I * I));
}
#endif

#ifndef VISIBILITY_FUNC_INC
#define VISIBILITY_FUNC_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float SchlickSmithVis(float V, float f, float S)
{
    float P = 1. / sqrt(PI_OVER_4 * V + PI_OVER_2), d = 1. - P, v = (f * d + P) * (S * d + P);
    return 1. / (v + .0001);
}
float KelemenSzirmayKalosVis(vec3 V, vec3 P)
{
    vec3 f = V + P;
    return 4. / max(0., dot(f, f));
}
#endif

#define GGX_NDF
#define SCHLICK_SMITH_VIS
vec3 CookTorranceBRDF(float d, float S, vec3 n, vec3 v, vec3 f, vec3 B, vec3 R, float F)
{
    float m = max(0., dot(v, f)), r = 1.;
#if defined(BLINN_PHONG_NDF)
    r = BlinnPhongNDF(d, m);
#elif defined(GGX_NDF)
    r = GGXTrowbridgeReitzNDF(PerceptualRoughnessToRoughness(S), m);
#elif defined(BECKMANN_NDF)
    r = max(0.f, BeckmannNDF(SpecPowToBeckmannRoughness(d), m));
#else

#error CookTorranceBRDF normal distribution function not specified

#endif
    float C = 1.;
#if defined(SCHLICK_SMITH_VIS)
    C = SchlickSmithVis(d, F, max(0., dot(v, B)));
#elif defined(KELEMEN_SZIRMAY_KALOS_VIS)
    C = KelemenSzirmayKalosVis(R, B);
#endif
    return n * (r * C);
}
float RunescapeLegacyBRDF(vec3 d, vec3 v, vec3 f, float B, float S)
{
    vec3 n = reflect(-d, f);
    float C = pow(max(0., dot(n, v)), B);
    return C * S;
}
float RunescapeRT5BRDF(vec3 d, vec3 v, float S) { return BlinnPhongNDF(S, max(0., dot(d, v))); }
vec3 ShiftTangent(vec3 d, vec3 S, float B) { return normalize(d + B * S); }
vec3 AnisotropicBRDF(vec3 v, vec3 d, vec3 S, vec3 f, vec3 B, float n, float m, float R, float C)
{
    const float F = 7.5, r = 1., e = .5, o = 1.;
    float s = R - .5;
    S = ShiftTangent(S, d, e + (C * 2. - 1.) * o + s);
    float p = abs(dot(S, f)), a = 1. - p, t = 1. - abs(dot(S, B)), K = p * dot(d, B);
    K += a * t;
    K = pow(K, F) * n;
    K = mix(K, K * C, o);
    float G = pow(dot(d, v), m), P = mix(G, K, r);
    return vec3(P, P, P);
}
#endif
uniform highp float uGridSize;
uniform mediump vec4 uAtlasMeta;
uniform sampler2D uTextureAtlas;
uniform sampler2D uTextureAtlasSettings;
in highp vec4 vWorldPos_ViewSpaceDepth;
in vec4 vVertexAlbedo;
in vec3 vWorldNormal;
flat in highp vec4 vMaterialSettingsSlots1D;
flat in highp vec4 vTextureScale;
in vec4 vTextureWeight;
flat in vec4 vMaterialProperties;
#define SRGB_TEXTURES
#define STANDARD_DERIVATIVES
#define TEXTURE_LOD
#define TEXTURE_GRAD
#define TEXTURE_MIP_LIMIT
#define LOOKUP_MODE_REPEAT

#define TEXTURE_SETTINGS_USE_TEXEL_OFFSETS
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif

float getMipMapLevel(vec2 v, vec2 p)
{
    float d = 0.;
#if defined(STANDARD_DERIVATIVES)
    float L = max(dot(v, v), dot(p, p));
    d = .5 * log2(L);
    d = max(0., d);
#endif
    return d;
}
#if defined(DEBUG_TEXEL_DENSITY)
vec3 GetTexelDensityDebugColour(vec2 v, float p, vec3 d)
{
    float t = length(fwidth(v) * p), s = length(fwidth(d)), L = t / s, h = uDebugTexelDensity.s, f = uDebugTexelDensity.t, o = uDebugTexelDensity.p, T = uDebugTexelDensity.q;
    vec3 c;
    c.s = smoothstep(f / (T + 1.), h, L);
    c.t = 1. - smoothstep(0., f * (T + 1.), abs(L - f));
    c.p = smoothstep(1. - (f + o * T), 1. - o, 1. - L);
    c *= c;
    return c;
}
#endif
#if defined(LOOKUP_MODE_DYNAMIC) && !defined(NO_SAMPLER_WRAP)
flat in mediump float vSamplerWrap;
#endif
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

void getTexelBias_inner(float v, highp vec2 t, highp vec3 d, highp vec3 p, highp vec3 s, vec4 c, vec2 m, vec2 g, float L, sampler2D f, out vec4 i, out vec4 h, out vec4 o)
{
    float T = c.s;
    highp float q = c.t, l = c.p;
    float P = c.q;
    highp vec3 S = vec3(d.s, p.s, s.s), y = vec3(d.t, p.t, s.t), a = vec3(d.p, p.p, s.p);
    const vec2 u = vec2(1.);
    vec3 D = .5 / a;
    highp vec2 r, C, Y;
#if !defined(LOOKUP_MODE_CLAMP) && !defined(LOOKUP_MODE_REPEAT)
    const float G = .5, e = .25, n = .125, E = .0625;
    vec4 O = step(.5, fract(L * vec4(G, e, n, E)));
#endif

#if defined(LOOKUP_MODE_CLAMP)
    r = clamp(t, vec2(D.s), u - vec2(D.s));
#elif defined(LOOKUP_MODE_REPEAT)
    r = mod(t, u);
#else
    const vec2 N = vec2(.5), M = vec2(2.);
    vec2 x = clamp(t, vec2(D.s), u - vec2(D.s)), R = mod(t, u), A = t - M * floor(N * t), U = u - abs(u - A);
    r = O.st * x + O.pq * R + (u - O.st - O.pq) * U;
#endif
    r = r * a.s * l;
    r += vec2(S.s, y.s) * q * l;
    if (v > 1.)
    {
#if defined(LOOKUP_MODE_CLAMP)
        C = clamp(t, vec2(D.t), u - vec2(D.t));
#elif defined(LOOKUP_MODE_REPEAT)
        C = mod(t, u);
#else
        vec2 I = clamp(t, vec2(D.t), u - vec2(D.t)), K = R, B = U;
        C = O.st * I + O.pq * K + (u - O.st - O.pq) * B;
#endif
        C = C * a.t * l;
        C += vec2(S.t, y.t) * q * l;
        if (v > 2.)
        {
#if defined(LOOKUP_MODE_CLAMP)
            Y = clamp(t, vec2(D.p), u - vec2(D.p));
#elif defined(LOOKUP_MODE_REPEAT)
            Y = mod(t, u);
#else
            vec2 b = clamp(t, vec2(D.p), u - vec2(D.p)), X = R, V = U;
            Y = O.st * b + O.pq * X + (u - O.st - O.pq) * V;
#endif
            Y = Y * a.p * l;
            Y += vec2(S.p, y.p) * q * l;
        }
    }
    h = vec4(0.);
    o = vec4(0.);
#if defined(TEXTURE_MIP_LIMIT)

#if defined(TEXTURE_GRAD)
    highp vec2 I = m * l, K = g * l, B = I * a.s, X = K * a.s;
    const vec2 b = vec2(.025);
    B = clamp(B, -b, b);
    X = clamp(X, -b, b);
    i = texture2DGrad(f, r, B, X);
    if (v > 1.)
    {
        B = I * a.t;
        X = K * a.t;
        B = clamp(B, -b, b);
        X = clamp(X, -b, b);
        h = texture2DGrad(f, C, B, X);
        if (v > 2.)
            B = I * a.p, X = K * a.p, B = clamp(B, -b, b), X = clamp(X, -b, b), o = texture2DGrad(f, Y, B, X);
    }
#else
    i = texture2D(f, r);
    if (v > 1.)
    {
        h = texture2D(f, C);
        if (v > 2.)
            o = texture2D(f, Y);
    }
#endif

#else

#if defined(TEXTURE_LOD)
    vec2 V = m * a.s, W = g * a.s;
    float F = getMipMapLevel(V, W);
    F = min(F, P);
    i = texture2DLod(f, r, F);
    if (v > 1.)
    {
        V = m * a.t;
        W = g * a.t;
        F = getMipMapLevel(V, W);
        F = min(F, P);
        h = texture2DLod(f, C, F);
        if (v > 2.)
            V = m * a.p, W = g * a.p, F = getMipMapLevel(V, W), F = min(F, P), o = texture2DLod(f, Y, F);
    }
#else
    i = texture2D(f, r);
    if (v > 1.)
    {
        h = texture2D(f, C);
        if (v > 2.)
            o = texture2D(f, Y);
    }
#endif

#endif
}
void getTexel_inner(float v, vec2 f, highp vec3 d, highp vec3 t, highp vec3 p, vec4 s, vec2 h, vec2 o, float b, sampler2D B, out vec4 D, out vec4 L, out vec4 u)
{
    getTexelBias_inner(v, f, d, t, p, s, h, o, b, B, D, L, u);
#if defined(SRGB_TEXTURES)
    if (v > 1.)
        L = vec4(LinearToSRGB(L.stp), L.q);
    if (v > 2.)
        u = vec4(LinearToSRGB(u.stp), u.q);
#else
    D = vec4(SRGBToLinear(D.stp), D.q);
#endif
}
void getTexel_inner(float v, vec2 f, highp vec3 d, highp vec3 t, highp vec3 p, vec4 s, float h, sampler2D o, out vec4 b, out vec4 B, out vec4 u)
{
    vec2 X = vec2(0.), i = vec2(0.);
#if defined(STANDARD_DERIVATIVES)
    X = dFdx(f);
    i = dFdy(f);
#endif
    getTexel_inner(v, f, d, t, p, s, X, i, h, o, b, B, u);
}
void getTexel(vec2 v, highp vec3 o, vec4 h, vec2 g, vec2 s, float f, sampler2D e, out vec4 c)
{
    vec3 t = vec3(1.), l = vec3(1.);
    vec4 i = vec4(0.), p = vec4(0.);
    getTexel_inner(1., v, o, t, l, h, g, s, f, e, c, i, p);
}
void getTexel(vec2 v, highp vec3 o, vec4 h, float g, sampler2D s, out vec4 f)
{
    vec3 e = vec3(1.), l = vec3(1.);
    vec4 t = vec4(0.), p = vec4(0.);
    getTexel_inner(1., v, o, e, l, h, g, s, f, t, p);
}
void getTexel(vec2 v, highp vec3 o, highp vec3 h, vec4 g, vec2 s, vec2 f, float e, sampler2D t, out vec4 l, out vec4 p)
{
    vec3 i = vec3(1.);
    vec4 c = vec4(0.);
    getTexel_inner(2., v, o, h, i, g, s, f, e, t, l, p, c);
}
void getTexel(vec2 v, highp vec3 o, highp vec3 h, vec4 g, float s, sampler2D f, out vec4 e, out vec4 t)
{
    vec3 l = vec3(1.);
    vec4 p = vec4(0.);
    getTexel_inner(2., v, o, h, l, g, s, f, e, t, p);
}
void getTexel(vec2 v, highp vec3 o, highp vec3 h, highp vec3 g, vec4 s, vec2 f, vec2 e, float t, sampler2D l, out vec4 p, out vec4 i, out vec4 c) { getTexel_inner(3., v, o, h, g, s, f, e, t, l, p, i, c); }
void getTexel(vec2 v, highp vec3 o, highp vec3 h, highp vec3 g, vec4 s, float f, sampler2D e, out vec4 t, out vec4 l, out vec4 p) { getTexel_inner(3., v, o, h, g, s, f, e, t, l, p); }

#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#ifndef TEXTURE_SETTINGS_INC
#define TEXTURE_SETTINGS_INC
struct TextureSettings
{
    highp vec3 textureMeta1;
    highp vec3 textureMeta2;
    highp vec2 uvAnim;
    float wrapping;
    float specular;
    float normalScale;
#if defined(REFRACTION)
    vec4 refraction;
#endif
#if defined(VIEWPORTMAP)
    vec4 viewportMapUVScaleAndAnim;
#endif
#if defined(DEBUG_MATERIAL_HIGHLIGHT)
    highp float materialID;
#endif
};
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

void getTextureSettings(vec2 s, out TextureSettings v)
{
    const highp float d = 1. / 255., S = 1. / 65535., e = 32767., t = 1. / 32767.;
    const float f = 1. / MATERIAL_SETTINGS_TEXTURE_RESOLUTION;
    vec2 i = (floor(s + .5) * vec2(MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_X, MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_Y) + .5) * f;
    const float u = f;
    vec4 T = texture2DLodCompat(uTextureAtlasSettings, i, 0.), U, n, D, m, a, R;
    float h;
    vec4 r;
#if defined(TEXTURE_SETTINGS_USE_TEXEL_OFFSETS)

#define SAMPLE_OFFSET_SLOTSIZES_AND_WRAPPING ivec2(2, 0)

#define SAMPLE_OFFSET_UV_ANIM ivec2(0, 1)

#define SAMPLE_OFFSET_SPECULAR_NORMAL_SCALE ivec2(1, 1)

#define SAMPLE_OFFSET_REFRACTION ivec2(0, 2)

#define SAMPLE_OFFSET_SLOTETC ivec2(1, 2)

#define SAMPLE_OFFSET_VIEWPORTMAP_UVSCALE ivec2(2, 2)

#define SAMPLE_OFFSET_VIEWPORTMAP_UVANIMATION ivec2(0, 3)

#define SAMPLE_OFFSET_DEBUG ivec2(2, 3)
    U = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_SLOTSIZES_AND_WRAPPING);
    n = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_UV_ANIM);
#if defined(SPECULAR_LIGHTING) || defined(USE_NORMAL_MAP)
    D = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_SPECULAR_NORMAL_SCALE);
#endif

#if defined(REFRACTION)
    m = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_REFRACTION);
#endif
    h = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_SLOTETC).q;
#if defined(VIEWPORTMAP)
    a = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_VIEWPORTMAP_UVSCALE);
    R = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_VIEWPORTMAP_UVANIMATION);
#endif

#if defined(DEBUG_MATERIAL_HIGHLIGHT)
    r = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_DEBUG);
#endif

#else
    vec2 g = vec2(u * 2., 0.), o = vec2(0., u), M = vec2(u, u), p = vec2(0., u * 2.), X = vec2(u, u * 2.), q = vec2(u * 2., u * 2.), E = vec2(0., u * 3.), A = vec2(u * 2., u * 3.);
    U = texture2DLodCompat(uTextureAtlasSettings, i + g, 0.);
    n = texture2DLodCompat(uTextureAtlasSettings, i + o, 0.);
#if defined(SPECULAR_LIGHTING) || defined(USE_NORMAL_MAP)
    D = texture2DLodCompat(uTextureAtlasSettings, i + M, 0.);
#endif

#if defined(REFRACTION)
    m = texture2DLodCompat(uTextureAtlasSettings, i + p, 0.);
#endif
    h = texture2DLodCompat(uTextureAtlasSettings, i + X, 0.).q;
#if defined(VIEWPORTMAP)
    a = texture2DLodCompat(uTextureAtlasSettings, i + q, 0.);
    R = texture2DLodCompat(uTextureAtlasSettings, i + E, 0.);
#endif

#if defined(DEBUG_MATERIAL_HIGHLIGHT)
    r = texture2DLodCompat(uTextureAtlasSettings, i + A, 0.);
#endif

#endif
    T = floor(T * 255. + .5);
    U = floor(U * 255. + .5);
    h = floor(h * 255. + .5);
    const float V = .5, c = .25, L = .125, P = .0625;
    vec4 N = step(.5, fract(h * vec4(V, c, L, P)));
    T += vec4(256.) * N;
    vec2 w = U.st * uAtlasMeta.t;
    v.textureMeta1 = vec3(T.st, w.s);
    v.textureMeta2 = vec3(T.pq, w.t);
    v.wrapping = U.q;
#if defined(SPECULAR_LIGHTING) || defined(USE_NORMAL_MAP)
    v.specular = UnpackVec2ToFloat(D.st) * d;
    v.normalScale = UnpackVec2ToFloat(D.pq) * d;
    v.normalScale = v.normalScale * .1 - 8.;
#else
    v.specular = 0.;
    v.normalScale = 0.;
#endif
    highp vec2 G = vec2(UnpackVec2ToFloat(n.st), UnpackVec2ToFloat(n.pq)) - e;
    G *= step(1.5, abs(G));
    v.uvAnim = G * t * 2.;
#if defined(REFRACTION)
    v.refraction = m;
    v.refraction.t = v.refraction.t * 2. + 1.;
    v.refraction.p = UnpackVec2ToFloat(v.refraction.pq) * S * 10.;
#endif

#if defined(VIEWPORTMAP)
    highp vec2 C = vec2(UnpackVec2ToFloat(a.st), UnpackVec2ToFloat(a.pq)) - e, Y = vec2(UnpackVec2ToFloat(R.st), UnpackVec2ToFloat(R.pq)) - e;
    C *= step(1.5, abs(C));
    Y *= step(1.5, abs(Y));
    v.viewportMapUVScaleAndAnim = vec4(C * t * 2., Y * t * 2.);
#endif

#if defined(DEBUG_MATERIAL_HIGHLIGHT)
    v.materialID = UnpackVec2ToFloat(r.st);
#endif
}
void getTextureSettings1D(float v, out TextureSettings i)
{
    const float d = 1. / MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X;
    float S = floor((v + .5) * d), u = v - S * MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X;
    getTextureSettings(vec2(u, S), i);
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#endif
#ifndef DISTANCE_FOG_UNIFORMS
#define DISTANCE_FOG_UNIFORMS
#if defined(FOG_DISTANCE)
UNIFORM_BUFFER_BEGIN(DistanceFog)
uniform mediump vec4 uFogColour;
uniform highp vec4 uFogParams;
UNIFORM_BUFFER_END
#endif
#endif

#ifndef DISTANCE_FOG_FUNCTIONS
#define DISTANCE_FOG_FUNCTIONS
#if defined(FOG_DISTANCE)
float FogBasedOnDistance(highp float f)
{
    highp float F = (uFogParams.t - f) * uFogParams.s;
    return 1. - clamp(F, 0., 1.);
}
float FogBasedOnAngle(highp vec3 f)
{
    highp float F = 1. - clamp(f.t + uFogParams.q, 0., 1.);
    F = pow(F, uFogParams.p);
    return clamp(F, 0., 1.);
}
#endif
#endif

#if defined(TEXTURE_ATLAS)
void ComputeTangentBitangentFromDerivatives(inout vec3 v, inout vec3 p, highp vec3 h, highp vec3 d, highp vec3 A, highp vec2 r, highp vec2 S)
{
    highp vec3 q = cross(h, d), c = cross(A, h), n = c * r.s + q * S.s, s = c * r.t + q * S.t;
    highp float D = dot(n, n), a = dot(s, s), i = max(D, a), t = inversesqrt(i);
    n *= t;
    s *= t;
    if (isNaN(D + a) || i <= 0.)
        n = s = h;
    v = n;
    p = s;
}
vec3 ComputeBitangent(vec3 v, vec4 h)
{
    highp vec3 p = cross(v, h.stp);
    p *= h.q;
    return p;
}
vec3 ApplyNormalMap(highp vec3 v, highp vec3 h, highp vec3 d, highp vec3 A, highp vec2 p, highp vec2 S)
{
    highp vec3 D, s;
    ComputeTangentBitangentFromDerivatives(D, s, h, d, A, p, S);
#if defined(DEBUG_TANGENTS)
    gl_FragColor.stp = normalize(D) * .5 + .5;
    gl_FragColor.q = 1.;
#endif

#if defined(DEBUG_BITANGENTS)
    gl_FragColor.stp = normalize(s) * .5 + .5;
    gl_FragColor.q = 1.;
#endif
    highp vec3 r = v.s * D + v.t * s + v.p * h;
    r = normalize(r);
    return abs(r.s) + abs(r.t) + abs(r.p) < .5 ? h : r;
}
vec3 ApplyNormalMap(vec3 v, vec3 A, vec3 s, vec3 S)
{
#if defined(DEBUG_TANGENTS)
    gl_FragColor.stp = s * .5 + .5;
    gl_FragColor.q = 1.;
#endif

#if defined(DEBUG_BITANGENTS)
    gl_FragColor.stp = S * .5 + .5;
    gl_FragColor.q = 1.;
#endif
    highp vec3 p = v.s * s + v.t * S + v.p * A;
    p = normalize(p);
    return p;
}
vec3 ApplyNormalMap(vec3 v, vec3 h, vec4 r)
{
    vec3 p = ComputeBitangent(h, r);
    return ApplyNormalMap(v, h, r.stp, p);
}
vec3 ApplyNormalMapTerrain(vec3 v, highp vec3 h, highp vec3 r, highp vec3 S)
{
    highp vec3 p = cross(h, r), s = cross(S, h), D = s * r.s + p * S.s, n = s * r.p + p * S.p;
    highp float A = inversesqrt(max(dot(D, D), dot(n, n)));
    D *= A;
    n *= A;
#if defined(DEBUG_TANGENTS)
    gl_FragColor.stp = normalize(D) * .5 + .5;
    gl_FragColor.q = 1.;
#endif

#if defined(DEBUG_BITANGENTS)
    gl_FragColor.stp = normalize(n) * .5 + .5;
    gl_FragColor.q = 1.;
#endif
    highp vec3 d = v.s * D + v.t * n + v.p * h;
    d = normalize(d);
    return isNaN(d.s) ? h : d;
}
vec3 ApplyNormalMapTerrain(vec3 v, vec3 h)
{
    const vec3 p = vec3(0., 0., 1.);
    vec3 D = cross(p, h), s = cross(D, h);
    return ApplyNormalMap(v, h, D, s);
}

vec3 UnpackCompressedNormal(vec3 U)
{
    vec3 v = vec3(U.ps * 255. / 127. - 1.00787, 0.);
    v.p = sqrt(1. - min(1., dot(v.st, v.st)));
    v.t = -v.t;
    return v;
}
vec3 UnpackNormal(vec3 v, float U)
{
    vec3 t;
#if defined(COMPRESSED_NORMALS)
    t = UnpackCompressedNormal(v);
#else
    t = v.pst * 255. / 127. - 1.00787;
    t.t = -t.t;
#endif
    t.st *= U;
    return t;
}
vec3 UnpackNormal(vec3 U) { return UnpackNormal(U, 1.); }
vec3 UnpackNormal(vec4 v) { return UnpackNormal(v.tpq, 1.); }
vec3 UnpackNormal(vec4 v, float U) { return UnpackNormal(v.tpq, U); }

#if defined(VIEWPORTMAP)
vec3 SampleViewportMapColour(highp vec2 v, highp vec4 e)
{
    v = v * uViewportLookupScale.st;
    vec2 t;
#if defined(OGLES2_BACKEND)
    t = uViewportMapTextureSize.st;
#else
    t = vec2(textureSize(uViewportMap, 0));
#endif
    v.s *= uViewportLookupScale.p * uViewportLookupScale.t / (t.s / t.t);
    v *= e.st;
    highp float u = uTextureAnimationTime;
    v += e.pq * u;
    return texture2DLodCompat(uViewportMap, v, 0.).stp;
}
#endif

#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

#if defined(TEXTURE_ATLAS)
void SampleTerrainTextures(out vec4 t, out vec2 d, out float p, inout vec3 s, highp vec3 v, highp vec3 u, vec4 a, vec4 r, inout float g)
{
    TextureSettings S;
    getTextureSettings1D(vMaterialSettingsSlots1D[0], S);
    TextureSettings m;
    getTextureSettings1D(vMaterialSettingsSlots1D[1], m);
    TextureSettings e;
    getTextureSettings1D(vMaterialSettingsSlots1D[2], e);
    highp vec3 D = vTextureScale.stp, i = 8. / (D * uGridSize);
    highp vec2 T = v.sp * i[0], h = v.sp * i[1], o = v.sp * i[2];
#if defined(DEBUG_TEXEL_DENSITY)
    gl_FragColor = vec4(0., 0., 0., 1.);
    gl_FragColor.stp += GetTexelDensityDebugColour(T, S.textureMeta1.p, u) * vTextureWeight.s;
    gl_FragColor.stp += GetTexelDensityDebugColour(h, m.textureMeta1.p, u) * vTextureWeight.t;
    gl_FragColor.stp += GetTexelDensityDebugColour(o, e.textureMeta1.p, u) * vTextureWeight.p;
#endif
    T = mod(T, 1.);
    h = mod(h, 1.);
    o = mod(o, 1.);
    highp vec3 f = vec3(0.), G = vec3(0.);
#if defined(STANDARD_DERIVATIVES) && (defined(TEXTURE_LOD) || defined(NORMAL_MAP))
    f = dFdx(u);
    G = dFdy(u);
#endif
    vec2 q = f.sp * i[0], l = G.sp * i[0], n = f.sp * i[1], c = G.sp * i[1], x = f.sp * i[2], M = G.sp * i[2];
    vec3 P = mod(r.stp, vec3(16.)) - vec3(.25),
         A = (r.stp - vec3(.25) - P) / vec3(255.);
    P *= vec3(1. / 15.);
    vec4 E = vec4(vec3(.580392), a.q),
         H = mix(a, E, A.s) * (1. + P.s),
         N = mix(a, E, A.t) * (1. + P.t),
         U = mix(a, E, A.p) * (1. + P.p);
#if defined(GAMMA_CORRECT_INPUTS)
    H.stp = SRGBToLinear(H.stp);
    N.stp = SRGBToLinear(N.stp);
    U.stp = SRGBToLinear(U.stp);
#endif
    vec4 C, V, Y;
#if defined(HDR_SCALE) || defined(NORMAL_MAP)
    vec4 R, W, L;
#if defined(COMPRESSED_NORMALS)
    R = vec4(0., .5, 0., .5);
    W = vec4(0., .5, 0., .5);
    L = vec4(0., .5, 0., .5);
#else
    R = vec4(0., .5, 1., .5);
    W = vec4(0., .5, 1., .5);
    L = vec4(0., .5, 1., .5);
#endif
    getTexel(T, S.textureMeta1, S.textureMeta2, uAtlasMeta, q, l, 0., uTextureAtlas, C, R);
    getTexel(h, m.textureMeta1, m.textureMeta2, uAtlasMeta, n, c, 0., uTextureAtlas, V, W);
    getTexel(o, e.textureMeta1, e.textureMeta2, uAtlasMeta, x, M, 0., uTextureAtlas, Y, L);
#if defined(ETC_CHANNEL_SWIZZLE)
    R = R.qtps;
    W = W.qtps;
    L = L.qtps;
#endif

#if defined(HDR_SCALE)
    C = HDRScale(C, R.s);
    V = HDRScale(V, W.s);
    Y = HDRScale(Y, L.s);
#endif

#if defined(NORMAL_MAP)
    vec3 I = UnpackNormal(R, S.normalScale), F = UnpackNormal(W, m.normalScale), O = UnpackNormal(L, e.normalScale), w = I * vTextureWeight.s + F * vTextureWeight.t + O * vTextureWeight.p;
#if defined(PER_FRAGMENT_TANGENTS)
    s = ApplyNormalMapTerrain(w, s, f, G);
#else
    s = ApplyNormalMapTerrain(w, s);
#endif

#endif

#else
    getTexel(T, S.textureMeta1, uAtlasMeta, q, l, 0., uTextureAtlas, C);
    getTexel(h, m.textureMeta1, uAtlasMeta, n, c, 0., uTextureAtlas, V);
    getTexel(o, e.textureMeta1, uAtlasMeta, x, M, 0., uTextureAtlas, Y);
#endif
    C *= H;
    V *= N;
    Y *= U;
#if defined(VIEWPORTMAP)
    float y = step(.001, S.viewportMapUVScaleAndAnim.s), b = step(.001, m.viewportMapUVScaleAndAnim.s), B = step(.001, e.viewportMapUVScaleAndAnim.s);
    C.stp = mix(C.stp, SampleViewportMapColour(gl_FragCoord.st, S.viewportMapUVScaleAndAnim), y);
    V.stp = mix(V.stp, SampleViewportMapColour(gl_FragCoord.st, m.viewportMapUVScaleAndAnim), b);
    Y.stp = mix(Y.stp, SampleViewportMapColour(gl_FragCoord.st, e.viewportMapUVScaleAndAnim), B);
    g = mix(g, 1., y * vTextureWeight.s + b * vTextureWeight.t + B * vTextureWeight.p);
#endif

#if defined(TEXTURE_FORCED_FLAG)
    C = mix(H, sqrt(C), A.s);
    V = mix(N, sqrt(V), A.t);
    Y = mix(U, sqrt(Y), A.p);
#endif
    t = C * vTextureWeight.s + V * vTextureWeight.t + Y * vTextureWeight.p;
    t.q = 1.;
    vec3 X = step(vec3(.5), fract(r.q * vec3(.25, .125, .0625))), k = vec3(C.q, V.q, Y.q) * vTextureWeight.stp, Z = k * X;
    d.s = Z.s + Z.t + Z.p;
    d.t = max(S.specular, max(m.specular, e.specular));
#if defined(DEBUG_MATERIAL_HIGHLIGHT)
    p = (S.materialID == uDebugMaterialHighlight ? 1 : 0) * vTextureWeight.s + (m.materialID == uDebugMaterialHighlight ? 1 : 0) * vTextureWeight.t + (e.materialID == uDebugMaterialHighlight ? 1 : 0) * vTextureWeight.p;
#else
    p = 0.;
#endif
}
#endif
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#endif
const highp float CAUSTICS_FIXED_POINT_SCALE = 10000.;
#if defined(CAUSTICS) && !defined(CAUSTICS_COMPUTE) && !defined(CAUSTICS_STENCIL)
float CalculateCausticsTerm(highp vec3 u, float t, vec3 e)
{
    float i = 0., s = 0.;
    if (u.t <= uCausticsPlaneHeight)
        s = step(1., t);
    else
    {
#if defined(CAUSTICS_OVERWATER)
        s = clamp(e.t * -1., 0., 1.);
        float d = smoothstep(uCausticsOverWaterFade.s, uCausticsOverWaterFade.t, u.t - uCausticsPlaneHeight);
        s *= 1. - d;
#else
        return 0.0;
#endif
    }
    if (s > 0.)
    {
        highp vec4 C = uCausticsViewProjMatrix * vec4(u, 1.);
        C.st /= 2. * C.q;
        vec2 f = abs(C.st);
        C.st += .5;
        f = smoothstep(.4, .5, f);
        s *= max(0., 1. - (f.s + f.t));
        if (s > 0.)
            i += textureOffset(uCausticsMap, C.st, ivec2(-1, -1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(-1, 0)).s, i += textureOffset(uCausticsMap, C.st, ivec2(-1, 1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(0, -1)).s, i += texture2D(uCausticsMap, C.st).s * 5., i += textureOffset(uCausticsMap, C.st, ivec2(0, 1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(1, -1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(1, 0)).s, i += textureOffset(uCausticsMap, C.st, ivec2(1, 1)).s, i *= s / 12.;
    }
    return i;
}
#endif
#if defined(CAUSTICS_COMPUTE)
void WriteCausticsRay(vec3 t, float i)
{
    vec2 s = t.sp * i * uCausticsRefractionScale, C = (gl_FragCoord.st + s * 2.) / uCausticsComputeResolution * uCausticsMapSize;
    highp float u = min(uCausticsFade.s / i * uCausticsFade.t, 7. * uCausticsFade.t), f = smoothstep(uCausticsFade.p, uCausticsFade.q, i), E = f * u * CAUSTICS_FIXED_POINT_SCALE;
    if (E >= 1.f)
        imageAtomicAdd(uCausticsIntegerMap, ivec2(C.st), uint(E));
}
#endif

#ifndef LIGHTING_UTILS_H
#define LIGHTING_UTILS_H
#ifndef LIGHTING_INC
#define LIGHTING_INC
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

#ifndef FRESNEL_INC
#define FRESNEL_INC
vec3 FresnelSchlick(vec3 F, float f, highp float h)
{
    vec3 c = F + (1. - F) * pow(1. - f, h);
    return c;
}
vec3 FresnelSchlickRoughness(vec3 f, float F, highp float h, float v)
{
    vec3 c = f + (max(vec3(v), f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(float F, float f, highp float h)
{
    float c = F + (1. - F) * pow(1. - f, h);
    return c;
}
float FresnelSchlickRoughness(float f, float F, highp float h, float v)
{
    float c = f + (max(v, f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(vec3 F, vec3 f, float c)
{
    float h = max(0., dot(F, f));
    return c + (1. - c) * pow(1. - h, 5.);
}
float Fresnel(vec3 F, vec3 f, float c, float h)
{
    float p = 1. - max(0., dot(F, f)), v = p * p;
    v = v * v;
    v = v * p;
    return clamp(v * (1. - clamp(h, 0., 1.)) + h - c, 0., 1.);
}
#endif

#ifndef BRDF_INC
#define BRDF_INC
#ifndef NDF_INC
#define NDF_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float BlinnPhongNDF(float f, float N)
{
    return (f + 2.) * INV_EIGHT * pow(N, f);
}
float GGXTrowbridgeReitzNDF(float N, float f)
{
    float P = N * N, I = f * f, T = I * (P - 1.) + 1.;
    return P / (PI * (T * T + .0001));
}
float BeckmannNDF(float N, float f)
{
    float P = N * N, I = f * f;
    return exp((I - 1.) / (P * I)) / (PI * P * (I * I));
}
#endif

#ifndef VISIBILITY_FUNC_INC
#define VISIBILITY_FUNC_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float SchlickSmithVis(float V, float f, float S)
{
    float P = 1. / sqrt(PI_OVER_4 * V + PI_OVER_2), d = 1. - P, v = (f * d + P) * (S * d + P);
    return 1. / (v + .0001);
}
float KelemenSzirmayKalosVis(vec3 V, vec3 P)
{
    vec3 f = V + P;
    return 4. / max(0., dot(f, f));
}
#endif

#define GGX_NDF
#define SCHLICK_SMITH_VIS
vec3 CookTorranceBRDF(float d, float S, vec3 n, vec3 v, vec3 f, vec3 B, vec3 R, float F)
{
    float m = max(0., dot(v, f)), r = 1.;
#if defined(BLINN_PHONG_NDF)
    r = BlinnPhongNDF(d, m);
#elif defined(GGX_NDF)
    r = GGXTrowbridgeReitzNDF(PerceptualRoughnessToRoughness(S), m);
#elif defined(BECKMANN_NDF)
    r = max(0.f, BeckmannNDF(SpecPowToBeckmannRoughness(d), m));
#else

#error CookTorranceBRDF normal distribution function not specified

#endif
    float C = 1.;
#if defined(SCHLICK_SMITH_VIS)
    C = SchlickSmithVis(d, F, max(0., dot(v, B)));
#elif defined(KELEMEN_SZIRMAY_KALOS_VIS)
    C = KelemenSzirmayKalosVis(R, B);
#endif
    return n * (r * C);
}
float RunescapeLegacyBRDF(vec3 d, vec3 v, vec3 f, float B, float S)
{
    vec3 n = reflect(-d, f);
    float C = pow(max(0., dot(n, v)), B);
    return C * S;
}
float RunescapeRT5BRDF(vec3 d, vec3 v, float S) { return BlinnPhongNDF(S, max(0., dot(d, v))); }
vec3 ShiftTangent(vec3 d, vec3 S, float B) { return normalize(d + B * S); }
vec3 AnisotropicBRDF(vec3 v, vec3 d, vec3 S, vec3 f, vec3 B, float n, float m, float R, float C)
{
    const float F = 7.5, r = 1., e = .5, o = 1.;
    float s = R - .5;
    S = ShiftTangent(S, d, e + (C * 2. - 1.) * o + s);
    float p = abs(dot(S, f)), a = 1. - p, t = 1. - abs(dot(S, B)), K = p * dot(d, B);
    K += a * t;
    K = pow(K, F) * n;
    K = mix(K, K * C, o);
    float G = pow(dot(d, v), m), P = mix(G, K, r);
    return vec3(P, P, P);
}
#endif

struct LightingTerms
{
    vec3 Diffuse;
    vec3 Specular;
};
void ClearLightingTerms(inout LightingTerms v) { v.Diffuse = vec3(0., 0., 0.), v.Specular = vec3(0., 0., 0.); }
void AddLightingTerms(inout LightingTerms v, LightingTerms L) { v.Diffuse += L.Diffuse, v.Specular += L.Specular; }
void EvaluateDirLightRT5(inout LightingTerms v, vec3 f, vec3 L, vec3 d, vec3 i, float S, float c, float F, float e, float E, vec3 A)
{
    v.Diffuse += A * e;
#if defined(SPECULAR_LIGHTING)
    vec3 G = normalize(d + i);
    float r = FresnelSchlick(S, clamp(dot(i, G), 0., 1.), F);
#if defined(ANISOTROPY_BRDF)
    vec3 D = AnisotropicBRDF(G, f, L, i, d, E, c, .5, .5);
#else
    vec3 n = vec3(r) * vec3(RunescapeRT5BRDF(G, f, c));
#endif
    n *= A * e;
    v.Specular += n;
#endif
}
void EvaluateDirLightRT7(inout LightingTerms v, vec3 f, vec3 L, vec3 d, vec3 i, vec3 S, float c, float E, float G, float e, float F, vec3 A)
{
    v.Diffuse += A * e;
#if defined(SPECULAR_LIGHTING)
    vec3 r = normalize(d + i), n = FresnelSchlick(S, clamp(dot(i, r), 0., 1.), G);
#if defined(ANISOTROPY_BRDF)
    vec3 D = AnisotropicBRDF(r, f, L, i, d, F, c, .5, .5);
#else
    vec3 C = CookTorranceBRDF(c, E, n, f, r, d, i, F);
#endif
    C *= A * e;
    v.Specular += C;
#endif
}
float SpecularHorizonOcclusion(float L, vec3 i, vec3 v)
{
    vec3 d = reflect(i, v);
    float A = clamp(1. + L * dot(d, v), 0., 1.);
    A *= A;
    return A;
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#endif

#if !defined(DEFERRED_SHADOWS)
LightingTerms EvaluateSunlightRT5(inout int i, inout float E, highp vec4 v, vec3 u, vec3 f, float d, vec3 n, float p, float S, float r)
{
    float t = max(0., dot(u, uInvSunDirection)), L = t;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS)
    if (S == 0. && uMappingParams.p != 0.)
    {
        if (L > 0.)
        {
            highp vec4 h = uSunlightViewMatrix * v, e = vec4(u.st, 0., 0.) * 32.;
            E = DirLightShadowAtten(i, v + e, h + e, d, uSunlightShadowMap, uSunlightShadowTranslucencyMap, r);
        }
    }
#endif
    L *= E;
    float h = .65;
    LightingTerms D;
    ClearLightingTerms(D);
    EvaluateDirLightRT5(D, u, f, n, uInvSunDirection, h, p, 5., L, t, uSunColour);
    return D;
}
#else
LightingTerms EvaluateSunlightRT5(inout float E, vec3 u, vec3 v, vec3 f, vec2 d, float n, float S)
{
    float t = max(0., dot(u, uInvSunDirection)), L = t;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS) && defined(DEFERRED_SHADOWS)
    if (S == 0. && uMappingParams.p != 0.)
        E = texture2DLod(uShadowBuffer, d, 0.).s;
#endif
    L *= E;
    float h = .65;
    LightingTerms D;
    ClearLightingTerms(D);
    EvaluateDirLightRT5(D, u, v, f, uInvSunDirection, h, n, 5., L, uSunColour);
    return D;
}
#endif
#if !defined(DEFERRED_SHADOWS)
LightingTerms EvaluateSunlightRT7(inout int u, inout float E, highp vec4 v, vec3 f, vec3 d, float n, vec3 h, vec3 L, float p, float i, float t, float S)
{
    float D = max(0., dot(f, uInvSunDirection)), e = D;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS)
    if (uMappingParams.p != 0.)
    {
        if (D > 0.)
        {
            highp vec4 r = uSunlightViewMatrix * v, a = vec4(f.st, 0., 0.) * 32.;
            E = DirLightShadowAtten(u, v + a, r + a, n, uSunlightShadowMap, uSunlightShadowTranslucencyMap, S);
        }
    }
#endif
    e *= E;
    LightingTerms r;
    ClearLightingTerms(r);
    EvaluateDirLightRT7(r, f, d, h, uInvSunDirection, L, p, i, t, e, D, uSunColour);
    return r;
}
#else
LightingTerms EvaluateSunlightRT7(inout float E, vec3 u, vec3 v, vec3 f, vec2 d, vec3 n, float h, float L, float r)
{
    float t = max(0., dot(u, uInvSunDirection)), p = t;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS) && defined(DEFERRED_SHADOWS)
    if (uMappingParams.p != 0.)
        E = texture2DLod(uShadowBuffer, d, 0.).s;
#endif
    LightingTerms D;
    ClearLightingTerms(D);
    EvaluateDirLightRT7(D, u, v, f, uInvSunDirection, n, h, L, r, t, p, uSunColour);
    return D;
}
#endif
#endif

#ifndef STIPPLE_TRANSPARENCY_UTILS_INC
#define STIPPLE_TRANSPARENCY_UTILS_INC
#if defined(STIPPLE_TRANSPARENCY_CLIP_NEAR) || defined(STIPPLE_TRANSPARENCY_CLIP_FAR) || defined(STIPPLE_TRANSPARENCY_ALPHA)
#ifndef STIPPLE_COMMON_INC
#define STIPPLE_COMMON_INC
highp float GetStippleViewSpaceDepthFromPos(vec3 S)
{
    vec3 u = vec3(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2]);
    return dot(S, u);
}
#endif

#ifndef NOISE_UTILS_INC
#define NOISE_UTILS_INC
vec4 permute(vec4 t)
{
    return mod((t * 34. + 1.) * t, 289.);
}
vec2 fade(vec2 t) { return t * t * t * (t * (t * 6. - 15.) + 10.); }
float cnoise(highp vec2 t)
{
    highp vec4 v = floor(t.stst) + vec4(0., 0., 1., 1.), d = fract(t.stst) - vec4(0., 0., 1., 1.);
    v = mod(v, 289.);
    vec4 p = v.spsp, s = v.ttqq, h = d.spsp, e = d.ttqq, f = permute(permute(p) + s), m = 2. * fract(f * .0243902) - 1., c = abs(m) - .5, q = floor(m + .5);
    m = m - q;
    vec2 N = vec2(m.s, c.s), r = vec2(m.t, c.t), o = vec2(m.p, c.p), a = vec2(m.q, c.q);
    vec4 G = 1.79284 - .853735 * vec4(dot(N, N), dot(o, o), dot(r, r), dot(a, a));
    N *= G.s;
    o *= G.t;
    r *= G.p;
    a *= G.q;
    float i = dot(N, vec2(h.s, e.s)), n = dot(r, vec2(h.t, e.t)), l = dot(o, vec2(h.p, e.p)), I = dot(a, vec2(h.q, e.q));
    vec2 u = fade(d.st), S = mix(vec2(i, l), vec2(n, I), u.s);
    float g = mix(S.s, S.t, u.t);
    return 2.3 * g;
}
highp float GetInterleavedGradientNoise(highp vec2 t) { return clamp(fract(52.9829 * fract(.0671106 * t.s + .00583715 * t.t)), 0., .999); }
#endif

#define STIPPLE_TRANSPARENCY_ENABLED
#if defined(STIPPLE_TRANSPARENCY_CLIP_NEAR) || defined(STIPPLE_TRANSPARENCY_CLIP_FAR)
uniform vec4 uStippleTransparencyClipParams;
#endif
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

float GetStippleTransparencyAlpha(float S, inout float R)
{
    float f = 1.;
#if defined(STIPPLE_TRANSPARENCY_CLIP_NEAR)
    float d = (S - (uZBufferParams.q + uStippleTransparencyClipParams.s)) * uStippleTransparencyClipParams.t;
    f *= clamp(d, 0., 1.);
#endif

#if defined(STIPPLE_TRANSPARENCY_CLIP_FAR)
    float u = 1. - (S - (abs(uZBufferParams.p) - uStippleTransparencyClipParams.p)) * uStippleTransparencyClipParams.q;
    f *= clamp(u, 0., 1.);
#endif

#if defined(STIPPLE_TRANSPARENCY_ALPHA)
    f *= clamp(R + .005, 0., 1.);
    R = 1.;
#endif
    return f;
}
bool IsStipplePixelVisible(highp vec3 S, highp vec2 R, inout float d)
{
    float u = GetStippleViewSpaceDepthFromPos(S);
    return GetStippleTransparencyAlpha(u, d) > GetInterleavedGradientNoise(R);
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#endif
#endif

void main()
{
    highp vec3 d = vWorldPos_ViewSpaceDepth.stp;
#if defined(CLIP_PLANE)
    if (dot(vec4(d, 1.), uClipPlane) < 0.)
    {
        discard;
        return;
    }
#if defined(CLIP_PLANE_CLAMP)
    gl_FragDepth = 0.;
    return;
#endif

#endif
    vec3 v = normalize(vWorldNormal.stp);
    highp vec3 S = d - uCameraPosition;
    float D = step(.5, fract(vMaterialProperties.q * .5)), p;
    vec4 u = vec4(0., 0., 0., 1.);
    vec2 r = vec2(0.);
#if defined(TEXTURE_ATLAS)
    SampleTerrainTextures(u, r, p, v, d, S, vVertexAlbedo, vMaterialProperties, D);
#else

#if defined(DEBUG_TEXEL_DENSITY)
    gl_FragColor = vec4(1.);
#endif
    u = vVertexAlbedo;
#endif

#if defined(DEBUG_TERRAIN_SPECULAR_MAX)
    if (uDebugTerrainSpecular.s >= 0.)
        r.t = max(r.t, uDebugTerrainSpecular.s);
    if (uDebugTerrainSpecular.t >= 0.)
        r.t = uDebugTerrainSpecular.t;
#endif

#if defined(DEBUG_TEXEL_DENSITY) || defined(DEBUG_TANGENTS) || defined(DEBUG_BITANGENTS)
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(STIPPLE_TRANSPARENCY_ENABLED)
    if (!IsStipplePixelVisible(S, gl_FragCoord.st, u.q))
    {
        discard;
    }
#endif
    float n = 1.;
#if defined(TEXTURE_ATLAS)
    n += r.s * 4.;
#endif

#if defined(VIEWPORTLOOKUPSCALE)
    vec2 G = gl_FragCoord.st * uFullScreenLookupScale.st;
#endif
    float g = 1.;
#if defined(SSAO)
    g = texture2D(uSSAOMap, G).s;
#endif
    vec3 m;
#if defined(IRRADIANCE_LIGHTING)

#if defined(NORMAL_MAP)
    m = uAmbientColour * EvaluateSHLighting2ndOrder(v, uIrradianceSHCoefs);
#else
    m = vAmbientColour;
#endif

#else
    m = uAmbientColour;
#endif

#if defined(SSAO)
    m *= g;
#endif
    highp float t = length(S);
    highp vec3 T = S / t;
    LightingTerms s;
    ClearLightingTerms(s);
#if defined(SUNLIGHT_DIRECT_LIGHTING)
    int A = -1;
    float C = 0.;
#if defined(DEFERRED_SHADOWS)
    s = EvaluateSunlightRT5(C, v, v, -T, G, r.t, D);
#else
    s = EvaluateSunlightRT5(A, C, vec4(d, 1.), v, v, vWorldPos_ViewSpaceDepth.q, -T, r.t, D, 1.);
#endif

#else
    s.Diffuse = vec3(1.);
#endif

#if defined(TEXTURE_ATLAS) && defined(DEBUG_MATERIAL_HIGHLIGHT)
    if (uDebugMaterialHighlight != -1.)
    {
        float e = mix(.1, 1., length(s.Diffuse)), P = .1;
        vec3 q = mix(vec3(P) * e, vec3(0, 1, 0), p);
        gl_FragColor = vec4(q, 1);
        if (uDebugReturn != 0.)
        {
            return;
        }
    }
#endif
    vec4 i = vec4(0., 0., 0., u.q);
#if defined(POINT_LIGHTING)
    vec3 e = vec3(0., 0., 0.), q = vec3(0., 0., 0.);
    const vec3 f = vec3(.65, .65, .65);
    const float P = 1., l = 5.;
    EvaluatePointLights(e, q, f, r.t, P, l, -T, d, v, vWorldPos_ViewSpaceDepth.q, vec3(0.));
#if defined(DEBUG_POINTLIGHTS)
    gl_FragColor = vec4(e, i.q);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(DEBUG_POINTLIGHTS_SPECULAR)
    gl_FragColor = vec4(q, i.q);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(DIFFUSE_LIGHTING)
    s.Diffuse += e;
#else
    s.Diffuse = e;
#endif

#if defined(POINT_LIGHTING_SPECULAR)
    s.Specular += q;
#endif

#else

#if defined(DEBUG_POINTLIGHTS)
    gl_FragColor = vec4(0., 0., 0., 1.);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(DEBUG_POINTLIGHTS_SPECULAR)
    gl_FragColor = vec4(0., 0., 0., 1.);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if !defined(DIFFUSE_LIGHTING)
    s.Diffuse = vec3(0.);
#endif

#endif
    float h = 0.;
#if defined(CAUSTICS)
    h = CalculateCausticsTerm(d, C, v);
#endif

#if defined(AMBIENT_LIGHTING)
    i.stp += m;
#endif
    i.stp += s.Diffuse;
#if defined(SPECULAR_LIGHTING)
    i.stp += s.Specular * n;
#endif

#if defined(CAUSTICS)
    i.stp += uSunColour * h;
#endif

#if defined(ALBEDO_LIGHTING)
    i.stp *= u.stp;
#endif

#if defined(TEXTURE_ATLAS) && defined(SUNLIGHT_SHADOWS)

#if defined(DEBUG_EMISSIVE_MAP)
    i.stp = vec3(D);
#endif

#elif defined(DEBUG_EMISSIVE_MAP)
    i.stp = vec3(0.);
#endif

#if defined(TEXTURE_ATLAS) && !defined(DEBUG_EMISSIVE_MAP)
    i.stp = mix(i.stp, u.stp, D);
#endif

#if defined(FOG_DISTANCE) || (defined(SUNLIGHT_DIRECT_LIGHTING) && defined(LIGHT_SCATTERING))

#if defined(OGLES2_BACKEND)
    vec3 c, E;
#if defined(LIGHT_SCATTERING)
    ComputeInOutScattering(T, t, uInvSunDirection, c, E);
#else
    c = vec3(1.);
    E = vec3(0.);
#endif

#if defined(FOG_DISTANCE)
    float R = FogBasedOnDistance(t) * FogBasedOnAngle(T);
    E = mix(E, uFogColour.stp, R);
    c *= 1. - R;
#endif
    i.stp = mix(ApplyInOutScattering(i.stp, c, E), i.stp, D);
#else
    i.stp = mix(ApplyInOutScattering(i.stp, vOutScattering, vInScattering), i.stp, D);
#endif

#endif

#if defined(DEBUG_ALBEDO)
    i = u;
#endif

#if defined(DEBUG_NORMALS)
    i.stp = v * .5 + .5;
    i.q = 1.;
#endif

#if defined(DEBUG_SPECULAR_MAP)

#if defined(TEXTURE_ATLAS)
    i.stp = vec3(max(0., (n - .5) / 4.));
#else
    i.stp = vec3(0.);
#endif

#endif

#if defined(SUNLIGHT_SHADOWS) && defined(DEBUG_SUNLIGHT_SHADOW_CASCADE) && !defined(DEFERRED_SHADOWS)
    i.stp *= ShadowMapCascadeColour(A, int(uMappingParams.q)).stp;
#endif

#if defined(DEBUG_RT7_EMISSIVE) || defined(DEBUG_RT7_METALNESS) || defined(DEBUG_RT7_ROUGHNESS)
    i = vec4(1., 0., 1., 1.);
#endif
    gl_FragColor = i;
}


/* MATCH 3 */

#version 460

/***************************************************/
/***************** GLSL Header *********************/
/***************************************************/
#ifdef GL_EXT_gpu_shader4
#extension GL_EXT_gpu_shader4 : enable
#endif
#ifdef GL_ARB_gpu_shader5
#extension GL_ARB_gpu_shader5 : enable
#endif
#ifdef GL_ARB_derivative_control
#extension GL_ARB_derivative_control : enable
#endif

#ifdef GL_ARB_texture_gather
#extension GL_ARB_texture_gather : enable
#endif

#define OGL_BACKEND

#undef attribute
#define attribute in

#undef gl_FragColor
#define gl_FragColor FragColor

#define shadow2DCompat texture

#undef textureCube
#define textureCube texture

#undef texture2D
#define texture2D texture

#undef texture3D
#define texture3D texture

#undef texture2DLod
#define texture2DLod textureLod

#undef textureCubeLod
#define textureCubeLod textureLod

#undef texture2DGrad
#define texture2DGrad textureGrad

#define MSAA_AVAILABLE

#define TEXTURE_OFFSET_AVAILABLE
#if !defined(lowp)
#define lowp
#endif
#if !defined(mediump)
#define mediump
#endif
#if !defined(highp)
#define highp
#endif

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define shadow2DLodCompat texture2DLod

#define texture2DLodCompat texture2DLod

#define textureCubeLodCompat textureCubeLod

#define textureGatherCompat(sampler, texCoord, viewportScale) textureGather(sampler, texCoord).wzxy

#define UNIFORM_BUFFER_BEGIN(name) \
    layout(std140) uniform name    \
    {
#define UNIFORM_BUFFER_END \
    }                      \
    ;

mat3 Mat4ToMat3(const mat4 inputMatrix)
{
    return mat3(inputMatrix);
}

#define isNaN isnan

#ifndef GL_ARB_derivative_control
#define dFdxFine dFdx
#define dFdyFine dFdy
#define fwidthFine fwidth
#endif

/***************************************************/

/***************************************************/
/***************** Effect Defines ******************/
/***************************************************/
#define SUNLIGHT_DIRECT_LIGHTING
#define TEXTURE_ATLAS
#define VIEW_TRANSFORMS

/*************************************************/

/***************************************************/
/********** Mandatory Shader Fragments *************/
/***************************************************/

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_X 3.0
#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_Y 4.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X 42.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_Y 32.0
#define MATERIAL_SETTINGS_TEXTURE_RESOLUTION 128.0
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif
#ifndef PACK_UTILS_INC
#define PACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

vec4 PackFloatToRGBA(highp float valueToPack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShift = vec4(256 * 256 * 256, 256 * 256, 256, 1.0);
    const highp vec4 bitMask = vec4(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
    highp vec4 fragColour = mod(valueToPack * bitShift * vec4(255), vec4(256)) / vec4(255);
    return fragColour - fragColour.xxyz * bitMask;
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
    const highp vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    highp vec4 fragColour = fract(valueToPack * bitShift);
    return fragColour - (fragColour.xxyz * bitMask);
#endif
}
vec2 NormalPackSphereMap(vec3 v)
{
    vec2 f = normalize(v.st) * sqrt(-v.p * .5 + .5);
    f = f * .5 + .5;
    return f * 65535.;
}
vec2 PackFloatToVec2(float v)
{
    vec2 f;
    const float b = 1. / 255.;
    vec2 h = vec2(1., 255.), r = fract(h * v);
    r.s -= r.t * b;
    return r.st;
}
#endif
#ifndef UNPACK_UTILS_INC
#define UNPACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

highp float UnpackRGBAToFloat(highp vec4 valueToUnpack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
    return dot(valueToUnpack, bitShifts);
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShifts = vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0);
    return dot(valueToUnpack, bitShifts);
#endif
}
vec3 ColourUnpack(highp float v)
{
    vec3 f;
    f.s = floor(v / 256. / 256.);
    f.t = floor((v - f.s * 256. * 256.) / 256.);
    f.p = floor(v - f.s * 256. * 256. - f.t * 256.);
    return f / 256.;
}
vec3 NormalUnpackSphereMap(vec2 v)
{
    vec4 f = vec4(v.s / 32767. - 1., v.t / 32767. - 1., 1., -1.);
    float U = dot(f.stp, -f.stq);
    f.st *= sqrt(U);
    f.p = U;
    return f.stp * 2. + vec3(0., 0., -1.);
}
highp float UnpackRGBAToIntegerFloat(highp vec4 f) { return floor(f.s * 255. + .5) * 256. * 256. * 256. + floor(f.t * 255. + .5) * 256. * 256. + floor(f.p * 255. + .5) * 256. + floor(f.q * 255. + .5); }
highp float UnpackRGBAToIntegerFloat16(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
highp int UnpackRGBAToInt(vec4 f) { return int(UnpackRGBAToIntegerFloat(f)); }
highp vec4 UnpackFloatToRGBA(highp float f)
{
    const highp vec4 v = vec4(1., 255., 65025., 1.65814e+07), s = vec4(vec3(1. / 255.), 0.);
    highp vec4 U = fract(f * v);
    U -= U.sstp * s;
    return U;
}
highp float UnpackVec2ToFloat(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
#endif
#if defined(MSAA) && defined(MSAA_AVAILABLE)
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2DMS
#define MSAA_SAMPLERS_ENABLED 1
#define texture2DMultisample(sampler, texCoord, texSize) texelFetch(sampler, ivec2((texCoord)*texSize), 0)
#else
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2D
#define MSAA_SAMPLERS_ENABLED 0
#define texture2DMultisample(sampler, texCoord, texSize) texture2DLodCompat(sampler, texCoord, 0.0)
#endif
UNIFORM_BUFFER_BEGIN(ViewportLookupScale)
uniform highp vec4 uViewportLookupScale;
uniform highp vec4 uViewportOffsetScale;
uniform highp vec4 uFullScreenLookupScale;
UNIFORM_BUFFER_END

/***************************************************/

attribute vec3 aVertexPosition;
attribute vec4 aVertexNormal_FogProportion;
attribute vec4 aMaterialSettingsSlotXY_MaterialSettingsSlotXY2;
attribute vec2 aMaterialSettingsSlotXY3;
attribute vec4 aTextureScale;
attribute vec4 aVertexColour;
attribute vec4 aTextureWeight;
attribute vec4 aMaterialProperties;
uniform mat4 uModelMatrix;

UNIFORM_BUFFER_BEGIN(ViewTransforms)
uniform highp vec3 uCameraPosition;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;
uniform highp mat4 uViewProjMatrix;
uniform highp vec4 uZBufferParams;
UNIFORM_BUFFER_END
uniform mediump vec4 uAtlasMeta;
uniform float uFade;
out highp vec4 vWorldPos_ViewSpaceDepth;
out vec4 vVertexAlbedo;
out vec3 vWorldNormal;
flat out highp vec4 vMaterialSettingsSlots1D;
flat out highp vec4 vTextureScale;
out vec4 vTextureWeight;
flat out vec4 vMaterialProperties;
#ifndef DISTANCE_FOG_UNIFORMS
#define DISTANCE_FOG_UNIFORMS
#if defined(FOG_DISTANCE)
UNIFORM_BUFFER_BEGIN(DistanceFog)
uniform mediump vec4 uFogColour;
uniform highp vec4 uFogParams;
UNIFORM_BUFFER_END
#endif
#endif

#ifndef DISTANCE_FOG_FUNCTIONS
#define DISTANCE_FOG_FUNCTIONS
#if defined(FOG_DISTANCE)
float FogBasedOnDistance(highp float f)
{
    highp float F = (uFogParams.t - f) * uFogParams.s;
    return 1. - clamp(F, 0., 1.);
}
float FogBasedOnAngle(highp vec3 f)
{
    highp float F = 1. - clamp(f.t + uFogParams.q, 0., 1.);
    F = pow(F, uFogParams.p);
    return clamp(F, 0., 1.);
}
#endif
#endif

void main()
{
    vec4 d = uModelMatrix * vec4(aVertexPosition, 1.);
    gl_Position = uViewProjMatrix * d;
    vWorldPos_ViewSpaceDepth.stp = d.stp;
    vVertexAlbedo = aVertexColour;
#if defined(GAMMA_CORRECT_INPUTS) && !defined(TEXTURE_ATLAS)
    vVertexAlbedo.stp = SRGBToLinear(vVertexAlbedo.stp);
#endif
    vVertexAlbedo.q += uFade;
#if defined(SUNLIGHT_DIRECT_LIGHTING) || defined(DEBUG_NORMALS)
    vWorldNormal = normalize(Mat4ToMat3(uModelMatrix) * aVertexNormal_FogProportion.stp);
#endif

#if defined(IRRADIANCE_LIGHTING) && !defined(NORMAL_MAP)
    vAmbientColour = uAmbientColour * EvaluateSHLighting2ndOrder(vWorldNormal, uIrradianceSHCoefs);
#endif

#if defined(TEXTURE_ATLAS)
    vMaterialSettingsSlots1D = vec4(aMaterialSettingsSlotXY_MaterialSettingsSlotXY2.s + aMaterialSettingsSlotXY_MaterialSettingsSlotXY2.t * MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X, aMaterialSettingsSlotXY_MaterialSettingsSlotXY2.p + aMaterialSettingsSlotXY_MaterialSettingsSlotXY2.q * MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X, aMaterialSettingsSlotXY3.s + aMaterialSettingsSlotXY3.t * MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X, 0.);
    vTextureScale = aTextureScale;
    vTextureWeight = aTextureWeight;
#endif
    vMaterialProperties = aMaterialProperties + vec4(.25);
#if defined(LIGHT_SCATTERING) || defined(SUNLIGHT_SHADOWS) || defined(FOG_DISTANCE)
    vec3 S = d.stp - uCameraPosition;
    float G = length(S);
    vec3 g = S / G;
#endif

#if defined(SUNLIGHT_SHADOWS)
    vec3 u = vec3(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2]);
    vWorldPos_ViewSpaceDepth.q = abs(dot(S.stp, u));
#endif

#if (defined(FOG_DISTANCE) || (defined(SUNLIGHT_DIRECT_LIGHTING) && defined(LIGHT_SCATTERING))) && !defined(OGLES2_BACKEND)

#if defined(LIGHT_SCATTERING) && defined(SUNLIGHT_DIRECT_LIGHTING)
    ComputeInOutScattering(g, G, uInvSunDirection, vOutScattering, vInScattering);
#else
    vOutScattering = vec3(1.);
    vInScattering = vec3(0.);
#endif

#if defined(FOG_DISTANCE)
    float p = FogBasedOnDistance(G);
    vInScattering = mix(vInScattering, uFogColour.stp, p);
    vOutScattering *= 1. - p;
#endif

#endif
}


/* MATCH 4 */

#version 460

/***************************************************/
/***************** GLSL Header *********************/
/***************************************************/
#ifdef GL_EXT_gpu_shader4
#extension GL_EXT_gpu_shader4 : enable
#endif
#ifdef GL_ARB_gpu_shader5
#extension GL_ARB_gpu_shader5 : enable
#endif
#ifdef GL_ARB_derivative_control
#extension GL_ARB_derivative_control : enable
#endif

#ifdef GL_ARB_texture_gather
#extension GL_ARB_texture_gather : enable
#endif

#define OGL_BACKEND

#undef attribute
#define attribute in

#undef gl_FragColor
#define gl_FragColor FragColor

#define shadow2DCompat texture

#undef textureCube
#define textureCube texture

#undef texture2D
#define texture2D texture

#undef texture3D
#define texture3D texture

#undef texture2DLod
#define texture2DLod textureLod

#undef textureCubeLod
#define textureCubeLod textureLod

#undef texture2DGrad
#define texture2DGrad textureGrad

#define MSAA_AVAILABLE

#define TEXTURE_OFFSET_AVAILABLE
#if !defined(lowp)
#define lowp
#endif
#if !defined(mediump)
#define mediump
#endif
#if !defined(highp)
#define highp
#endif

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define shadow2DLodCompat texture2DLod

#define texture2DLodCompat texture2DLod

#define textureCubeLodCompat textureCubeLod

#define textureGatherCompat(sampler, texCoord, viewportScale) textureGather(sampler, texCoord).wzxy

#define SHADER_TYPE_PIXEL

out vec4 gl_FragColor;

#define UNIFORM_BUFFER_BEGIN(name) \
    layout(std140) uniform name    \
    {
#define UNIFORM_BUFFER_END \
    }                      \
    ;

mat3 Mat4ToMat3(const mat4 inputMatrix)
{
    return mat3(inputMatrix);
}

#define isNaN isnan

#ifndef GL_ARB_derivative_control
#define dFdxFine dFdx
#define dFdyFine dFdy
#define fwidthFine fwidth
#endif

/***************************************************/

/***************************************************/
/***************** Effect Defines ******************/
/***************************************************/
#define AMBIENT_LIGHTING
#define DIFFUSE_LIGHTING
#define ALBEDO_LIGHTING
#define TEXTURE_ALBEDO_GLOBAL
#define SUNLIGHT_DIRECT_LIGHTING
#define TEXTURE_ATLAS
#define ALPHA_ENABLED
#define VIEW_TRANSFORMS
#define TINT

/*************************************************/

/***************************************************/
/********** Mandatory Shader Fragments *************/
/***************************************************/

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_X 3.0
#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_Y 4.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X 42.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_Y 32.0
#define MATERIAL_SETTINGS_TEXTURE_RESOLUTION 128.0
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif
#ifndef PACK_UTILS_INC
#define PACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

vec4 PackFloatToRGBA(highp float valueToPack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShift = vec4(256 * 256 * 256, 256 * 256, 256, 1.0);
    const highp vec4 bitMask = vec4(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
    highp vec4 fragColour = mod(valueToPack * bitShift * vec4(255), vec4(256)) / vec4(255);
    return fragColour - fragColour.xxyz * bitMask;
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
    const highp vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    highp vec4 fragColour = fract(valueToPack * bitShift);
    return fragColour - (fragColour.xxyz * bitMask);
#endif
}
vec2 NormalPackSphereMap(vec3 v)
{
    vec2 f = normalize(v.st) * sqrt(-v.p * .5 + .5);
    f = f * .5 + .5;
    return f * 65535.;
}
vec2 PackFloatToVec2(float v)
{
    vec2 f;
    const float b = 1. / 255.;
    vec2 h = vec2(1., 255.), r = fract(h * v);
    r.s -= r.t * b;
    return r.st;
}
#endif
#ifndef UNPACK_UTILS_INC
#define UNPACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

highp float UnpackRGBAToFloat(highp vec4 valueToUnpack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
    return dot(valueToUnpack, bitShifts);
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShifts = vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0);
    return dot(valueToUnpack, bitShifts);
#endif
}
vec3 ColourUnpack(highp float v)
{
    vec3 f;
    f.s = floor(v / 256. / 256.);
    f.t = floor((v - f.s * 256. * 256.) / 256.);
    f.p = floor(v - f.s * 256. * 256. - f.t * 256.);
    return f / 256.;
}
vec3 NormalUnpackSphereMap(vec2 v)
{
    vec4 f = vec4(v.s / 32767. - 1., v.t / 32767. - 1., 1., -1.);
    float U = dot(f.stp, -f.stq);
    f.st *= sqrt(U);
    f.p = U;
    return f.stp * 2. + vec3(0., 0., -1.);
}
highp float UnpackRGBAToIntegerFloat(highp vec4 f) { return floor(f.s * 255. + .5) * 256. * 256. * 256. + floor(f.t * 255. + .5) * 256. * 256. + floor(f.p * 255. + .5) * 256. + floor(f.q * 255. + .5); }
highp float UnpackRGBAToIntegerFloat16(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
highp int UnpackRGBAToInt(vec4 f) { return int(UnpackRGBAToIntegerFloat(f)); }
highp vec4 UnpackFloatToRGBA(highp float f)
{
    const highp vec4 v = vec4(1., 255., 65025., 1.65814e+07), s = vec4(vec3(1. / 255.), 0.);
    highp vec4 U = fract(f * v);
    U -= U.sstp * s;
    return U;
}
highp float UnpackVec2ToFloat(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
#endif
#if defined(MSAA) && defined(MSAA_AVAILABLE)
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2DMS
#define MSAA_SAMPLERS_ENABLED 1
#define texture2DMultisample(sampler, texCoord, texSize) texelFetch(sampler, ivec2((texCoord)*texSize), 0)
#else
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2D
#define MSAA_SAMPLERS_ENABLED 0
#define texture2DMultisample(sampler, texCoord, texSize) texture2DLodCompat(sampler, texCoord, 0.0)
#endif
UNIFORM_BUFFER_BEGIN(ViewportLookupScale)
uniform highp vec4 uViewportLookupScale;
uniform highp vec4 uViewportOffsetScale;
uniform highp vec4 uFullScreenLookupScale;
UNIFORM_BUFFER_END

/***************************************************/

uniform highp float uTextureAnimationTime;

UNIFORM_BUFFER_BEGIN(ViewTransforms)
uniform highp vec3 uCameraPosition;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;
uniform highp mat4 uViewProjMatrix;
uniform highp vec4 uZBufferParams;
UNIFORM_BUFFER_END

UNIFORM_BUFFER_BEGIN(Sunlight)
uniform highp vec3 uInvSunDirection;
uniform mediump vec3 uAmbientColour;
uniform mediump vec3 uSunColour;
uniform mediump float uDummy;
UNIFORM_BUFFER_END
#ifndef LIGHT_SCATTERING_VS_UNIFORMS
#define LIGHT_SCATTERING_VS_UNIFORMS
UNIFORM_BUFFER_BEGIN(SimpleScattering)
uniform mediump vec3 uOutscatteringAmount;
uniform mediump vec3 uInscatteringAmount;
uniform mediump vec3 uScatteringTintColour;
uniform highp vec4 uScatteringParameters;
UNIFORM_BUFFER_END
#endif
#ifndef BRDF_INC
#define BRDF_INC
#ifndef NDF_INC
#define NDF_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float BlinnPhongNDF(float f, float N)
{
    return (f + 2.) * INV_EIGHT * pow(N, f);
}
float GGXTrowbridgeReitzNDF(float N, float f)
{
    float P = N * N, I = f * f, T = I * (P - 1.) + 1.;
    return P / (PI * (T * T + .0001));
}
float BeckmannNDF(float N, float f)
{
    float P = N * N, I = f * f;
    return exp((I - 1.) / (P * I)) / (PI * P * (I * I));
}
#endif

#ifndef VISIBILITY_FUNC_INC
#define VISIBILITY_FUNC_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float SchlickSmithVis(float V, float f, float S)
{
    float P = 1. / sqrt(PI_OVER_4 * V + PI_OVER_2), d = 1. - P, v = (f * d + P) * (S * d + P);
    return 1. / (v + .0001);
}
float KelemenSzirmayKalosVis(vec3 V, vec3 P)
{
    vec3 f = V + P;
    return 4. / max(0., dot(f, f));
}
#endif

#define GGX_NDF
#define SCHLICK_SMITH_VIS
vec3 CookTorranceBRDF(float d, float S, vec3 n, vec3 v, vec3 f, vec3 B, vec3 R, float F)
{
    float m = max(0., dot(v, f)), r = 1.;
#if defined(BLINN_PHONG_NDF)
    r = BlinnPhongNDF(d, m);
#elif defined(GGX_NDF)
    r = GGXTrowbridgeReitzNDF(PerceptualRoughnessToRoughness(S), m);
#elif defined(BECKMANN_NDF)
    r = max(0.f, BeckmannNDF(SpecPowToBeckmannRoughness(d), m));
#else

#error CookTorranceBRDF normal distribution function not specified

#endif
    float C = 1.;
#if defined(SCHLICK_SMITH_VIS)
    C = SchlickSmithVis(d, F, max(0., dot(v, B)));
#elif defined(KELEMEN_SZIRMAY_KALOS_VIS)
    C = KelemenSzirmayKalosVis(R, B);
#endif
    return n * (r * C);
}
float RunescapeLegacyBRDF(vec3 d, vec3 v, vec3 f, float B, float S)
{
    vec3 n = reflect(-d, f);
    float C = pow(max(0., dot(n, v)), B);
    return C * S;
}
float RunescapeRT5BRDF(vec3 d, vec3 v, float S) { return BlinnPhongNDF(S, max(0., dot(d, v))); }
vec3 ShiftTangent(vec3 d, vec3 S, float B) { return normalize(d + B * S); }
vec3 AnisotropicBRDF(vec3 v, vec3 d, vec3 S, vec3 f, vec3 B, float n, float m, float R, float C)
{
    const float F = 7.5, r = 1., e = .5, o = 1.;
    float s = R - .5;
    S = ShiftTangent(S, d, e + (C * 2. - 1.) * o + s);
    float p = abs(dot(S, f)), a = 1. - p, t = 1. - abs(dot(S, B)), K = p * dot(d, B);
    K += a * t;
    K = pow(K, F) * n;
    K = mix(K, K * C, o);
    float G = pow(dot(d, v), m), P = mix(G, K, r);
    return vec3(P, P, P);
}
#endif
uniform float uAlphaTestThreshold;
uniform vec4 uAtlasMeta;
uniform sampler2D uTextureAtlas;
uniform sampler2D uTextureAtlasSettings;
uniform samplerCube uGlobalEnvironmentMap;
uniform vec4 uGlobalEnvironmentMappingParams;
uniform vec4 uTint;
in highp vec3 vWorldPosition;
in highp vec3 vNormal;
in mediump vec4 vVertexAlbedo;
in vec2 vTextureUV;
flat in vec3 vMaterialSettingsSlotXY_BatchFlags;
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif

vec4 textureCubeSRGB(samplerCube sampler, vec3 reflDir)
{
    vec4 texel = textureCube(sampler, reflDir);
    return texel;
}

vec4 textureCubeSRGB(samplerCube sampler, vec3 reflDir, float lod)
{
    vec4 texel = textureCube(sampler, reflDir, lod);
    return texel;
}

vec4 textureCubeLodSRGB(samplerCube sampler, vec3 reflDir, float lod)
{
    vec4 texel = textureCubeLodCompat(sampler, reflDir, lod);
    return texel;
}
#define SRGB_TEXTURES
#define STANDARD_DERIVATIVES
#define TEXTURE_LOD
#define TEXTURE_GRAD
#define TEXTURE_MIP_LIMIT
#define LOOKUP_MODE_DYNAMIC

#define TEXTURE_SETTINGS_USE_TEXEL_OFFSETS
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif

float getMipMapLevel(vec2 v, vec2 p)
{
    float d = 0.;
#if defined(STANDARD_DERIVATIVES)
    float L = max(dot(v, v), dot(p, p));
    d = .5 * log2(L);
    d = max(0., d);
#endif
    return d;
}
#if defined(DEBUG_TEXEL_DENSITY)
vec3 GetTexelDensityDebugColour(vec2 v, float p, vec3 d)
{
    float t = length(fwidth(v) * p), s = length(fwidth(d)), L = t / s, h = uDebugTexelDensity.s, f = uDebugTexelDensity.t, o = uDebugTexelDensity.p, T = uDebugTexelDensity.q;
    vec3 c;
    c.s = smoothstep(f / (T + 1.), h, L);
    c.t = 1. - smoothstep(0., f * (T + 1.), abs(L - f));
    c.p = smoothstep(1. - (f + o * T), 1. - o, 1. - L);
    c *= c;
    return c;
}
#endif
#if defined(LOOKUP_MODE_DYNAMIC) && !defined(NO_SAMPLER_WRAP)
flat in mediump float vSamplerWrap;
#endif
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

void getTexelBias_inner(float v, highp vec2 t, highp vec3 d, highp vec3 p, highp vec3 s, vec4 c, vec2 m, vec2 g, float L, sampler2D f, out vec4 i, out vec4 h, out vec4 o)
{
    float T = c.s;
    highp float q = c.t, l = c.p;
    float P = c.q;
    highp vec3 S = vec3(d.s, p.s, s.s), y = vec3(d.t, p.t, s.t), a = vec3(d.p, p.p, s.p);
    const vec2 u = vec2(1.);
    vec3 D = .5 / a;
    highp vec2 r, C, Y;
#if !defined(LOOKUP_MODE_CLAMP) && !defined(LOOKUP_MODE_REPEAT)
    const float G = .5, e = .25, n = .125, E = .0625;
    vec4 O = step(.5, fract(L * vec4(G, e, n, E)));
#endif

#if defined(LOOKUP_MODE_CLAMP)
    r = clamp(t, vec2(D.s), u - vec2(D.s));
#elif defined(LOOKUP_MODE_REPEAT)
    r = mod(t, u);
#else
    const vec2 N = vec2(.5), M = vec2(2.);
    vec2 x = clamp(t, vec2(D.s), u - vec2(D.s)), R = mod(t, u), A = t - M * floor(N * t), U = u - abs(u - A);
    r = O.st * x + O.pq * R + (u - O.st - O.pq) * U;
#endif
    r = r * a.s * l;
    r += vec2(S.s, y.s) * q * l;
    if (v > 1.)
    {
#if defined(LOOKUP_MODE_CLAMP)
        C = clamp(t, vec2(D.t), u - vec2(D.t));
#elif defined(LOOKUP_MODE_REPEAT)
        C = mod(t, u);
#else
        vec2 I = clamp(t, vec2(D.t), u - vec2(D.t)), K = R, B = U;
        C = O.st * I + O.pq * K + (u - O.st - O.pq) * B;
#endif
        C = C * a.t * l;
        C += vec2(S.t, y.t) * q * l;
        if (v > 2.)
        {
#if defined(LOOKUP_MODE_CLAMP)
            Y = clamp(t, vec2(D.p), u - vec2(D.p));
#elif defined(LOOKUP_MODE_REPEAT)
            Y = mod(t, u);
#else
            vec2 b = clamp(t, vec2(D.p), u - vec2(D.p)), X = R, V = U;
            Y = O.st * b + O.pq * X + (u - O.st - O.pq) * V;
#endif
            Y = Y * a.p * l;
            Y += vec2(S.p, y.p) * q * l;
        }
    }
    h = vec4(0.);
    o = vec4(0.);
#if defined(TEXTURE_MIP_LIMIT)

#if defined(TEXTURE_GRAD)
    highp vec2 I = m * l, K = g * l, B = I * a.s, X = K * a.s;
    const vec2 b = vec2(.025);
    B = clamp(B, -b, b);
    X = clamp(X, -b, b);
    i = texture2DGrad(f, r, B, X);
    if (v > 1.)
    {
        B = I * a.t;
        X = K * a.t;
        B = clamp(B, -b, b);
        X = clamp(X, -b, b);
        h = texture2DGrad(f, C, B, X);
        if (v > 2.)
            B = I * a.p, X = K * a.p, B = clamp(B, -b, b), X = clamp(X, -b, b), o = texture2DGrad(f, Y, B, X);
    }
#else
    i = texture2D(f, r);
    if (v > 1.)
    {
        h = texture2D(f, C);
        if (v > 2.)
            o = texture2D(f, Y);
    }
#endif

#else

#if defined(TEXTURE_LOD)
    vec2 V = m * a.s, W = g * a.s;
    float F = getMipMapLevel(V, W);
    F = min(F, P);
    i = texture2DLod(f, r, F);
    if (v > 1.)
    {
        V = m * a.t;
        W = g * a.t;
        F = getMipMapLevel(V, W);
        F = min(F, P);
        h = texture2DLod(f, C, F);
        if (v > 2.)
            V = m * a.p, W = g * a.p, F = getMipMapLevel(V, W), F = min(F, P), o = texture2DLod(f, Y, F);
    }
#else
    i = texture2D(f, r);
    if (v > 1.)
    {
        h = texture2D(f, C);
        if (v > 2.)
            o = texture2D(f, Y);
    }
#endif

#endif
}
void getTexel_inner(float v, vec2 f, highp vec3 d, highp vec3 t, highp vec3 p, vec4 s, vec2 h, vec2 o, float b, sampler2D B, out vec4 D, out vec4 L, out vec4 u)
{
    getTexelBias_inner(v, f, d, t, p, s, h, o, b, B, D, L, u);
#if defined(SRGB_TEXTURES)
    if (v > 1.)
        L = vec4(LinearToSRGB(L.stp), L.q);
    if (v > 2.)
        u = vec4(LinearToSRGB(u.stp), u.q);
#else
    D = vec4(SRGBToLinear(D.stp), D.q);
#endif
}
void getTexel_inner(float v, vec2 f, highp vec3 d, highp vec3 t, highp vec3 p, vec4 s, float h, sampler2D o, out vec4 b, out vec4 B, out vec4 u)
{
    vec2 X = vec2(0.), i = vec2(0.);
#if defined(STANDARD_DERIVATIVES)
    X = dFdx(f);
    i = dFdy(f);
#endif
    getTexel_inner(v, f, d, t, p, s, X, i, h, o, b, B, u);
}
void getTexel(vec2 v, highp vec3 o, vec4 h, vec2 g, vec2 s, float f, sampler2D e, out vec4 c)
{
    vec3 t = vec3(1.), l = vec3(1.);
    vec4 i = vec4(0.), p = vec4(0.);
    getTexel_inner(1., v, o, t, l, h, g, s, f, e, c, i, p);
}
void getTexel(vec2 v, highp vec3 o, vec4 h, float g, sampler2D s, out vec4 f)
{
    vec3 e = vec3(1.), l = vec3(1.);
    vec4 t = vec4(0.), p = vec4(0.);
    getTexel_inner(1., v, o, e, l, h, g, s, f, t, p);
}
void getTexel(vec2 v, highp vec3 o, highp vec3 h, vec4 g, vec2 s, vec2 f, float e, sampler2D t, out vec4 l, out vec4 p)
{
    vec3 i = vec3(1.);
    vec4 c = vec4(0.);
    getTexel_inner(2., v, o, h, i, g, s, f, e, t, l, p, c);
}
void getTexel(vec2 v, highp vec3 o, highp vec3 h, vec4 g, float s, sampler2D f, out vec4 e, out vec4 t)
{
    vec3 l = vec3(1.);
    vec4 p = vec4(0.);
    getTexel_inner(2., v, o, h, l, g, s, f, e, t, p);
}
void getTexel(vec2 v, highp vec3 o, highp vec3 h, highp vec3 g, vec4 s, vec2 f, vec2 e, float t, sampler2D l, out vec4 p, out vec4 i, out vec4 c) { getTexel_inner(3., v, o, h, g, s, f, e, t, l, p, i, c); }
void getTexel(vec2 v, highp vec3 o, highp vec3 h, highp vec3 g, vec4 s, float f, sampler2D e, out vec4 t, out vec4 l, out vec4 p) { getTexel_inner(3., v, o, h, g, s, f, e, t, l, p); }

#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#ifndef TEXTURE_SETTINGS_INC
#define TEXTURE_SETTINGS_INC
struct TextureSettings
{
    highp vec3 textureMeta1;
    highp vec3 textureMeta2;
    highp vec2 uvAnim;
    float wrapping;
    float specular;
    float normalScale;
#if defined(REFRACTION)
    vec4 refraction;
#endif
#if defined(VIEWPORTMAP)
    vec4 viewportMapUVScaleAndAnim;
#endif
#if defined(DEBUG_MATERIAL_HIGHLIGHT)
    highp float materialID;
#endif
};
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

void getTextureSettings(vec2 s, out TextureSettings v)
{
    const highp float d = 1. / 255., S = 1. / 65535., e = 32767., t = 1. / 32767.;
    const float f = 1. / MATERIAL_SETTINGS_TEXTURE_RESOLUTION;
    vec2 i = (floor(s + .5) * vec2(MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_X, MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_Y) + .5) * f;
    const float u = f;
    vec4 T = texture2DLodCompat(uTextureAtlasSettings, i, 0.), U, n, D, m, a, R;
    float h;
    vec4 r;
#if defined(TEXTURE_SETTINGS_USE_TEXEL_OFFSETS)

#define SAMPLE_OFFSET_SLOTSIZES_AND_WRAPPING ivec2(2, 0)

#define SAMPLE_OFFSET_UV_ANIM ivec2(0, 1)

#define SAMPLE_OFFSET_SPECULAR_NORMAL_SCALE ivec2(1, 1)

#define SAMPLE_OFFSET_REFRACTION ivec2(0, 2)

#define SAMPLE_OFFSET_SLOTETC ivec2(1, 2)

#define SAMPLE_OFFSET_VIEWPORTMAP_UVSCALE ivec2(2, 2)

#define SAMPLE_OFFSET_VIEWPORTMAP_UVANIMATION ivec2(0, 3)

#define SAMPLE_OFFSET_DEBUG ivec2(2, 3)
    U = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_SLOTSIZES_AND_WRAPPING);
    n = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_UV_ANIM);
#if defined(SPECULAR_LIGHTING) || defined(USE_NORMAL_MAP)
    D = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_SPECULAR_NORMAL_SCALE);
#endif

#if defined(REFRACTION)
    m = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_REFRACTION);
#endif
    h = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_SLOTETC).q;
#if defined(VIEWPORTMAP)
    a = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_VIEWPORTMAP_UVSCALE);
    R = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_VIEWPORTMAP_UVANIMATION);
#endif

#if defined(DEBUG_MATERIAL_HIGHLIGHT)
    r = textureLodOffset(uTextureAtlasSettings, i, 0., SAMPLE_OFFSET_DEBUG);
#endif

#else
    vec2 g = vec2(u * 2., 0.), o = vec2(0., u), M = vec2(u, u), p = vec2(0., u * 2.), X = vec2(u, u * 2.), q = vec2(u * 2., u * 2.), E = vec2(0., u * 3.), A = vec2(u * 2., u * 3.);
    U = texture2DLodCompat(uTextureAtlasSettings, i + g, 0.);
    n = texture2DLodCompat(uTextureAtlasSettings, i + o, 0.);
#if defined(SPECULAR_LIGHTING) || defined(USE_NORMAL_MAP)
    D = texture2DLodCompat(uTextureAtlasSettings, i + M, 0.);
#endif

#if defined(REFRACTION)
    m = texture2DLodCompat(uTextureAtlasSettings, i + p, 0.);
#endif
    h = texture2DLodCompat(uTextureAtlasSettings, i + X, 0.).q;
#if defined(VIEWPORTMAP)
    a = texture2DLodCompat(uTextureAtlasSettings, i + q, 0.);
    R = texture2DLodCompat(uTextureAtlasSettings, i + E, 0.);
#endif

#if defined(DEBUG_MATERIAL_HIGHLIGHT)
    r = texture2DLodCompat(uTextureAtlasSettings, i + A, 0.);
#endif

#endif
    T = floor(T * 255. + .5);
    U = floor(U * 255. + .5);
    h = floor(h * 255. + .5);
    const float V = .5, c = .25, L = .125, P = .0625;
    vec4 N = step(.5, fract(h * vec4(V, c, L, P)));
    T += vec4(256.) * N;
    vec2 w = U.st * uAtlasMeta.t;
    v.textureMeta1 = vec3(T.st, w.s);
    v.textureMeta2 = vec3(T.pq, w.t);
    v.wrapping = U.q;
#if defined(SPECULAR_LIGHTING) || defined(USE_NORMAL_MAP)
    v.specular = UnpackVec2ToFloat(D.st) * d;
    v.normalScale = UnpackVec2ToFloat(D.pq) * d;
    v.normalScale = v.normalScale * .1 - 8.;
#else
    v.specular = 0.;
    v.normalScale = 0.;
#endif
    highp vec2 G = vec2(UnpackVec2ToFloat(n.st), UnpackVec2ToFloat(n.pq)) - e;
    G *= step(1.5, abs(G));
    v.uvAnim = G * t * 2.;
#if defined(REFRACTION)
    v.refraction = m;
    v.refraction.t = v.refraction.t * 2. + 1.;
    v.refraction.p = UnpackVec2ToFloat(v.refraction.pq) * S * 10.;
#endif

#if defined(VIEWPORTMAP)
    highp vec2 C = vec2(UnpackVec2ToFloat(a.st), UnpackVec2ToFloat(a.pq)) - e, Y = vec2(UnpackVec2ToFloat(R.st), UnpackVec2ToFloat(R.pq)) - e;
    C *= step(1.5, abs(C));
    Y *= step(1.5, abs(Y));
    v.viewportMapUVScaleAndAnim = vec4(C * t * 2., Y * t * 2.);
#endif

#if defined(DEBUG_MATERIAL_HIGHLIGHT)
    v.materialID = UnpackVec2ToFloat(r.st);
#endif
}
void getTextureSettings1D(float v, out TextureSettings i)
{
    const float d = 1. / MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X;
    float S = floor((v + .5) * d), u = v - S * MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X;
    getTextureSettings(vec2(u, S), i);
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#endif
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif

const highp float CAUSTICS_FIXED_POINT_SCALE = 10000.;
#if defined(CAUSTICS) && !defined(CAUSTICS_COMPUTE) && !defined(CAUSTICS_STENCIL)
float CalculateCausticsTerm(highp vec3 u, float t, vec3 e)
{
    float i = 0., s = 0.;
    if (u.t <= uCausticsPlaneHeight)
        s = step(1., t);
    else
    {
#if defined(CAUSTICS_OVERWATER)
        s = clamp(e.t * -1., 0., 1.);
        float d = smoothstep(uCausticsOverWaterFade.s, uCausticsOverWaterFade.t, u.t - uCausticsPlaneHeight);
        s *= 1. - d;
#else
        return 0.0;
#endif
    }
    if (s > 0.)
    {
        highp vec4 C = uCausticsViewProjMatrix * vec4(u, 1.);
        C.st /= 2. * C.q;
        vec2 f = abs(C.st);
        C.st += .5;
        f = smoothstep(.4, .5, f);
        s *= max(0., 1. - (f.s + f.t));
        if (s > 0.)
            i += textureOffset(uCausticsMap, C.st, ivec2(-1, -1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(-1, 0)).s, i += textureOffset(uCausticsMap, C.st, ivec2(-1, 1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(0, -1)).s, i += texture2D(uCausticsMap, C.st).s * 5., i += textureOffset(uCausticsMap, C.st, ivec2(0, 1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(1, -1)).s, i += textureOffset(uCausticsMap, C.st, ivec2(1, 0)).s, i += textureOffset(uCausticsMap, C.st, ivec2(1, 1)).s, i *= s / 12.;
    }
    return i;
}
#endif
#if defined(CAUSTICS_COMPUTE)
void WriteCausticsRay(vec3 t, float i)
{
    vec2 s = t.sp * i * uCausticsRefractionScale, C = (gl_FragCoord.st + s * 2.) / uCausticsComputeResolution * uCausticsMapSize;
    highp float u = min(uCausticsFade.s / i * uCausticsFade.t, 7. * uCausticsFade.t), f = smoothstep(uCausticsFade.p, uCausticsFade.q, i), E = f * u * CAUSTICS_FIXED_POINT_SCALE;
    if (E >= 1.f)
        imageAtomicAdd(uCausticsIntegerMap, ivec2(C.st), uint(E));
}
#endif

#ifndef DISTANCE_FOG_UNIFORMS
#define DISTANCE_FOG_UNIFORMS
#if defined(FOG_DISTANCE)
UNIFORM_BUFFER_BEGIN(DistanceFog)
uniform mediump vec4 uFogColour;
uniform highp vec4 uFogParams;
UNIFORM_BUFFER_END
#endif
#endif

#ifndef DISTANCE_FOG_FUNCTIONS
#define DISTANCE_FOG_FUNCTIONS
#if defined(FOG_DISTANCE)
float FogBasedOnDistance(highp float f)
{
    highp float F = (uFogParams.t - f) * uFogParams.s;
    return 1. - clamp(F, 0., 1.);
}
float FogBasedOnAngle(highp vec3 f)
{
    highp float F = 1. - clamp(f.t + uFogParams.q, 0., 1.);
    F = pow(F, uFogParams.p);
    return clamp(F, 0., 1.);
}
#endif
#endif

#if defined(TEXTURE_ATLAS) && defined(NORMAL_MAP)
#define USE_NORMAL_MAP
#endif

#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

#if defined(TEXTURE_ATLAS)
void CalculateDerivatives(inout highp vec2 v, inout highp vec2 d, inout highp vec3 g, inout highp vec3 h, highp vec2 S, highp vec3 T)
{
#if defined(STANDARD_DERIVATIVES)
    v = dFdx(S);
    d = dFdy(S);
#if defined(PER_FRAGMENT_TANGENTS)
    g = dFdxFine(T);
    h = dFdyFine(T);
#endif

#endif
}
#if defined(RT7_MATERIAL)
void SampleTexturesRT7(inout vec4 v, inout vec4 d, inout vec4 S, vec2 T, TextureSettings h, float g, vec2 i, vec2 u)
{
#if defined(TEXTURE_ATLAS)

#if !defined(TEXTURE_ALBEDO_GLOBAL)
    if (fract(g * 8.) > .5)
    {
#endif
        getTexel(T, h.textureMeta1, h.textureMeta2, h.textureMeta3, uAtlasMeta, i, u, h.wrapping, uTextureAtlas, v, d, S);
#if defined(ETC_CHANNEL_SWIZZLE)
        d = d.qtps;
        S = S.sqpt;
#endif

#if !defined(TEXTURE_ALBEDO_GLOBAL)
    }
#endif

#endif
}
#else
void SampleTextures(inout vec4 v, inout vec4 d, vec2 T, TextureSettings h, float S, vec2 i, vec2 u)
{
#if defined(TEXTURE_ATLAS)

#if !defined(TEXTURE_ALBEDO_GLOBAL)
    if (fract(S * 8.) > .5)
    {
#endif

#if defined(HDR_SCALE) || defined(USE_NORMAL_MAP)
        getTexel(T, h.textureMeta1, h.textureMeta2, uAtlasMeta, i, u, h.wrapping, uTextureAtlas, v, d);
#if defined(ETC_CHANNEL_SWIZZLE)
        d = d.qtps;
#endif

#else
    getTexel(T, h.textureMeta1, uAtlasMeta, i, u, h.wrapping, uTextureAtlas, v);
#endif

#if !defined(TEXTURE_ALBEDO_GLOBAL)
    }
#endif

#if defined(HDR_SCALE)
    v = HDRScale(v, d.s);
#endif

#endif
}
#endif
#endif
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

void ComputeTangentBitangentFromDerivatives(inout vec3 v, inout vec3 p, highp vec3 h, highp vec3 d, highp vec3 A, highp vec2 r, highp vec2 S)
{
    highp vec3 q = cross(h, d), c = cross(A, h), n = c * r.s + q * S.s, s = c * r.t + q * S.t;
    highp float D = dot(n, n), a = dot(s, s), i = max(D, a), t = inversesqrt(i);
    n *= t;
    s *= t;
    if (isNaN(D + a) || i <= 0.)
        n = s = h;
    v = n;
    p = s;
}
vec3 ComputeBitangent(vec3 v, vec4 h)
{
    highp vec3 p = cross(v, h.stp);
    p *= h.q;
    return p;
}
vec3 ApplyNormalMap(highp vec3 v, highp vec3 h, highp vec3 d, highp vec3 A, highp vec2 p, highp vec2 S)
{
    highp vec3 D, s;
    ComputeTangentBitangentFromDerivatives(D, s, h, d, A, p, S);
#if defined(DEBUG_TANGENTS)
    gl_FragColor.stp = normalize(D) * .5 + .5;
    gl_FragColor.q = 1.;
#endif

#if defined(DEBUG_BITANGENTS)
    gl_FragColor.stp = normalize(s) * .5 + .5;
    gl_FragColor.q = 1.;
#endif
    highp vec3 r = v.s * D + v.t * s + v.p * h;
    r = normalize(r);
    return abs(r.s) + abs(r.t) + abs(r.p) < .5 ? h : r;
}
vec3 ApplyNormalMap(vec3 v, vec3 A, vec3 s, vec3 S)
{
#if defined(DEBUG_TANGENTS)
    gl_FragColor.stp = s * .5 + .5;
    gl_FragColor.q = 1.;
#endif

#if defined(DEBUG_BITANGENTS)
    gl_FragColor.stp = S * .5 + .5;
    gl_FragColor.q = 1.;
#endif
    highp vec3 p = v.s * s + v.t * S + v.p * A;
    p = normalize(p);
    return p;
}
vec3 ApplyNormalMap(vec3 v, vec3 h, vec4 r)
{
    vec3 p = ComputeBitangent(h, r);
    return ApplyNormalMap(v, h, r.stp, p);
}
vec3 ApplyNormalMapTerrain(vec3 v, highp vec3 h, highp vec3 r, highp vec3 S)
{
    highp vec3 p = cross(h, r), s = cross(S, h), D = s * r.s + p * S.s, n = s * r.p + p * S.p;
    highp float A = inversesqrt(max(dot(D, D), dot(n, n)));
    D *= A;
    n *= A;
#if defined(DEBUG_TANGENTS)
    gl_FragColor.stp = normalize(D) * .5 + .5;
    gl_FragColor.q = 1.;
#endif

#if defined(DEBUG_BITANGENTS)
    gl_FragColor.stp = normalize(n) * .5 + .5;
    gl_FragColor.q = 1.;
#endif
    highp vec3 d = v.s * D + v.t * n + v.p * h;
    d = normalize(d);
    return isNaN(d.s) ? h : d;
}
vec3 ApplyNormalMapTerrain(vec3 v, vec3 h)
{
    const vec3 p = vec3(0., 0., 1.);
    vec3 D = cross(p, h), s = cross(D, h);
    return ApplyNormalMap(v, h, D, s);
}

vec3 UnpackCompressedNormal(vec3 U)
{
    vec3 v = vec3(U.ps * 255. / 127. - 1.00787, 0.);
    v.p = sqrt(1. - min(1., dot(v.st, v.st)));
    v.t = -v.t;
    return v;
}
vec3 UnpackNormal(vec3 v, float U)
{
    vec3 t;
#if defined(COMPRESSED_NORMALS)
    t = UnpackCompressedNormal(v);
#else
    t = v.pst * 255. / 127. - 1.00787;
    t.t = -t.t;
#endif
    t.st *= U;
    return t;
}
vec3 UnpackNormal(vec3 U) { return UnpackNormal(U, 1.); }
vec3 UnpackNormal(vec4 v) { return UnpackNormal(v.tpq, 1.); }
vec3 UnpackNormal(vec4 v, float U) { return UnpackNormal(v.tpq, U); }

#if defined(VIEWPORTMAP)
vec3 SampleViewportMapColour(highp vec2 v, highp vec4 e)
{
    v = v * uViewportLookupScale.st;
    vec2 t;
#if defined(OGLES2_BACKEND)
    t = uViewportMapTextureSize.st;
#else
    t = vec2(textureSize(uViewportMap, 0));
#endif
    v.s *= uViewportLookupScale.p * uViewportLookupScale.t / (t.s / t.t);
    v *= e.st;
    highp float u = uTextureAnimationTime;
    v += e.pq * u;
    return texture2DLodCompat(uViewportMap, v, 0.).stp;
}
#endif

#ifndef VOLUMETRIC_FUNCTIONS_INC
#define VOLUMETRIC_FUNCTIONS_INC
#if defined(SUNLIGHT_SHADOWS) && defined(VOLUMETRIC_SCATTERING) && defined(SUNLIGHT_DIRECT_LIGHTING)
#define VOLUMETRIC_SCATTERING_SUPPORTED
uniform vec4 uMieG, uVolumetricScatteringParameters;
#if defined(VOLUMETRIC_GROUND_FOG)
uniform vec4 uGroundFogHeight_Falloff;
#endif
#if defined(VOLUMETRIC_SCATTERING_NOISE)
uniform sampler3D sNoiseTex;
uniform vec4 u3DNoiseFrequency_Strength, u3DNoiseWind_Power;
#endif
uniform float uTime;
float ShadowSample(vec4 u, vec4 v, float s)
{
    int d = int(uMappingParams.q);
    vec4 f;
    int G;
#if defined(CASCADE_SPLIT_SELECTION)
    G = ShadowMapSelectCascadeBySplit(s, uCascadeFrustumViewDepths, uCascadeSplitSelectionFlags);
#if defined(USE_LIGHT_VIEW_PROJ_TEX_MATRIX)
    f = uSunlightViewProjTexMatrix[G] * u;
#else
    f = v * uSunlightProjTexMatScale[G] + uSunlightProjTexMatOffset[G];
#endif

#else

#if defined(USE_LIGHT_VIEW_PROJ_TEX_MATRIX)
    G = ShadowMapSelectCascadeByMap(f, u, uSunlightViewProjTexMatrix, uCascadeMinAtlasExtents);
#else
    G = ShadowMapSelectCascadeByMap(f, v, uSunlightProjTexMatScale, uSunlightProjTexMatOffset, uCascadeMinAtlasExtents);
#endif

#endif
    return G >= d ? 1. : ShadowDepthMapFilter1x1(uSunlightShadowMap, f);
}
float PhaseFunction(float v, vec4 s) { return s.q * (s.s / pow(s.t - s.p * v, 1.5)); }
vec4 GetScatteredInRay(int s, vec3 u, float v, float d, vec4 f)
{
    float G = uSunlightFadeAttenParams.t * 1.4, m = min(G, v);
    vec3 V = uCameraPosition, t = V + u * m;
    vec4 x = uSunlightViewMatrix * vec4(V, 1.), e = uSunlightViewMatrix * vec4(t, 1.), i = uSunlightViewMatrix * vec4(V, 0.), n = uSunlightViewMatrix * vec4(t, 0.);
    vec3 E = vec3(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2]);
    int S = int(uMappingParams.q);
    float q = 0., p = 1. / float(s), N = d * p, h = m * p;
    vec2 r = vec2(0., 0.);
#if defined(VOLUMETRIC_SCATTERING_NOISE)
    vec3 P = vec3(.05 * uTime), a = u3DNoiseWind_Power.stp * uTime;
    const float o = .31;
    float c = u3DNoiseFrequency_Strength.s * o;
    vec3 l = a * u3DNoiseFrequency_Strength.s, T = a * c;
#endif
    for (int X = 0; X < s; ++X)
    {
        vec3 U = mix(V, t, N);
        vec4 I = mix(x, e, N);
#if defined(VOLUMETRIC_SCATTERING_NOISE)
        vec4 M = mix(i, n, N);
        vec3 C = M.sts * vec3(.001) + P, g = M.sts * vec3(.001) - P;
        I.sp += vec2(texture3D(sNoiseTex, g).s, texture3D(sNoiseTex, g).s) * 128. - 64.;
#endif
        float R = 0.;
#if defined(USE_CASCADE_SPLIT_SELECTION)
        vec3 O = U.stp - uCameraPosition;
        R = abs(dot(O, E));
#endif
        float F = ShadowSample(vec4(U, 1.f), I, R), D = 1., w = 1.;
#if defined(VOLUMETRIC_GROUND_FOG)
        if (uGroundFogHeight_Falloff.t != 0.)
        {
            float L = max(0., (U.t - uGroundFogHeight_Falloff.s) * uGroundFogHeight_Falloff.t);
            w = exp(-L) * 100.;
        }
#endif

#if defined(VOLUMETRIC_SCATTERING_NOISE)
        if (u3DNoiseFrequency_Strength.t != 0.)
        {
            vec3 L = U * u3DNoiseFrequency_Strength.s + l;
            float y = float(texture3D(sNoiseTex, L));
            vec3 A = U * c + T;
            float H = float(texture3D(sNoiseTex, A)), W = pow(mix(y, H, .8) + .5, u3DNoiseWind_Power.q);
            w *= max(0, mix(1., W, u3DNoiseFrequency_Strength.t));
        }
#endif
        D += w;
        float L = D * h, W = uVolumetricScatteringParameters.s * L;
        q += uVolumetricScatteringParameters.t * L;
        r += W * exp(-q) * vec2(F, 1. - F);
        N += p;
    }
    if (v > G)
    {
        float L = v - G, U = uVolumetricScatteringParameters.s * L;
        q += uVolumetricScatteringParameters.t * L;
        r += vec2(U * exp(-q), 0.);
    }
    float U = r.s + r.t;
    if (U > 0.)
    {
        float L = r.s / U, g = uVolumetricScatteringParameters.q;
        L = pow(L, g);
        r.st = U * vec2(L, 1. - L);
        r.s = r.s * PhaseFunction(dot(u, uInvSunDirection), f);
    }
    return vec4(r.s, q, r.t, 1.);
}
vec4 GetScatteredInRay2(int s, vec3 u, float v, float f) { return GetScatteredInRay(s, u, v, f, uMieG); }
vec4 GetScatteredInRayLine(int s, vec3 u, float v, vec3 f, float d, float G)
{
    vec4 L = GetScatteredInRay2(s, u, v, G), t = GetScatteredInRay2(s, mix(u, f, .33), mix(v, d, .33), G), m = GetScatteredInRay2(s, mix(u, f, .66), mix(v, d, .66), G), U = GetScatteredInRay2(s, f, d, G);
    return L * .15 + t * .2 + m * .3 + U * .35;
}
#endif
#endif

#ifndef APPLY_VOLUMETRICS_INC
#define APPLY_VOLUMETRICS_INC
#ifndef VOLUMETRIC_FUNCTIONS_INC
#define VOLUMETRIC_FUNCTIONS_INC
#if defined(SUNLIGHT_SHADOWS) && defined(VOLUMETRIC_SCATTERING) && defined(SUNLIGHT_DIRECT_LIGHTING)
#define VOLUMETRIC_SCATTERING_SUPPORTED
uniform vec4 uMieG, uVolumetricScatteringParameters;
#if defined(VOLUMETRIC_GROUND_FOG)
uniform vec4 uGroundFogHeight_Falloff;
#endif
#if defined(VOLUMETRIC_SCATTERING_NOISE)
uniform sampler3D sNoiseTex;
uniform vec4 u3DNoiseFrequency_Strength, u3DNoiseWind_Power;
#endif
uniform float uTime;
float ShadowSample(vec4 u, vec4 v, float s)
{
    int d = int(uMappingParams.q);
    vec4 f;
    int G;
#if defined(CASCADE_SPLIT_SELECTION)
    G = ShadowMapSelectCascadeBySplit(s, uCascadeFrustumViewDepths, uCascadeSplitSelectionFlags);
#if defined(USE_LIGHT_VIEW_PROJ_TEX_MATRIX)
    f = uSunlightViewProjTexMatrix[G] * u;
#else
    f = v * uSunlightProjTexMatScale[G] + uSunlightProjTexMatOffset[G];
#endif

#else

#if defined(USE_LIGHT_VIEW_PROJ_TEX_MATRIX)
    G = ShadowMapSelectCascadeByMap(f, u, uSunlightViewProjTexMatrix, uCascadeMinAtlasExtents);
#else
    G = ShadowMapSelectCascadeByMap(f, v, uSunlightProjTexMatScale, uSunlightProjTexMatOffset, uCascadeMinAtlasExtents);
#endif

#endif
    return G >= d ? 1. : ShadowDepthMapFilter1x1(uSunlightShadowMap, f);
}
float PhaseFunction(float v, vec4 s) { return s.q * (s.s / pow(s.t - s.p * v, 1.5)); }
vec4 GetScatteredInRay(int s, vec3 u, float v, float d, vec4 f)
{
    float G = uSunlightFadeAttenParams.t * 1.4, m = min(G, v);
    vec3 V = uCameraPosition, t = V + u * m;
    vec4 x = uSunlightViewMatrix * vec4(V, 1.), e = uSunlightViewMatrix * vec4(t, 1.), i = uSunlightViewMatrix * vec4(V, 0.), n = uSunlightViewMatrix * vec4(t, 0.);
    vec3 E = vec3(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2]);
    int S = int(uMappingParams.q);
    float q = 0., p = 1. / float(s), N = d * p, h = m * p;
    vec2 r = vec2(0., 0.);
#if defined(VOLUMETRIC_SCATTERING_NOISE)
    vec3 P = vec3(.05 * uTime), a = u3DNoiseWind_Power.stp * uTime;
    const float o = .31;
    float c = u3DNoiseFrequency_Strength.s * o;
    vec3 l = a * u3DNoiseFrequency_Strength.s, T = a * c;
#endif
    for (int X = 0; X < s; ++X)
    {
        vec3 U = mix(V, t, N);
        vec4 I = mix(x, e, N);
#if defined(VOLUMETRIC_SCATTERING_NOISE)
        vec4 M = mix(i, n, N);
        vec3 C = M.sts * vec3(.001) + P, g = M.sts * vec3(.001) - P;
        I.sp += vec2(texture3D(sNoiseTex, g).s, texture3D(sNoiseTex, g).s) * 128. - 64.;
#endif
        float R = 0.;
#if defined(USE_CASCADE_SPLIT_SELECTION)
        vec3 O = U.stp - uCameraPosition;
        R = abs(dot(O, E));
#endif
        float F = ShadowSample(vec4(U, 1.f), I, R), D = 1., w = 1.;
#if defined(VOLUMETRIC_GROUND_FOG)
        if (uGroundFogHeight_Falloff.t != 0.)
        {
            float L = max(0., (U.t - uGroundFogHeight_Falloff.s) * uGroundFogHeight_Falloff.t);
            w = exp(-L) * 100.;
        }
#endif

#if defined(VOLUMETRIC_SCATTERING_NOISE)
        if (u3DNoiseFrequency_Strength.t != 0.)
        {
            vec3 L = U * u3DNoiseFrequency_Strength.s + l;
            float y = float(texture3D(sNoiseTex, L));
            vec3 A = U * c + T;
            float H = float(texture3D(sNoiseTex, A)), W = pow(mix(y, H, .8) + .5, u3DNoiseWind_Power.q);
            w *= max(0, mix(1., W, u3DNoiseFrequency_Strength.t));
        }
#endif
        D += w;
        float L = D * h, W = uVolumetricScatteringParameters.s * L;
        q += uVolumetricScatteringParameters.t * L;
        r += W * exp(-q) * vec2(F, 1. - F);
        N += p;
    }
    if (v > G)
    {
        float L = v - G, U = uVolumetricScatteringParameters.s * L;
        q += uVolumetricScatteringParameters.t * L;
        r += vec2(U * exp(-q), 0.);
    }
    float U = r.s + r.t;
    if (U > 0.)
    {
        float L = r.s / U, g = uVolumetricScatteringParameters.q;
        L = pow(L, g);
        r.st = U * vec2(L, 1. - L);
        r.s = r.s * PhaseFunction(dot(u, uInvSunDirection), f);
    }
    return vec4(r.s, q, r.t, 1.);
}
vec4 GetScatteredInRay2(int s, vec3 u, float v, float f) { return GetScatteredInRay(s, u, v, f, uMieG); }
vec4 GetScatteredInRayLine(int s, vec3 u, float v, vec3 f, float d, float G)
{
    vec4 L = GetScatteredInRay2(s, u, v, G), t = GetScatteredInRay2(s, mix(u, f, .33), mix(v, d, .33), G), m = GetScatteredInRay2(s, mix(u, f, .66), mix(v, d, .66), G), U = GetScatteredInRay2(s, f, d, G);
    return L * .15 + t * .2 + m * .3 + U * .35;
}
#endif
#endif

#if defined(VOLUMETRIC_SCATTERING) && defined(SUNLIGHT_DIRECT_LIGHTING)
uniform vec3 uVolumetricLitFogColour, uVolumetricUnlitFogColour;
uniform mat4 uVolumetricDitherMat;
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

void GetInAndOutScattering(vec4 v, out vec3 u, out vec3 G)
{
    vec3 A = uSunColour * uVolumetricLitFogColour, o = uAmbientColour * uVolumetricUnlitFogColour;
    u = vec3(exp(-v.t));
    G = v.s * A + v.p * o;
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

vec4 ApplyVolumetricScattering(vec4 v, vec4 u)
{
    vec3 A = vec3(1.), o = vec3(0.);
    GetInAndOutScattering(u, A, o);
    return vec4(v.stp * A + o, v.q);
}
float CalculateScatteringOffset(vec2 v)
{
    vec2 u = vec2(floor(mod(v.st, 4.)));
    return uVolumetricDitherMat[int(u.s)][int(u.t)];
}
#endif
#endif

#ifndef LIGHTING_UTILS_H
#define LIGHTING_UTILS_H
#ifndef LIGHTING_INC
#define LIGHTING_INC
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

#ifndef FRESNEL_INC
#define FRESNEL_INC
vec3 FresnelSchlick(vec3 F, float f, highp float h)
{
    vec3 c = F + (1. - F) * pow(1. - f, h);
    return c;
}
vec3 FresnelSchlickRoughness(vec3 f, float F, highp float h, float v)
{
    vec3 c = f + (max(vec3(v), f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(float F, float f, highp float h)
{
    float c = F + (1. - F) * pow(1. - f, h);
    return c;
}
float FresnelSchlickRoughness(float f, float F, highp float h, float v)
{
    float c = f + (max(v, f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(vec3 F, vec3 f, float c)
{
    float h = max(0., dot(F, f));
    return c + (1. - c) * pow(1. - h, 5.);
}
float Fresnel(vec3 F, vec3 f, float c, float h)
{
    float p = 1. - max(0., dot(F, f)), v = p * p;
    v = v * v;
    v = v * p;
    return clamp(v * (1. - clamp(h, 0., 1.)) + h - c, 0., 1.);
}
#endif

#ifndef BRDF_INC
#define BRDF_INC
#ifndef NDF_INC
#define NDF_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float BlinnPhongNDF(float f, float N)
{
    return (f + 2.) * INV_EIGHT * pow(N, f);
}
float GGXTrowbridgeReitzNDF(float N, float f)
{
    float P = N * N, I = f * f, T = I * (P - 1.) + 1.;
    return P / (PI * (T * T + .0001));
}
float BeckmannNDF(float N, float f)
{
    float P = N * N, I = f * f;
    return exp((I - 1.) / (P * I)) / (PI * P * (I * I));
}
#endif

#ifndef VISIBILITY_FUNC_INC
#define VISIBILITY_FUNC_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float SchlickSmithVis(float V, float f, float S)
{
    float P = 1. / sqrt(PI_OVER_4 * V + PI_OVER_2), d = 1. - P, v = (f * d + P) * (S * d + P);
    return 1. / (v + .0001);
}
float KelemenSzirmayKalosVis(vec3 V, vec3 P)
{
    vec3 f = V + P;
    return 4. / max(0., dot(f, f));
}
#endif

#define GGX_NDF
#define SCHLICK_SMITH_VIS
vec3 CookTorranceBRDF(float d, float S, vec3 n, vec3 v, vec3 f, vec3 B, vec3 R, float F)
{
    float m = max(0., dot(v, f)), r = 1.;
#if defined(BLINN_PHONG_NDF)
    r = BlinnPhongNDF(d, m);
#elif defined(GGX_NDF)
    r = GGXTrowbridgeReitzNDF(PerceptualRoughnessToRoughness(S), m);
#elif defined(BECKMANN_NDF)
    r = max(0.f, BeckmannNDF(SpecPowToBeckmannRoughness(d), m));
#else

#error CookTorranceBRDF normal distribution function not specified

#endif
    float C = 1.;
#if defined(SCHLICK_SMITH_VIS)
    C = SchlickSmithVis(d, F, max(0., dot(v, B)));
#elif defined(KELEMEN_SZIRMAY_KALOS_VIS)
    C = KelemenSzirmayKalosVis(R, B);
#endif
    return n * (r * C);
}
float RunescapeLegacyBRDF(vec3 d, vec3 v, vec3 f, float B, float S)
{
    vec3 n = reflect(-d, f);
    float C = pow(max(0., dot(n, v)), B);
    return C * S;
}
float RunescapeRT5BRDF(vec3 d, vec3 v, float S) { return BlinnPhongNDF(S, max(0., dot(d, v))); }
vec3 ShiftTangent(vec3 d, vec3 S, float B) { return normalize(d + B * S); }
vec3 AnisotropicBRDF(vec3 v, vec3 d, vec3 S, vec3 f, vec3 B, float n, float m, float R, float C)
{
    const float F = 7.5, r = 1., e = .5, o = 1.;
    float s = R - .5;
    S = ShiftTangent(S, d, e + (C * 2. - 1.) * o + s);
    float p = abs(dot(S, f)), a = 1. - p, t = 1. - abs(dot(S, B)), K = p * dot(d, B);
    K += a * t;
    K = pow(K, F) * n;
    K = mix(K, K * C, o);
    float G = pow(dot(d, v), m), P = mix(G, K, r);
    return vec3(P, P, P);
}
#endif

struct LightingTerms
{
    vec3 Diffuse;
    vec3 Specular;
};
void ClearLightingTerms(inout LightingTerms v) { v.Diffuse = vec3(0., 0., 0.), v.Specular = vec3(0., 0., 0.); }
void AddLightingTerms(inout LightingTerms v, LightingTerms L) { v.Diffuse += L.Diffuse, v.Specular += L.Specular; }
void EvaluateDirLightRT5(inout LightingTerms v, vec3 f, vec3 L, vec3 d, vec3 i, float S, float c, float F, float e, float E, vec3 A)
{
    v.Diffuse += A * e;
#if defined(SPECULAR_LIGHTING)
    vec3 G = normalize(d + i);
    float r = FresnelSchlick(S, clamp(dot(i, G), 0., 1.), F);
#if defined(ANISOTROPY_BRDF)
    vec3 D = AnisotropicBRDF(G, f, L, i, d, E, c, .5, .5);
#else
    vec3 n = vec3(r) * vec3(RunescapeRT5BRDF(G, f, c));
#endif
    n *= A * e;
    v.Specular += n;
#endif
}
void EvaluateDirLightRT7(inout LightingTerms v, vec3 f, vec3 L, vec3 d, vec3 i, vec3 S, float c, float E, float G, float e, float F, vec3 A)
{
    v.Diffuse += A * e;
#if defined(SPECULAR_LIGHTING)
    vec3 r = normalize(d + i), n = FresnelSchlick(S, clamp(dot(i, r), 0., 1.), G);
#if defined(ANISOTROPY_BRDF)
    vec3 D = AnisotropicBRDF(r, f, L, i, d, F, c, .5, .5);
#else
    vec3 C = CookTorranceBRDF(c, E, n, f, r, d, i, F);
#endif
    C *= A * e;
    v.Specular += C;
#endif
}
float SpecularHorizonOcclusion(float L, vec3 i, vec3 v)
{
    vec3 d = reflect(i, v);
    float A = clamp(1. + L * dot(d, v), 0., 1.);
    A *= A;
    return A;
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#endif

#if !defined(DEFERRED_SHADOWS)
LightingTerms EvaluateSunlightRT5(inout int i, inout float E, highp vec4 v, vec3 u, vec3 f, float d, vec3 n, float p, float S, float r)
{
    float t = max(0., dot(u, uInvSunDirection)), L = t;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS)
    if (S == 0. && uMappingParams.p != 0.)
    {
        if (L > 0.)
        {
            highp vec4 h = uSunlightViewMatrix * v, e = vec4(u.st, 0., 0.) * 32.;
            E = DirLightShadowAtten(i, v + e, h + e, d, uSunlightShadowMap, uSunlightShadowTranslucencyMap, r);
        }
    }
#endif
    L *= E;
    float h = .65;
    LightingTerms D;
    ClearLightingTerms(D);
    EvaluateDirLightRT5(D, u, f, n, uInvSunDirection, h, p, 5., L, t, uSunColour);
    return D;
}
#else
LightingTerms EvaluateSunlightRT5(inout float E, vec3 u, vec3 v, vec3 f, vec2 d, float n, float S)
{
    float t = max(0., dot(u, uInvSunDirection)), L = t;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS) && defined(DEFERRED_SHADOWS)
    if (S == 0. && uMappingParams.p != 0.)
        E = texture2DLod(uShadowBuffer, d, 0.).s;
#endif
    L *= E;
    float h = .65;
    LightingTerms D;
    ClearLightingTerms(D);
    EvaluateDirLightRT5(D, u, v, f, uInvSunDirection, h, n, 5., L, uSunColour);
    return D;
}
#endif
#if !defined(DEFERRED_SHADOWS)
LightingTerms EvaluateSunlightRT7(inout int u, inout float E, highp vec4 v, vec3 f, vec3 d, float n, vec3 h, vec3 L, float p, float i, float t, float S)
{
    float D = max(0., dot(f, uInvSunDirection)), e = D;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS)
    if (uMappingParams.p != 0.)
    {
        if (D > 0.)
        {
            highp vec4 r = uSunlightViewMatrix * v, a = vec4(f.st, 0., 0.) * 32.;
            E = DirLightShadowAtten(u, v + a, r + a, n, uSunlightShadowMap, uSunlightShadowTranslucencyMap, S);
        }
    }
#endif
    e *= E;
    LightingTerms r;
    ClearLightingTerms(r);
    EvaluateDirLightRT7(r, f, d, h, uInvSunDirection, L, p, i, t, e, D, uSunColour);
    return r;
}
#else
LightingTerms EvaluateSunlightRT7(inout float E, vec3 u, vec3 v, vec3 f, vec2 d, vec3 n, float h, float L, float r)
{
    float t = max(0., dot(u, uInvSunDirection)), p = t;
    E = 1.;
#if defined(SUNLIGHT_SHADOWS) && defined(DEFERRED_SHADOWS)
    if (uMappingParams.p != 0.)
        E = texture2DLod(uShadowBuffer, d, 0.).s;
#endif
    LightingTerms D;
    ClearLightingTerms(D);
    EvaluateDirLightRT7(D, u, v, f, uInvSunDirection, n, h, L, r, t, p, uSunColour);
    return D;
}
#endif
#endif

#ifndef STIPPLE_TRANSPARENCY_UTILS_INC
#define STIPPLE_TRANSPARENCY_UTILS_INC
#if defined(STIPPLE_TRANSPARENCY_CLIP_NEAR) || defined(STIPPLE_TRANSPARENCY_CLIP_FAR) || defined(STIPPLE_TRANSPARENCY_ALPHA)
#ifndef STIPPLE_COMMON_INC
#define STIPPLE_COMMON_INC
highp float GetStippleViewSpaceDepthFromPos(vec3 S)
{
    vec3 u = vec3(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2]);
    return dot(S, u);
}
#endif

#ifndef NOISE_UTILS_INC
#define NOISE_UTILS_INC
vec4 permute(vec4 t)
{
    return mod((t * 34. + 1.) * t, 289.);
}
vec2 fade(vec2 t) { return t * t * t * (t * (t * 6. - 15.) + 10.); }
float cnoise(highp vec2 t)
{
    highp vec4 v = floor(t.stst) + vec4(0., 0., 1., 1.), d = fract(t.stst) - vec4(0., 0., 1., 1.);
    v = mod(v, 289.);
    vec4 p = v.spsp, s = v.ttqq, h = d.spsp, e = d.ttqq, f = permute(permute(p) + s), m = 2. * fract(f * .0243902) - 1., c = abs(m) - .5, q = floor(m + .5);
    m = m - q;
    vec2 N = vec2(m.s, c.s), r = vec2(m.t, c.t), o = vec2(m.p, c.p), a = vec2(m.q, c.q);
    vec4 G = 1.79284 - .853735 * vec4(dot(N, N), dot(o, o), dot(r, r), dot(a, a));
    N *= G.s;
    o *= G.t;
    r *= G.p;
    a *= G.q;
    float i = dot(N, vec2(h.s, e.s)), n = dot(r, vec2(h.t, e.t)), l = dot(o, vec2(h.p, e.p)), I = dot(a, vec2(h.q, e.q));
    vec2 u = fade(d.st), S = mix(vec2(i, l), vec2(n, I), u.s);
    float g = mix(S.s, S.t, u.t);
    return 2.3 * g;
}
highp float GetInterleavedGradientNoise(highp vec2 t) { return clamp(fract(52.9829 * fract(.0671106 * t.s + .00583715 * t.t)), 0., .999); }
#endif

#define STIPPLE_TRANSPARENCY_ENABLED
#if defined(STIPPLE_TRANSPARENCY_CLIP_NEAR) || defined(STIPPLE_TRANSPARENCY_CLIP_FAR)
uniform vec4 uStippleTransparencyClipParams;
#endif
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

float GetStippleTransparencyAlpha(float S, inout float R)
{
    float f = 1.;
#if defined(STIPPLE_TRANSPARENCY_CLIP_NEAR)
    float d = (S - (uZBufferParams.q + uStippleTransparencyClipParams.s)) * uStippleTransparencyClipParams.t;
    f *= clamp(d, 0., 1.);
#endif

#if defined(STIPPLE_TRANSPARENCY_CLIP_FAR)
    float u = 1. - (S - (abs(uZBufferParams.p) - uStippleTransparencyClipParams.p)) * uStippleTransparencyClipParams.q;
    f *= clamp(u, 0., 1.);
#endif

#if defined(STIPPLE_TRANSPARENCY_ALPHA)
    f *= clamp(R + .005, 0., 1.);
    R = 1.;
#endif
    return f;
}
bool IsStipplePixelVisible(highp vec3 S, highp vec2 R, inout float d)
{
    float u = GetStippleViewSpaceDepthFromPos(S);
    return GetStippleTransparencyAlpha(u, d) > GetInterleavedGradientNoise(R);
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#endif
#endif

#ifndef STIPPLE_CUTOUT_UTILS_INC
#define STIPPLE_CUTOUT_UTILS_INC
#if defined(STIPPLE_TRANSPARENCY_CUTOUT)
#ifndef STIPPLE_COMMON_INC
#define STIPPLE_COMMON_INC
highp float GetStippleViewSpaceDepthFromPos(vec3 S)
{
    vec3 u = vec3(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2]);
    return dot(S, u);
}
#endif

#ifndef NOISE_UTILS_INC
#define NOISE_UTILS_INC
vec4 permute(vec4 t)
{
    return mod((t * 34. + 1.) * t, 289.);
}
vec2 fade(vec2 t) { return t * t * t * (t * (t * 6. - 15.) + 10.); }
float cnoise(highp vec2 t)
{
    highp vec4 v = floor(t.stst) + vec4(0., 0., 1., 1.), d = fract(t.stst) - vec4(0., 0., 1., 1.);
    v = mod(v, 289.);
    vec4 p = v.spsp, s = v.ttqq, h = d.spsp, e = d.ttqq, f = permute(permute(p) + s), m = 2. * fract(f * .0243902) - 1., c = abs(m) - .5, q = floor(m + .5);
    m = m - q;
    vec2 N = vec2(m.s, c.s), r = vec2(m.t, c.t), o = vec2(m.p, c.p), a = vec2(m.q, c.q);
    vec4 G = 1.79284 - .853735 * vec4(dot(N, N), dot(o, o), dot(r, r), dot(a, a));
    N *= G.s;
    o *= G.t;
    r *= G.p;
    a *= G.q;
    float i = dot(N, vec2(h.s, e.s)), n = dot(r, vec2(h.t, e.t)), l = dot(o, vec2(h.p, e.p)), I = dot(a, vec2(h.q, e.q));
    vec2 u = fade(d.st), S = mix(vec2(i, l), vec2(n, I), u.s);
    float g = mix(S.s, S.t, u.t);
    return 2.3 * g;
}
highp float GetInterleavedGradientNoise(highp vec2 t) { return clamp(fract(52.9829 * fract(.0671106 * t.s + .00583715 * t.t)), 0., .999); }
#endif

#define STIPPLE_CUTOUT_STIPPLED_ALPHA_MULTIPLIER 2.0
float GetStippleCutoutAdjustedAlpha(vec3 S, vec2 u, float G)
{
    float v = uStippleCutoutPosDepthVisibility.p, p = GetStippleViewSpaceDepthFromPos(S);
    const float T = 500., f = 500., t = 1. / f;
    float i = 0.f;
    if (p < v + T)
    {
        float l = abs(p - (v + T));
        l = clamp(l * t, 0., 1.);
        vec2 c = u * 2. - vec2(1.), a = c - uStippleCutoutPosDepthVisibility.st;
        a = a;
        float d = uProjectionMatrix[1][1] / uProjectionMatrix[0][0];
        a.s *= d;
        float I = uStippleCutoutPosDepthVisibility.q, R = uStippleCutoutStartRangeAndMinAlpha.s, s = uStippleCutoutStartRangeAndMinAlpha.t, e = uStippleCutoutStartRangeAndMinAlpha.p, o = clamp((length(a) - R) * s, 0., 1.);
        i = mix(pow(l * (1. - o), 2.), 0., I) - e;
    }
    return i;
}
bool IsStippleCutoutVisible(vec3 S, vec2 v, vec2 l) { return GetStippleCutoutAdjustedAlpha(S, v, STIPPLE_CUTOUT_STIPPLED_ALPHA_MULTIPLIER) > GetInterleavedGradientNoise(l); }
#endif
#endif

#ifndef FRESNEL_INC
#define FRESNEL_INC
vec3 FresnelSchlick(vec3 F, float f, highp float h)
{
    vec3 c = F + (1. - F) * pow(1. - f, h);
    return c;
}
vec3 FresnelSchlickRoughness(vec3 f, float F, highp float h, float v)
{
    vec3 c = f + (max(vec3(v), f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(float F, float f, highp float h)
{
    float c = F + (1. - F) * pow(1. - f, h);
    return c;
}
float FresnelSchlickRoughness(float f, float F, highp float h, float v)
{
    float c = f + (max(v, f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(vec3 F, vec3 f, float c)
{
    float h = max(0., dot(F, f));
    return c + (1. - c) * pow(1. - h, 5.);
}
float Fresnel(vec3 F, vec3 f, float c, float h)
{
    float p = 1. - max(0., dot(F, f)), v = p * p;
    v = v * v;
    v = v * p;
    return clamp(v * (1. - clamp(h, 0., 1.)) + h - c, 0., 1.);
}
#endif

#ifndef LIGHTING_INC
#define LIGHTING_INC
#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

#ifndef FRESNEL_INC
#define FRESNEL_INC
vec3 FresnelSchlick(vec3 F, float f, highp float h)
{
    vec3 c = F + (1. - F) * pow(1. - f, h);
    return c;
}
vec3 FresnelSchlickRoughness(vec3 f, float F, highp float h, float v)
{
    vec3 c = f + (max(vec3(v), f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(float F, float f, highp float h)
{
    float c = F + (1. - F) * pow(1. - f, h);
    return c;
}
float FresnelSchlickRoughness(float f, float F, highp float h, float v)
{
    float c = f + (max(v, f) - f) * pow(1. - F, h);
    return c;
}
float FresnelSchlick(vec3 F, vec3 f, float c)
{
    float h = max(0., dot(F, f));
    return c + (1. - c) * pow(1. - h, 5.);
}
float Fresnel(vec3 F, vec3 f, float c, float h)
{
    float p = 1. - max(0., dot(F, f)), v = p * p;
    v = v * v;
    v = v * p;
    return clamp(v * (1. - clamp(h, 0., 1.)) + h - c, 0., 1.);
}
#endif

#ifndef BRDF_INC
#define BRDF_INC
#ifndef NDF_INC
#define NDF_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float BlinnPhongNDF(float f, float N)
{
    return (f + 2.) * INV_EIGHT * pow(N, f);
}
float GGXTrowbridgeReitzNDF(float N, float f)
{
    float P = N * N, I = f * f, T = I * (P - 1.) + 1.;
    return P / (PI * (T * T + .0001));
}
float BeckmannNDF(float N, float f)
{
    float P = N * N, I = f * f;
    return exp((I - 1.) / (P * I)) / (PI * P * (I * I));
}
#endif

#ifndef VISIBILITY_FUNC_INC
#define VISIBILITY_FUNC_INC
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif

float SchlickSmithVis(float V, float f, float S)
{
    float P = 1. / sqrt(PI_OVER_4 * V + PI_OVER_2), d = 1. - P, v = (f * d + P) * (S * d + P);
    return 1. / (v + .0001);
}
float KelemenSzirmayKalosVis(vec3 V, vec3 P)
{
    vec3 f = V + P;
    return 4. / max(0., dot(f, f));
}
#endif

#define GGX_NDF
#define SCHLICK_SMITH_VIS
vec3 CookTorranceBRDF(float d, float S, vec3 n, vec3 v, vec3 f, vec3 B, vec3 R, float F)
{
    float m = max(0., dot(v, f)), r = 1.;
#if defined(BLINN_PHONG_NDF)
    r = BlinnPhongNDF(d, m);
#elif defined(GGX_NDF)
    r = GGXTrowbridgeReitzNDF(PerceptualRoughnessToRoughness(S), m);
#elif defined(BECKMANN_NDF)
    r = max(0.f, BeckmannNDF(SpecPowToBeckmannRoughness(d), m));
#else

#error CookTorranceBRDF normal distribution function not specified

#endif
    float C = 1.;
#if defined(SCHLICK_SMITH_VIS)
    C = SchlickSmithVis(d, F, max(0., dot(v, B)));
#elif defined(KELEMEN_SZIRMAY_KALOS_VIS)
    C = KelemenSzirmayKalosVis(R, B);
#endif
    return n * (r * C);
}
float RunescapeLegacyBRDF(vec3 d, vec3 v, vec3 f, float B, float S)
{
    vec3 n = reflect(-d, f);
    float C = pow(max(0., dot(n, v)), B);
    return C * S;
}
float RunescapeRT5BRDF(vec3 d, vec3 v, float S) { return BlinnPhongNDF(S, max(0., dot(d, v))); }
vec3 ShiftTangent(vec3 d, vec3 S, float B) { return normalize(d + B * S); }
vec3 AnisotropicBRDF(vec3 v, vec3 d, vec3 S, vec3 f, vec3 B, float n, float m, float R, float C)
{
    const float F = 7.5, r = 1., e = .5, o = 1.;
    float s = R - .5;
    S = ShiftTangent(S, d, e + (C * 2. - 1.) * o + s);
    float p = abs(dot(S, f)), a = 1. - p, t = 1. - abs(dot(S, B)), K = p * dot(d, B);
    K += a * t;
    K = pow(K, F) * n;
    K = mix(K, K * C, o);
    float G = pow(dot(d, v), m), P = mix(G, K, r);
    return vec3(P, P, P);
}
#endif

struct LightingTerms
{
    vec3 Diffuse;
    vec3 Specular;
};
void ClearLightingTerms(inout LightingTerms v) { v.Diffuse = vec3(0., 0., 0.), v.Specular = vec3(0., 0., 0.); }
void AddLightingTerms(inout LightingTerms v, LightingTerms L) { v.Diffuse += L.Diffuse, v.Specular += L.Specular; }
void EvaluateDirLightRT5(inout LightingTerms v, vec3 f, vec3 L, vec3 d, vec3 i, float S, float c, float F, float e, float E, vec3 A)
{
    v.Diffuse += A * e;
#if defined(SPECULAR_LIGHTING)
    vec3 G = normalize(d + i);
    float r = FresnelSchlick(S, clamp(dot(i, G), 0., 1.), F);
#if defined(ANISOTROPY_BRDF)
    vec3 D = AnisotropicBRDF(G, f, L, i, d, E, c, .5, .5);
#else
    vec3 n = vec3(r) * vec3(RunescapeRT5BRDF(G, f, c));
#endif
    n *= A * e;
    v.Specular += n;
#endif
}
void EvaluateDirLightRT7(inout LightingTerms v, vec3 f, vec3 L, vec3 d, vec3 i, vec3 S, float c, float E, float G, float e, float F, vec3 A)
{
    v.Diffuse += A * e;
#if defined(SPECULAR_LIGHTING)
    vec3 r = normalize(d + i), n = FresnelSchlick(S, clamp(dot(i, r), 0., 1.), G);
#if defined(ANISOTROPY_BRDF)
    vec3 D = AnisotropicBRDF(r, f, L, i, d, F, c, .5, .5);
#else
    vec3 C = CookTorranceBRDF(c, E, n, f, r, d, i, F);
#endif
    C *= A * e;
    v.Specular += C;
#endif
}
float SpecularHorizonOcclusion(float L, vec3 i, vec3 v)
{
    vec3 d = reflect(i, v);
    float A = clamp(1. + L * dot(d, v), 0., 1.);
    A *= A;
    return A;
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

#endif

void main()
{
#if defined(DEBUG_VERTEX_BONE_COLOUR)
    gl_FragColor = vec4(vVertexAlbedo);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(ALPHA_ENABLED)
    if (vVertexAlbedo.q == 0.)
    {
        discard;
    }
#endif
    highp vec4 d = vec4(vWorldPosition.stp, 1.);
#if defined(CLIP_PLANE) && !defined(PUSH_TO_FARPLANE)
    if (dot(d, uClipPlane) < 0.)
    {
        discard;
        return;
    }
#endif

#if defined(TEXTURE_ATLAS)
    TextureSettings D;
    getTextureSettings(vMaterialSettingsSlotXY_BatchFlags.st, D);
#endif
    highp vec2 v = vec2(0.), p = vec2(0.);
    highp vec3 r = vec3(0.), q = vec3(0.);
    vec4 u = vec4(1.), s;
#if defined(COMPRESSED_NORMALS)
    s = vec4(0., .5, 0., .5);
#else
    s = vec4(0., .5, 1., .5);
#endif
    highp vec3 S = d.stp - uCameraPosition;
#if defined(TEXTURE_ATLAS)
    highp float G = uTextureAnimationTime;
    vec2 t = vTextureUV + fract(D.uvAnim * G);
    CalculateDerivatives(v, p, r, q, t, S);
    SampleTextures(u, s, t, D, vMaterialSettingsSlotXY_BatchFlags.p, v, p);
#endif
    float i = 1., g = 0., C = 0.;
    vec3 n = step(.5, fract(vMaterialSettingsSlotXY_BatchFlags.p * vec3(64., 32., 16.)));
#if !defined(TEXTURE_ALBEDO_GLOBAL)
    n.sp *= step(.5, fract(vMaterialSettingsSlotXY_BatchFlags.p * 8.));
#endif
    i += n.s * u.q * 4.;
    g = n.t;
    C = n.p * u.q;
    u.q = min(u.q + n.s + n.p, 1.);
    vec4 f = u * vVertexAlbedo;
#if defined(DEBUG_GEOMETRY_INSTANCE_COLOUR)
    gl_FragColor = vec4(uDebugInstanceColour.stp, f.q);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(ALPHA_ENABLED)
    if (f.q <= uAlphaTestThreshold)
    {
        discard;
    }
#endif

#if defined(STIPPLE_TRANSPARENCY_CUTOUT) && defined(VIEWPORTLOOKUPSCALE)
    if (fract(vMaterialSettingsSlotXY_BatchFlags.p * 4.) > .5)
    {
#if defined(ALPHA_ENABLED)
        if (uAlphaTestThreshold > .01)
        {
            if (IsStippleCutoutVisible(S, gl_FragCoord.st * uViewportLookupScale.st, gl_FragCoord.st))
            {
                discard;
            }
        }
        else
            f.q *= 1.f - GetStippleCutoutAdjustedAlpha(S, gl_FragCoord.st * uViewportLookupScale.st, 1.);
#else
        if (IsStippleCutoutVisible(S, gl_FragCoord.st * uViewportLookupScale.st, gl_FragCoord.st))
        {
            discard;
        }
#endif
    }
#endif

#if defined(STIPPLE_TRANSPARENCY_ENABLED)
    if (!IsStipplePixelVisible(S, gl_FragCoord.st, f.q))
    {
        discard;
    }
#endif

#if defined(GOURAUD_SHADING)
    gl_FragColor = f;
    return;
#endif
    highp vec3 e = normalize(vNormal), T = vec3(0., 1., 0.), P = vec3(0., 1., 0.);
#if defined(PER_FRAGMENT_TANGENTS)
    ComputeTangentBitangentFromDerivatives(T, P, e, r, q, v, p);
#endif

#if defined(USE_NORMAL_MAP)

#if !defined(PER_FRAGMENT_TANGENTS)
    T = normalize(vTangent.stp);
    P = ComputeBitangent(e, vTangent);
#endif
    vec3 A = UnpackNormal(s.tpq, D.normalScale);
    e = ApplyNormalMap(A, e, T, P);
#endif

#if defined(DEBUG_TANGENTS) || defined(DEBUG_BITANGENTS)

#if defined(DEBUG_TANGENTS)
    gl_FragColor.stp = normalize(T) * .5 + .5;
    gl_FragColor.q = 1.;
#endif

#if defined(DEBUG_BITANGENTS)
    gl_FragColor.stp = normalize(P) * .5 + .5;
    gl_FragColor.q = 1.;
#endif
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(VIEWPORTMAP)
    f.stp = SampleViewportMapColour(gl_FragCoord.st, D.viewportMapUVScaleAndAnim);
#endif

#if defined(DEBUG_TEXEL_DENSITY)

#if defined(TEXTURE_ATLAS)
    gl_FragColor = vec4(GetTexelDensityDebugColour(vTextureUV, D.textureMeta1.p, S), 1.);
#else
    gl_FragColor = vec4(1.);
#endif
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(VIEWPORTLOOKUPSCALE)
    vec2 E = gl_FragCoord.st * uFullScreenLookupScale.st;
#endif
    float h = 1.;
#if defined(SSAO) && !defined(REFRACTION)
    h = texture2D(uSSAOMap, E).s;
#endif
    LightingTerms m;
    ClearLightingTerms(m);
    m.Diffuse = uAmbientColour;
    vec3 l = vec3(1., 1., 1.);
#if defined(IRRADIANCE_LIGHTING)
    l = EvaluateSHLighting2ndOrder(e, uIrradianceSHCoefs);
    m.Diffuse *= l;
#endif

#if defined(SSAO)
    m.Diffuse *= h;
#endif
    highp float V = length(S);
    highp vec3 a = S / V;
    LightingTerms R;
    ClearLightingTerms(R);
#if defined(SUNLIGHT_DIRECT_LIGHTING)
    int I = -1;
    float F = 0.;
#if defined(DEFERRED_SHADOWS)
    R = EvaluateSunlightRT5(F, e, P, -a, E, D.specular, g);
#else
    highp vec3 O = vec3(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2]);
    highp float o = abs(dot(S, O));
    float L = step(.5, fract(vMaterialSettingsSlotXY_BatchFlags.p * 2.));
    R = EvaluateSunlightRT5(I, F, d, e, P, o, -a, D.specular, g, L);
#endif

#else
    R.Diffuse = vec3(1.);
#endif

#if defined(TEXTURE_ATLAS) && defined(DEBUG_MATERIAL_HIGHLIGHT)
    if (uDebugMaterialHighlight != -1.)
    {
        float c = mix(.1, .5, length(R.Diffuse)), N = .1;
        vec3 U = mix(vec3(N) * c, vec3(0, 1, 0), D.materialID == uDebugMaterialHighlight ? 1 : 0);
        gl_FragColor = vec4(U, 1);
        if (uDebugReturn != 0.)
        {
            return;
        }
    }
#endif
    float N = FresnelSchlick(.8, max(0., dot(-a, e)), 5.);
#if defined(TEXTURE_ATLAS) && defined(GLOBAL_ENVIRONMENTMAPPING)
    if (C > 0.)
    {
        vec3 c = reflect(-a, e);
        c.s = -c.s;
        c.t = -c.t;
        m.Specular = textureCubeSRGB(uGlobalEnvironmentMap, c).stp * h;
#if defined(NORMALIZED_ENVIRONMENTMAPPING)
        m.Specular *= l * uGlobalEnvironmentMappingParams.q;
#endif
        f.stp = mix(f.stp, m.Specular, C * N);
    }
#endif
    vec4 c = vec4(0., 0., 0., f.q);
#if defined(POINT_LIGHTING)
    vec3 U = vec3(0., 0., 0.), M = vec3(0., 0., 0.);
    const vec3 B = vec3(.65, .65, .65);
    const float H = 1., b = 5.;
    EvaluatePointLights(U, M, B, D.specular, H, b, -a, vWorldPosition.stp, e, o, vTilePosition);
#if defined(DEBUG_POINTLIGHTS)
    gl_FragColor = vec4(U, f.q);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(DEBUG_POINTLIGHTS_SPECULAR)
    gl_FragColor = vec4(M, f.q);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(DIFFUSE_LIGHTING)
    R.Diffuse += U;
#else
    R.Diffuse = U;
#endif

#if defined(POINT_LIGHTING_SPECULAR)
    R.Specular += M;
#endif

#else

#if defined(DEBUG_POINTLIGHTS)
    gl_FragColor = vec4(0., 0., 0., 1.);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if defined(DEBUG_POINTLIGHTS_SPECULAR)
    gl_FragColor = vec4(0., 0., 0., 1.);
    if (uDebugReturn != 0.)
    {
        return;
    }
#endif

#if !defined(DIFFUSE_LIGHTING)
    R.Diffuse = vec3(0.);
#endif

#endif
    float x = 0.;
#if defined(CAUSTICS)
    x = CalculateCausticsTerm(vWorldPosition.stp, F, e);
#endif

#if defined(AMBIENT_LIGHTING)
    c.stp += m.Diffuse;
#endif
    c.stp += R.Diffuse;
#if defined(SPECULAR_LIGHTING)
    c.stp += R.Specular * i;
#endif

#if defined(CAUSTICS)
    c.stp += uSunColour * x;
#endif

#if defined(ALBEDO_LIGHTING)
    c.stp *= f.stp;
#endif

#if defined(DEBUG_EMISSIVE_MAP)
    c.stp = vec3(g);
#else
    if (g > 0.)
        c.q *= c.q;
    c.stp = mix(c.stp, f.stp, g);
#endif

#if defined(REFRACTION)
    if (D.refraction.s > 0. || D.refraction.p > 0.)
        c.stp = CalculateRefractionColour(vWorldPosition.stp, e, -a, D.specular, D.refraction, e.sp, c);
#endif

#if defined(LIGHT_SCATTERING) || defined(FOG_DISTANCE)
    c.stp = ApplyInOutScattering(c.stp, vOutScattering, vInScattering);
#endif

#if defined(VOLUMETRIC_SCATTERING_SUPPORTED)
    vec4 Y = GetScatteredInRay2(8, a, V, CalculateScatteringOffset(gl_FragCoord.st));
    c = ApplyVolumetricScattering(c, Y);
#endif

#if defined(TINT) && defined(PUSH_TO_FARPLANE)
    c.stp += uTint.stp;
#endif

#if defined(DEBUG_ALBEDO)
    c = f;
#endif

#if defined(DEBUG_NORMALS)
    c.stp = e * .5 + .5;
    c.q = 1.;
#endif

#if defined(DEBUG_FRESNEL)
    c.stp = vec3(N, N, N);
    c.q = 1.;
#endif

#if defined(DEBUG_SPECULAR_MAP)
    c.stp = vec3(max(0., (i - .5) / 4.));
#endif

#if defined(SUNLIGHT_SHADOWS) && defined(DEBUG_SUNLIGHT_SHADOW_CASCADE) && !defined(DEFERRED_SHADOWS)
    c.stp = ShadowMapCascadeColour(I, int(uMappingParams.q)).stp;
#endif

#if defined(DEBUG_RT7_EMISSIVE) || defined(DEBUG_RT7_METALNESS) || defined(DEBUG_RT7_ROUGHNESS)
    c = vec4(1., 0., 1., 1.);
#endif

#if defined(FORCE_OPAQUE)
    c.q = 1.;
#endif

#if defined(PREMULTIPLY_ALPHA)
    c.stp *= c.q;
#endif
    gl_FragColor = c;
}


/* MATCH 5 */

#version 460

/***************************************************/
/***************** GLSL Header *********************/
/***************************************************/
#ifdef GL_EXT_gpu_shader4
#extension GL_EXT_gpu_shader4 : enable
#endif
#ifdef GL_ARB_gpu_shader5
#extension GL_ARB_gpu_shader5 : enable
#endif
#ifdef GL_ARB_derivative_control
#extension GL_ARB_derivative_control : enable
#endif

#ifdef GL_ARB_texture_gather
#extension GL_ARB_texture_gather : enable
#endif

#define OGL_BACKEND

#undef attribute
#define attribute in

#undef gl_FragColor
#define gl_FragColor FragColor

#define shadow2DCompat texture

#undef textureCube
#define textureCube texture

#undef texture2D
#define texture2D texture

#undef texture3D
#define texture3D texture

#undef texture2DLod
#define texture2DLod textureLod

#undef textureCubeLod
#define textureCubeLod textureLod

#undef texture2DGrad
#define texture2DGrad textureGrad

#define MSAA_AVAILABLE

#define TEXTURE_OFFSET_AVAILABLE
#if !defined(lowp)
#define lowp
#endif
#if !defined(mediump)
#define mediump
#endif
#if !defined(highp)
#define highp
#endif

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define shadow2DLodCompat texture2DLod

#define texture2DLodCompat texture2DLod

#define textureCubeLodCompat textureCubeLod

#define textureGatherCompat(sampler, texCoord, viewportScale) textureGather(sampler, texCoord).wzxy

#define UNIFORM_BUFFER_BEGIN(name) \
    layout(std140) uniform name    \
    {
#define UNIFORM_BUFFER_END \
    }                      \
    ;

mat3 Mat4ToMat3(const mat4 inputMatrix)
{
    return mat3(inputMatrix);
}

#define isNaN isnan

#ifndef GL_ARB_derivative_control
#define dFdxFine dFdx
#define dFdyFine dFdy
#define fwidthFine fwidth
#endif

/***************************************************/

/***************************************************/
/***************** Effect Defines ******************/
/***************************************************/
#define TEXTURE_ALBEDO_GLOBAL
#define SUNLIGHT_DIRECT_LIGHTING
#define TEXTURE_ATLAS
#define VIEW_TRANSFORMS
#define TINT

/*************************************************/

/***************************************************/
/********** Mandatory Shader Fragments *************/
/***************************************************/

#define GRAPHICS_QUALITY_LOW 0
#define GRAPHICS_QUALITY_MEDIUM 1
#define GRAPHICS_QUALITY_HIGH 2
#define GRAPHICS_QUALITY_ULTRA 3

#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_X 3.0
#define MATERIAL_SETTINGS_SLOT_PIXEL_RESOLUTION_Y 4.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_X 42.0
#define MATERIAL_SETTINGS_SLOTS_DIMENSION_COUNT_Y 32.0
#define MATERIAL_SETTINGS_TEXTURE_RESOLUTION 128.0
#ifndef MATH_UTILS_INC
#define MATH_UTILS_INC
const float PI = 3.14159, INV_PI = .31831, TWOPI = PI * 2., INV_TWOPI = 1. / TWOPI, PI_OVER_4 = PI / 4., PI_OVER_2 = PI / 2., SQRT_2_PI = .797885, INV_EIGHT = .125;
float SpecPowToBeckmannRoughness(float f) { return sqrt(2. / (f + 2.)); }
float PerceptualRoughnessToRoughness(float f) { return f * f; }
float RoughnessToPerceptualRoughness(float f) { return sqrt(f); }
#endif
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif
#ifndef PACK_UTILS_INC
#define PACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

vec4 PackFloatToRGBA(highp float valueToPack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShift = vec4(256 * 256 * 256, 256 * 256, 256, 1.0);
    const highp vec4 bitMask = vec4(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
    highp vec4 fragColour = mod(valueToPack * bitShift * vec4(255), vec4(256)) / vec4(255);
    return fragColour - fragColour.xxyz * bitMask;
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
    const highp vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    highp vec4 fragColour = fract(valueToPack * bitShift);
    return fragColour - (fragColour.xxyz * bitMask);
#endif
}
vec2 NormalPackSphereMap(vec3 v)
{
    vec2 f = normalize(v.st) * sqrt(-v.p * .5 + .5);
    f = f * .5 + .5;
    return f * 65535.;
}
vec2 PackFloatToVec2(float v)
{
    vec2 f;
    const float b = 1. / 255.;
    vec2 h = vec2(1., 255.), r = fract(h * v);
    r.s -= r.t * b;
    return r.st;
}
#endif
#ifndef UNPACK_UTILS_INC
#define UNPACK_UTILS_INC
#ifndef SHADER_LIB_COMMON_INC
#define SHADER_LIB_COMMON_INC
#define USE_MOD_PACK
#endif

highp float UnpackRGBAToFloat(highp vec4 valueToUnpack)
{
#if defined(USE_MOD_PACK) || defined(USE_FRACT_PACK)
    const highp vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
    return dot(valueToUnpack, bitShifts);
#endif
#ifdef USE_ARAS_PACK
    const highp vec4 bitShifts = vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0);
    return dot(valueToUnpack, bitShifts);
#endif
}
vec3 ColourUnpack(highp float v)
{
    vec3 f;
    f.s = floor(v / 256. / 256.);
    f.t = floor((v - f.s * 256. * 256.) / 256.);
    f.p = floor(v - f.s * 256. * 256. - f.t * 256.);
    return f / 256.;
}
vec3 NormalUnpackSphereMap(vec2 v)
{
    vec4 f = vec4(v.s / 32767. - 1., v.t / 32767. - 1., 1., -1.);
    float U = dot(f.stp, -f.stq);
    f.st *= sqrt(U);
    f.p = U;
    return f.stp * 2. + vec3(0., 0., -1.);
}
highp float UnpackRGBAToIntegerFloat(highp vec4 f) { return floor(f.s * 255. + .5) * 256. * 256. * 256. + floor(f.t * 255. + .5) * 256. * 256. + floor(f.p * 255. + .5) * 256. + floor(f.q * 255. + .5); }
highp float UnpackRGBAToIntegerFloat16(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
highp int UnpackRGBAToInt(vec4 f) { return int(UnpackRGBAToIntegerFloat(f)); }
highp vec4 UnpackFloatToRGBA(highp float f)
{
    const highp vec4 v = vec4(1., 255., 65025., 1.65814e+07), s = vec4(vec3(1. / 255.), 0.);
    highp vec4 U = fract(f * v);
    U -= U.sstp * s;
    return U;
}
highp float UnpackVec2ToFloat(highp vec2 f) { return floor(f.s * 255. + .5) * 256. + floor(f.t * 255. + .5); }
#endif
#if defined(MSAA) && defined(MSAA_AVAILABLE)
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2DMS
#define MSAA_SAMPLERS_ENABLED 1
#define texture2DMultisample(sampler, texCoord, texSize) texelFetch(sampler, ivec2((texCoord)*texSize), 0)
#else
#define SAMPLER_2D_AUTO_MULTISAMPLE sampler2D
#define MSAA_SAMPLERS_ENABLED 0
#define texture2DMultisample(sampler, texCoord, texSize) texture2DLodCompat(sampler, texCoord, 0.0)
#endif
UNIFORM_BUFFER_BEGIN(ViewportLookupScale)
uniform highp vec4 uViewportLookupScale;
uniform highp vec4 uViewportOffsetScale;
uniform highp vec4 uFullScreenLookupScale;
UNIFORM_BUFFER_END

/***************************************************/

attribute vec4 aVertexPosition_BoneLabel;
attribute vec2 aTextureUV;
attribute vec4 aVertexNormal_BatchFlags, aVertexTangent, aVertexColour, aVertexColourUnwhitenedRGB_TilePositionLevel, aMaterialSettingsSlotXY_TilePositionXZ, aVertexSkinBones, aVertexSkinWeights;
uniform float uSmoothSkinning;
uniform mat4 uModelMatrix;
uniform float uVertexScale;

UNIFORM_BUFFER_BEGIN(ViewTransforms)
uniform highp vec3 uCameraPosition;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;
uniform highp mat4 uViewProjMatrix;
uniform highp vec4 uZBufferParams;
UNIFORM_BUFFER_END
uniform mediump vec4 uTint;
uniform float uFade;
out highp vec3 vWorldPosition;
out highp vec3 vNormal;
out mediump vec4 vVertexAlbedo;
out vec2 vTextureUV;
flat out vec3 vMaterialSettingsSlotXY_BatchFlags;
#ifndef CONVERSION_UTILS_INC
#define CONVERSION_UTILS_INC
vec3 SRGBToLinear(vec3 srgbColour)
{
#if defined(GAMMA_CORRECT_INPUTS)
    return srgbColour * srgbColour;
#else
    return pow(srgbColour, vec3(2.2, 2.2, 2.2));
#endif
}
vec3 LinearToSRGB(vec3 s) { return max(vec3(1.055) * pow(s, vec3(.416667)) - vec3(.055), vec3(0.)); }
float LinearToSRGB(float s)
{
    const float p = 1. / 2.2;
    return pow(s, p);
}
vec3 LinearToSRGBRunescape(vec3 s) { return sqrt(s); }
float LinearToSRGBRunescape(float s) { return sqrt(s); }
vec4 convertRGBtoHSL(vec4 s)
{
    const float p = 1. / 6.;
    float v = s.s, m = s.t, t = s.p, f = min(min(s.s, s.t), s.p), q = max(max(s.s, s.t), s.p), r = q - f, G = (f + q) * .5, i = 0., e = 0.;
    if (G > 0. && G < 1.)
    {
        float L = G < .5 ? G : 1. - G;
        i = r / (L * 2.);
    }
    if (r > 0.)
    {
        vec3 L = vec3(q == v && q != m ? 1. : 0., q == m && q != t ? 1. : 0., q == t && q != v ? 1. : 0.), o = vec3((m - t) / r, 2. + (t - v) / r, 4. + (v - m) / r);
        e += dot(o, L);
        e *= p;
        if (e < 0.)
            e += 1.;
    }
    return vec4(e, i, G, s.q);
}
vec4 convertHSLtoRGB(vec4 s)
{
    const float v = 1. / 3., q = 2. / 3., m = 6.;
    float p = s.s, t = s.t, r = s.p;
    vec3 f = vec3(m * (p - q), 0., m * (1. - p));
    if (p < q)
        f.s = 0., f.t = m * (q - p), f.p = m * (p - v);
    if (p < v)
        f.s = m * (v - p), f.t = m * p, f.p = 0.;
    f = min(f, 1.);
    float L = 2. * t, i = 1. - t, G = 1. - r, e = 2. * r - 1.;
    vec3 c = L * f + i, o;
    if (r >= .5)
        o = G * c + e;
    else
        o = r * c;
    return vec4(o, s.q);
}
#endif

#if defined(TEXTURE_ATLAS) && defined(NORMAL_MAP)
#define USE_NORMAL_MAP
#endif

#if __VERSION__ <= 120
#ifdef in
#undef in
#endif
#ifdef out
#undef out
#endif
#endif

#if defined(ANIMATION_VERTEX)
#if defined(USE_BONE_HALF_FLOATS)
mat4 GetBoneFromIndex(float u)
{
    uint f = uint(u), v = f % 2u, n = (f * 3u - v) / 2u;
    uvec4 d = (1u - v) * uBoneTransforms[n] + v * uvec4(uBoneTransforms[n].pq, uBoneTransforms[n + 1u].st);
    uvec2 G = (1u - v) * uvec2(uBoneTransforms[n + 1u].st) + v * uvec2(uBoneTransforms[n + 1u].pq);
    vec2 m = unpackHalf2x16(d.s), A = unpackHalf2x16(d.t), e = unpackHalf2x16(d.p), U = unpackHalf2x16(d.q), s = unpackHalf2x16(G.s), a = unpackHalf2x16(G.t);
    mat4 t = mat4(vec4(m.st, A.s, 0.), vec4(A.t, e.st, 0.), vec4(U.st, s.s, 0.), vec4(s.t, a.st, 1.));
    return t;
}
#else
mat4 GetBoneFromIndex(float u)
{
    int n = int(u * 3.);
    return mat4(vec4(uBoneTransforms[n].stp, 0.), vec4(uBoneTransforms[n].q, uBoneTransforms[n + 1].st, 0.), vec4(uBoneTransforms[n + 1].pq, uBoneTransforms[n + 2].s, 0.), vec4(uBoneTransforms[n + 2].tpq, 1.));
}
#endif
#endif

void AssignTextureAtlasVaryings(out vec2 d, out vec2 v, vec2 s, vec2 p)
{
    d = s.st, v = p;
}
mat3 ResolveNormalTransformMatrix(mat4 v)
{
    mat3 p = Mat4ToMat3(v);
#if defined(ANIMATION_VERTEX)
    const highp float d = 2e-16;
    float s = step(d, abs(p[0].s) + abs(p[1].t));
    p[0].s = mix(1., p[0].s, s);
    p[1].t = mix(1., p[1].t, s);
#endif
    return p;
}
vec2 ClipSpacePosToUVSpacePos(vec2 s) { return s.st * .5 + vec2(.5, .5); }
vec4 OffsetPositionAlongNormal(vec4 p, vec3 s, vec4 t, vec2 d, float v)
{
    if (v <= 0.)
        return t;
    else
    {
        vec2 a = t.st / t.q, l = ClipSpacePosToUVSpacePos(a) * d;
        vec4 f = p;
        f.stp -= s;
        vec4 u = uViewProjMatrix * f;
        vec2 G = ClipSpacePosToUVSpacePos(u.st / u.q) * d;
        u.st = a;
        vec2 q = G - l;
        q = -q;
        float A = dot(q, q);
        if (A > 0.)
            q /= sqrt(A), u.st += q * v / d;
        u.st *= u.q;
        return u;
    }
}
#if defined(ANIMATION_VERTEX)
mat4 GetBoneMatrix(out float s)
{
    s = floor(aVertexPosition_BoneLabel.q / 256.);
    float v = aVertexPosition_BoneLabel.q - s * 256.;
    mat4 p = GetBoneFromIndex(v), f = uSmoothSkinning < 0. ? mat4(1.) : GetBoneFromIndex(aVertexSkinBones.s);
    if (uSmoothSkinning > 0.)
    {
        f *= aVertexSkinWeights.s;
        mat4 u = GetBoneFromIndex(aVertexSkinBones.t);
        f += u * aVertexSkinWeights.t;
        u = GetBoneFromIndex(aVertexSkinBones.p);
        f += u * aVertexSkinWeights.p;
        u = GetBoneFromIndex(aVertexSkinBones.q);
        f += u * aVertexSkinWeights.q;
    }
    return f * p;
}
mat4 GetBoneMatrixRigid(out float s)
{
    s = floor(aVertexPosition_BoneLabel.q / 256.);
    float v = aVertexPosition_BoneLabel.q - s * 256.;
    mat4 p = GetBoneFromIndex(v), u = uSmoothSkinning < 0. ? mat4(1.) : GetBoneFromIndex(aVertexSkinBones.s);
    return u * p;
}
#endif
void AssignPositionNormalVaryings(out float v)
{
    vec3 u = aVertexPosition_BoneLabel.stp;
    mat4 p;
#if defined(ANIMATION_VERTEX)
    mat4 d = GetBoneMatrix(v), s = uModelMatrix;
    p = s * d;
#else
    v = 0.;
    p = uModelMatrix;
#endif
    vec3 a = u * uVertexScale;
    vec4 t = p * vec4(a, 1.),
         q = uViewProjMatrix * t;
#if !defined(MODEL_GEOMETRY_SHADOW_VS)
    mat3 f = ResolveNormalTransformMatrix(p);
    vNormal = f * aVertexNormal_BatchFlags.stp;
    vNormal = normalize(vNormal);
    vNormal = isNaN(vNormal.s) ? vec3(0., 1., 0.) : vNormal;
#if defined(USE_NORMAL_MAP) && !defined(PER_FRAGMENT_TANGENTS)
    vTangent.stp = f * aVertexTangent.stp;
    vTangent.stp = normalize(vTangent.stp);
    vTangent.stp = isNaN(vTangent.s) ? vec3(1., 0., 0.) : vTangent.stp;
    vTangent.q = aVertexTangent.q;
#endif

#if defined(MODEL_GEOMETRY_HIGHLIGHT_VS)
    q = OffsetPositionAlongNormal(t, vNormal, q, uViewportLookupScale.pq, uHighlightScale);
#endif
    vWorldPosition = t.stp;
#endif
    gl_Position = q;
#if !defined(ANIMATION_VERTEX) && defined(PUSH_TO_FARPLANE)
    gl_Position.p = gl_Position.q * .9999;
#endif
}
#if __VERSION__ <= 120
#define in varying
#define out varying
#endif

void main()
{
    float d = 1.;
    AssignPositionNormalVaryings(d);
#if defined(TEXTURE_ATLAS)

#if defined(TEXTURE_ALBEDO_GLOBAL)
    vVertexAlbedo = aVertexColour;
#else
    vVertexAlbedo = vec4(mix(aVertexColourUnwhitenedRGB_TilePositionLevel.stp, aVertexColour.stp, step(.5, fract(aVertexNormal_BatchFlags.q * 8.))), aVertexColour.q);
#endif

#else
    vVertexAlbedo = vec4(aVertexColourUnwhitenedRGB_TilePositionLevel.stp, aVertexColour.q);
#endif
    // vVertexAlbedo.q += uFade;
#if defined(TINT)

#if !defined(PUSH_TO_FARPLANE)
    // vVertexAlbedo.stp = vVertexAlbedo.stp + uTint.q * (uTint.stp - vVertexAlbedo.stp);
#endif

#endif

#if defined(ANIMATION_VERTEX)
    vVertexAlbedo.q += uLabelDeltas[int(d)].q;
    vVertexAlbedo.q = clamp(vVertexAlbedo.q, 0., 1.);
#if defined(ANIMATION_COLOUR_RGB) || defined(ANIMATION_COLOUR_HSL)

#if defined(ANIMATION_COLOUR_RGB)
    vVertexAlbedo.stp += uLabelDeltas[int(d)].stp;
#endif

#if defined(ANIMATION_COLOUR_HSL)
    vVertexAlbedo = convertRGBtoHSL(vVertexAlbedo);
    vVertexAlbedo.s = fract(vVertexAlbedo.s + uLabelDeltas[int(d)].s);
    vVertexAlbedo.tp = clamp(vVertexAlbedo.tp + uLabelDeltas[int(d)].tp, 0., 1.);
    vVertexAlbedo = convertHSLtoRGB(vVertexAlbedo);
#endif

#if defined(BAKED_SRGB_TO_LINEAR) && !defined(GAMMA_CORRECT_INPUTS)
    vVertexAlbedo.stp = SRGBToLinear(vVertexAlbedo.stp);
#endif

#endif

#endif

#if !defined(BAKED_SRGB_TO_LINEAR) && defined(GAMMA_CORRECT_INPUTS)
    vVertexAlbedo.stp = SRGBToLinear(vVertexAlbedo.stp);
#endif

#if defined(GOURAUD_SHADING)
    float p = dot(vNormal, uInvSunDirection);
    vVertexAlbedo.stp = vVertexAlbedo.stp * (uAmbientColour + uSunColour * p);
#endif

#if defined(POINT_LIGHTING)
    vTilePosition = vec3(floor(aVertexColourUnwhitenedRGB_TilePositionLevel.q * 255. + .1), aMaterialSettingsSlotXY_TilePositionXZ.pq);
#endif
    vMaterialSettingsSlotXY_BatchFlags.p = aVertexNormal_BatchFlags.q + .25 / 128.;
#if defined(TEXTURE_ATLAS)
    AssignTextureAtlasVaryings(vTextureUV, vMaterialSettingsSlotXY_BatchFlags.st, aTextureUV, aMaterialSettingsSlotXY_TilePositionXZ.st);
#endif

#if defined(DEBUG_VERTEX_BONE_COLOUR)

#if defined(ANIMATION_VERTEX)
    vVertexAlbedo.stpq = vec4(mod(aVertexPosition_BoneLabel.q / 5., 1.), mod(aVertexPosition_BoneLabel.q / 14., 1.), mod(aVertexPosition_BoneLabel.q / 63., 1.), 1.);
#else
    vVertexAlbedo.stpq = vec4(0.);
#endif

#endif

#if defined(LIGHT_SCATTERING) || defined(FOG_DISTANCE)
    vec4 o = uModelMatrix * vec4(aVertexPosition_BoneLabel.stp, 1.);
    vec3 v = o.stp - uCameraPosition;
    float a = length(v);
#if defined(LIGHT_SCATTERING) && defined(SUNLIGHT_DIRECT_LIGHTING)
    ComputeInOutScattering(normalize(v), a, uInvSunDirection.stp, vOutScattering, vInScattering);
#else
    vOutScattering = vec3(1.);
    vInScattering = vec3(0.);
#endif

#if defined(FOG_DISTANCE)
    float q = FogBasedOnDistance(a);
    vInScattering = mix(vInScattering, uFogColour.stp, q);
    vOutScattering *= 1. - q;
#endif

#endif
}


/* MATCH 6 */
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}

/* MATCH 7 */
void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}

/* MATCH 8 */


				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			

/* MATCH 9 */


				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			

/* MATCH 10 */
varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}

/* MATCH 11 */
uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}

/* MATCH 12 */
varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}

/* MATCH 13 */
#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}

/* MATCH 14 */
varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}

/* MATCH 15 */
uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}

/* MATCH 16 */
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}

/* MATCH 17 */
#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}

/* MATCH 18 */
#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}

/* MATCH 19 */
#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}

/* MATCH 20 */
varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}

/* MATCH 21 */
uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}

/* MATCH 22 */
uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}

/* MATCH 23 */
uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}

/* MATCH 24 */
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}

/* MATCH 25 */
uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}

/* MATCH 26 */
#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}

/* MATCH 27 */
#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}

/* MATCH 28 */
#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}

/* MATCH 29 */
#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}

/* MATCH 30 */
#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}

/* MATCH 31 */
#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}

/* MATCH 32 */
#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}

/* MATCH 33 */
#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}

/* MATCH 34 */
#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}

/* MATCH 35 */
#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}

/* MATCH 36 */
#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}

/* MATCH 37 */
#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}

/* MATCH 38 */
uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}

/* MATCH 39 */
uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}

/* MATCH 40 */
#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}

/* MATCH 41 */
uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}

/* MATCH 42 */
uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}

/* MATCH 43 */
uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}

/* MATCH 44 */


		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	

/* MATCH 45 */


			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		

/* MATCH 46 */


		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	

/* MATCH 47 */


			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		

/* MATCH 48 */


		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	

/* MATCH 49 */


			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		

/* MATCH 50 */
void main() {
	gl_Position = vec4( position, 1.0 );
}

/* MATCH 51 */
uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}

/* MATCH 52 */

void main() {

	gl_Position = vec4( position, 1.0 );

}

/* MATCH 53 */

uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepthEXT = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepthEXT = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}

/* MATCH 54 */

			varying vec2 vUv;
			void main(){
				vUv = uv;
				gl_Position = vec4(position.xy * 1.0,0.,.999999);
			}

/* MATCH 55 */

			uniform sampler2D blitTexture; 
			varying vec2 vUv;

			void main(){ 
				gl_FragColor = vec4(vUv.xy, 0, 1);
				
				#ifdef IS_SRGB
				gl_FragColor = LinearTosRGB( texture2D( blitTexture, vUv) );
				#else
				gl_FragColor = texture2D( blitTexture, vUv);
				#endif
			}

/* MATCH 56 */

				attribute vec3 position;
				varying vec2 vUv;
				void main()  {
					vUv = vec2(position.x,position.y);
					gl_Position = vec4(position, 1.0);
				}

/* MATCH 57 */

				precision mediump float;
				uniform samplerCube map;
				varying vec2 vUv;
				#define M_PI 3.1415926535897932384626433832795
				void main() {
					float longitude = vUv.x * M_PI;
					float latitude = vUv.y * 0.5 * M_PI;
					vec3 dir = vec3(sin(longitude) * cos(latitude), sin(latitude), -cos(longitude) * cos(latitude));
					normalize(dir);
					gl_FragColor = textureCube(map, dir);
				}

/* MATCH 58 */

        void main(){
            super();
            //pre-multiply alpha
            // gl_FragColor.rgb *= gl_FragColor.a;
            // gl_FragColor.rgb = vec3( gl_FragColor.a);
            gl_FragColor.a=1.0;
            
        }
    

/* MATCH 59 */

		attribute vec3 position;
		varying vec2 vUv;
		void main()  {
			vUv = vec2(position.x,position.y);
			gl_Position = vec4(position, 1.0);
		}

/* MATCH 60 */

		precision mediump float;
		uniform sampler2D map;
		uniform mat3 viewmatrix;
		varying vec2 vUv;
		#define M_PI 3.1415926535897932384626433832795
		void main() {
			vec3 norm=viewmatrix*vec3(vUv,1.0);
			norm=normalize(norm);
			float lat=asin(norm.y);
			float lon=atan(norm.x,norm.z);
			vec2 sample=vec2(lon/2.0/M_PI+0.5,lat/M_PI+0.5);
			gl_FragColor = texture2D(map,sample);
		}
