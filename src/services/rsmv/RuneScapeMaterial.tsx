
import { forwardRef, useMemo, useEffect } from 'react';
import { createRuneScapeMaterial } from './shaders/shaderfactory';
import { UniformsUtils } from 'three';

export const RuneScapeMaterial = forwardRef((props: any, ref) => {
    const { texture, materialData, lightParams, ...rest } = props;

    const material = useMemo(() => {
        return createRuneScapeMaterial(texture, materialData || { alphamode: 'none' });
    }, [texture, materialData]);

    useEffect(() => {
        if (material && lightParams) {
            if (lightParams.sunDirection) material.uniforms.uSunDirection.value.copy(lightParams.sunDirection);
            if (lightParams.sunColour) material.uniforms.uSunColour.value.copy(lightParams.sunColour);
            if (lightParams.ambientColour) material.uniforms.uAmbientColour.value.copy(lightParams.ambientColour);
        }
    }, [material, lightParams]);

    return (
        <primitive
            object={material}
            ref={ref}
            attach="material"
            {...rest}
        />
    );
});

RuneScapeMaterial.displayName = 'RuneScapeMaterial';
