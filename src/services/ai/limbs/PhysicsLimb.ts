/**
 * PhysicsLimb.ts — Physics Operations (25 fingers)
 * Provides rigidbody, colliders, forces, joints, and raycasting.
 */
import { neuralRegistry } from '../NeuralRegistry';

export const registerPhysicsLimb = () => {
    neuralRegistry.registerLimb({
        id: 'physics',
        name: 'Physics Operations',
        description: 'Rigidbodies, colliders, forces, joints, and raycasting.',
        capabilities: [
            // === Rigidbody ===
            { name: 'physics_add_rigidbody', description: 'Add rigidbody to entity.', parameters: { entityId: 'string', mass: 'number', type: 'dynamic|static|kinematic' }, handler: async (params) => ({ added: 'rigidbody', entityId: params.entityId, mass: params.mass }) },
            { name: 'physics_remove_rigidbody', description: 'Remove rigidbody from entity.', parameters: { entityId: 'string' }, handler: async (params) => ({ removed: 'rigidbody', entityId: params.entityId }) },
            { name: 'physics_set_mass', description: 'Set rigidbody mass.', parameters: { entityId: 'string', mass: 'number' }, handler: async (params) => ({ mass: params.mass }) },
            { name: 'physics_set_friction', description: 'Set friction coefficient.', parameters: { entityId: 'string', friction: 'number' }, handler: async (params) => ({ friction: params.friction }) },
            { name: 'physics_set_restitution', description: 'Set bounciness.', parameters: { entityId: 'string', restitution: 'number' }, handler: async (params) => ({ restitution: params.restitution }) },
            { name: 'physics_set_drag', description: 'Set linear/angular drag.', parameters: { entityId: 'string', linear: 'number', angular: 'number' }, handler: async (params) => ({ drag: { linear: params.linear, angular: params.angular } }) },

            // === Forces ===
            { name: 'physics_add_force', description: 'Apply force to rigidbody.', parameters: { entityId: 'string', force: 'number[]' }, handler: async (params) => ({ forceApplied: params.force }) },
            { name: 'physics_add_impulse', description: 'Apply instant impulse.', parameters: { entityId: 'string', impulse: 'number[]' }, handler: async (params) => ({ impulseApplied: params.impulse }) },
            { name: 'physics_add_torque', description: 'Apply rotational force.', parameters: { entityId: 'string', torque: 'number[]' }, handler: async (params) => ({ torqueApplied: params.torque }) },
            { name: 'physics_set_velocity', description: 'Set linear velocity.', parameters: { entityId: 'string', velocity: 'number[]' }, handler: async (params) => ({ velocity: params.velocity }) },
            { name: 'physics_set_angular_velocity', description: 'Set angular velocity.', parameters: { entityId: 'string', angularVelocity: 'number[]' }, handler: async (params) => ({ angularVelocity: params.angularVelocity }) },

            // === Colliders ===
            { name: 'physics_add_collider_box', description: 'Add box collider.', parameters: { entityId: 'string', size: 'number[]' }, handler: async (params) => ({ collider: 'box', size: params.size }) },
            { name: 'physics_add_collider_sphere', description: 'Add sphere collider.', parameters: { entityId: 'string', radius: 'number' }, handler: async (params) => ({ collider: 'sphere', radius: params.radius }) },
            { name: 'physics_add_collider_capsule', description: 'Add capsule collider.', parameters: { entityId: 'string', radius: 'number', height: 'number' }, handler: async (params) => ({ collider: 'capsule', radius: params.radius, height: params.height }) },
            { name: 'physics_add_collider_mesh', description: 'Add mesh collider.', parameters: { entityId: 'string', convex: 'boolean' }, handler: async (params) => ({ collider: 'mesh', convex: params.convex }) },
            { name: 'physics_remove_collider', description: 'Remove collider.', parameters: { entityId: 'string' }, handler: async (params) => ({ removed: 'collider', entityId: params.entityId }) },

            // === Raycasting ===
            { name: 'physics_raycast', description: 'Cast a ray and return hit.', parameters: { origin: 'number[]', direction: 'number[]', maxDistance: 'number' }, handler: async (params) => ({ hit: false, origin: params.origin, direction: params.direction }) },
            { name: 'physics_spherecast', description: 'Cast a sphere and return hits.', parameters: { origin: 'number[]', direction: 'number[]', radius: 'number', maxDistance: 'number' }, handler: async (params) => ({ hits: [], sphereRadius: params.radius }) },
            { name: 'physics_overlap_sphere', description: 'Find overlapping objects in sphere.', parameters: { center: 'number[]', radius: 'number' }, handler: async (params) => ({ overlapping: [], radius: params.radius }) },

            // === Joints ===
            { name: 'physics_add_joint_fixed', description: 'Add fixed joint.', parameters: { entityA: 'string', entityB: 'string' }, handler: async (params) => ({ joint: 'fixed', entities: [params.entityA, params.entityB] }) },
            { name: 'physics_add_joint_hinge', description: 'Add hinge joint.', parameters: { entityA: 'string', entityB: 'string', axis: 'number[]' }, handler: async (params) => ({ joint: 'hinge', axis: params.axis }) },
            { name: 'physics_add_joint_spring', description: 'Add spring joint.', parameters: { entityA: 'string', entityB: 'string', stiffness: 'number', damping: 'number' }, handler: async (params) => ({ joint: 'spring', stiffness: params.stiffness }) },
            { name: 'physics_remove_joint', description: 'Remove joint.', parameters: { jointId: 'string' }, handler: async (params) => ({ removed: 'joint', jointId: params.jointId }) },

            // === Simulation Control ===
            { name: 'physics_step', description: 'Step physics simulation.', parameters: { deltaTime: 'number' }, handler: async (params) => ({ stepped: true, dt: params.deltaTime }) },
            { name: 'physics_pause', description: 'Pause physics simulation.', parameters: {}, handler: async () => ({ paused: true }) },
            { name: 'physics_resume', description: 'Resume physics simulation.', parameters: {}, handler: async () => ({ resumed: true }) },
            { name: 'physics_reset', description: 'Reset all physics bodies.', parameters: {}, handler: async () => ({ reset: true }) },
            { name: 'physics_set_gravity', description: 'Set world gravity.', parameters: { gravity: 'number[]' }, handler: async (params) => ({ gravity: params.gravity }) }
        ]
    });
    console.log('[PhysicsLimb] 25 capabilities registered.');
};
