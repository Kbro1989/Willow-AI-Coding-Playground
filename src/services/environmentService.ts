
import { XRDevice, metaQuest3 } from 'iwer';
import { SyntheticEnvironmentModule } from '@iwer/sem';

class EnvironmentService {
    private xrDevice: any = null;
    private sem: any = null;
    private currentEnvironment: string | null = null;

    async init() {
        if (this.xrDevice) return;

        try {
            this.xrDevice = new XRDevice(metaQuest3);
            this.xrDevice.installRuntime();

            this.sem = new SyntheticEnvironmentModule(this.xrDevice);
            this.xrDevice.installSyntheticEnvironmentModule(this.sem);

            console.log('[Neural Environment] System Initialized');
        } catch (error) {
            console.error('[Neural Environment] Initialization failed:', error);
        }
    }

    async loadEnvironment(envName: string) {
        if (!this.sem) await this.init();

        if (envName === 'none') {
            this.currentEnvironment = null;
            // Logic to clear environment if needed
            return;
        }

        try {
            const response = await fetch(`/src/assets/environments/${envName}.json`);
            const sceneJSON = await response.json();
            this.sem.loadEnvironment(sceneJSON);
            this.currentEnvironment = envName;
            console.log(`[Neural Environment] Loaded Matrix Base: ${envName}`);
        } catch (error) {
            console.error(`[Neural Environment] Failed to load ${envName}:`, error);
        }
    }

    getXRStore() {
        // This could return something to hook into @react-three/xr if needed
        return null;
    }
}

export const environmentService = new EnvironmentService();
export default environmentService;
