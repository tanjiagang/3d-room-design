import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsShapeFactory {
    static createBox(size: THREE.Vector3, mass = 0): CANNON.Body {
        return new CANNON.Body({
            mass,
            shape: new CANNON.Box(new CANNON.Vec3(
                size.x / 2, size.y / 2, size.z / 2
            )),
            material: new CANNON.Material('boxMaterial')
        });
    }

    static createSphere(radius: number, mass = 0): CANNON.Body {
        return new CANNON.Body({
            mass,
            shape: new CANNON.Sphere(radius),
            material: new CANNON.Material('sphereMaterial')
        });
    }

    static createFromThreeMesh(
        mesh: THREE.Mesh,
        mass = 0,
        options: { type?: 'hull' | 'mesh' } = {}
    ): CANNON.Body {
        const geometry = mesh.geometry;
        const body = new CANNON.Body({ mass });

        if (options.type === 'hull') {
            // 使用凸包近似（性能较好）
            const vertices = this.getVertices(geometry);
            body.addShape(new CANNON.ConvexPolyhedron({
                vertices: vertices.map(v => new CANNON.Vec3(v.x, v.y, v.z))
            }));
        } else {
            // 精确三角网格（性能较低）
            const indices = geometry.index?.array || [];
            const vertices = this.getVertices(geometry);

            const cannonVertices = vertices.map(v =>
                new CANNON.Vec3(v.x, v.y, v.z)
            );

            const cannonIndices: number[] = [];
            for (let i = 0; i < indices.length; i += 3) {
                cannonIndices.push(indices[i], indices[i + 1], indices[i + 2]);
            }

            body.addShape(new CANNON.Trimesh(
                cannonVertices,
                cannonIndices
            ));
        }

        return body;
    }

    private static getVertices(geometry: THREE.BufferGeometry): THREE.Vector3[] {
        const position = geometry.attributes.position;
        const vertices: THREE.Vector3[] = [];
        for (let i = 0; i < position.count; i++) {
            vertices.push(new THREE.Vector3(
                position.getX(i),
                position.getY(i),
                position.getZ(i)
            ));
        }
        return vertices;
    }
}