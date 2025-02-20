import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OutlinePass } from 'three/examples/jsm/Addons.js';
import * as dat from 'dat.gui';

const initData: Array<any> = [];

const loader = new GLTFLoader();

// draw floor
const drawFloor = () => {
    const group =  new THREE.Group();
    const floorGemotry = new THREE.BoxGeometry(400, 400, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFEF8,
        roughness: 0.4,
        metalness: 0,
        // depthTest: false
    });
    const floor = new THREE.Mesh(floorGemotry, floorMaterial);
    floor.rotation.x = - Math.PI / 2;
    floor.position.y = 0;

    // upper golden floor
    const goldenGemotry = new THREE.BoxGeometry(400, 400, 3);
    const goldenMaterial = new THREE.MeshStandardMaterial({
        color: 0xEDDEC4,
        roughness: 0.4,
        metalness: 0,
        // depthTest: false
    });
    const golden = new THREE.Mesh(goldenGemotry, goldenMaterial);
    golden.rotation.x = - Math.PI / 2;
    golden.position.y = 5;
    group.add(golden);
    group.add(floor);
    // group.layers.set(2);
    return group;
}

// draw wall 
const drawWall = (width: number, height: number, depth: number, color: Array<THREE.Color>) => {
    const group = new THREE.Group();
    const middleGeometry = new THREE.BoxGeometry(width, height, depth);
    const middleMaterial = new THREE.MeshStandardMaterial({
        color: color[1],
        roughness: 0.4,
        metalness: 0
    });
    const middleWall = new THREE.Mesh(middleGeometry, middleMaterial);
    middleWall.position.y = height / 2;

    // middle wall
    const innerWall = middleWall.clone();
    innerWall.position.z = depth;
    innerWall.material = new THREE.MeshStandardMaterial({
        color: color[0],
        roughness: 0.4,
        metalness: 0
    });

    // inner wall
    const outerWall = middleWall.clone();
    outerWall.position.z = -depth;
    outerWall.material = new THREE.MeshStandardMaterial({
        color: color[2],
        roughness: 0.4,
        metalness: 0
    });

    group.add(innerWall);
    group.add(middleWall);
    group.add(outerWall);

    innerWall.receiveShadow = true;
    middleWall.receiveShadow = true;
    outerWall.receiveShadow = true;
    group.name = 'wallGroup&unmoveable';
    return group;
}

// draw door
const drawDoor = (width: number, height: number, depth: number) => {
    const group = new THREE.Group();

    const doorSub = new THREE.Mesh(
        new THREE.BoxGeometry(width - 10, height - 20, depth),
        new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.4,
            metalness: 0
        })
    )
    const doorBySub = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
            color: 0xEEDAB4,
            roughness: 0.4,
            metalness: 0
        })
    )

    doorSub.position.z = -1;
    // doorSub.position.y = 10;
    doorSub.updateMatrix();
    doorBySub.updateMatrix();

    const door = CSG.subtract(doorBySub, doorSub);
    const doorInner = new THREE.Mesh(
        new THREE.BoxGeometry(width - 10, height - 10, depth),
        new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.4,
            metalness: 0
        })
    )
    doorInner.position.z = -0.5;

    doorInner.receiveShadow = true;
    door.receiveShadow = true;
    group.add(doorInner);
    group.add(door);

    group.name = 'doorGroup';
    return group;
}

// draw frame
const drawFrame = (width: number, height: number, depth: number, color: Array<THREE.Color>) => {
    const group = new THREE.Group();
    const outerFrame = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
            color: color[0],
            roughness: 0.4,
            metalness: 0
        })
    )
    const middleFrame = outerFrame.clone();
    middleFrame.scale.set(0.9, 0.9, 0.9);
    middleFrame.material = new THREE.MeshStandardMaterial({
        color: color[1],
        roughness: 0.4,
        metalness: 0
    });
    middleFrame.position.z = -0.5;

    const innerFrame = middleFrame.clone();
    innerFrame.scale.set(0.7, 0.7, 0.7);
    innerFrame.material = new THREE.MeshStandardMaterial({
        color: color[2],
        roughness: 0.4,
        metalness: 0
    });
    innerFrame.position.z = -0.8;

    innerFrame.receiveShadow = true;
    middleFrame.receiveShadow = true;
    outerFrame.receiveShadow = true;
    group.add(innerFrame);
    group.add(middleFrame);
    group.add(outerFrame);
    group.name = 'frameGroup';
    return group;
}

// draw sofa
const drawSofa = (width: number, height: number, depth: number) => {
    const group = new THREE.Group();

    const sofaBysub = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
            color: 0xEB4258,
            roughness: 0.4,
            metalness: 0
        })
    );
    const sofaSub = new THREE.Mesh(
        new THREE.BoxGeometry(width - 20, height / 2, depth * 0.8),
        sofaBysub.material
    );

    sofaSub.position.set(0, height / 4, - depth * 0.2);
    sofaBysub.updateMatrix();
    sofaSub.updateMatrix();
    
    const sofa = CSG.subtract(sofaBysub, sofaSub);
    sofa.updateMatrix();

    sofa.name = 'sofa';
    sofa.receiveShadow = true;
    group.add(sofa);
    group.name = 'sofaGroup';
    return group;
}

// draw circle chair
const drawCircleChair = () => {
    // draw circle chair
    const chairGroup = new THREE.Group();
    const uppperCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(15, 15, 2, 32),
        new THREE.MeshStandardMaterial({
            color: 0xAAAAAA,
            roughness: 0.93,
            metalness: 0
        })
    );
    const lowerCylinder = new THREE.Mesh(
        new THREE.TorusGeometry(15, 1, 16, 100),
        new THREE.MeshStandardMaterial({
            color: 0xD7B797,
            roughness: 0.93,
            metalness: 0
        })
    );
    uppperCylinder.position.set(0, 15, 0);
    lowerCylinder.rotation.x = Math.PI / 2;
    lowerCylinder.position.set(0, -15, 0);
    const lowerCylinder2 = lowerCylinder.clone();
    lowerCylinder2.rotation.set(Math.PI / 2, Math.PI / 2, 0);
    lowerCylinder2.position.set(-14, 0, 0);
    const lowerCylinder3 = lowerCylinder2.clone();
    lowerCylinder3.position.set(14, 0, 0);
    const lowerCylinder4 = lowerCylinder.clone();
    lowerCylinder4.position.set(0, 0, 14);
    lowerCylinder4.rotation.set(0, Math.PI, 0);
    const lowerCylinder5 = lowerCylinder4.clone();
    lowerCylinder5.position.set(0, 0, -14);

    lowerCylinder.receiveShadow = true;
    lowerCylinder2.receiveShadow = true;
    lowerCylinder3.receiveShadow = true;
    lowerCylinder4.receiveShadow = true;
    lowerCylinder5.receiveShadow = true;
    chairGroup.add(uppperCylinder, lowerCylinder, lowerCylinder2, lowerCylinder3, lowerCylinder4, lowerCylinder5);
    chairGroup.name = 'circleChairGroup';
    return chairGroup;
}

// draw hall
const drawHall = () => {
    const group = new THREE.Group();
    const wall1 = drawWall(200, 200, 1, [new THREE.Color(0xF3B966), new THREE.Color(0xF8ECD6), new THREE.Color(0xFFFEF8)]);
    wall1.position.z = -200 - 0.5;
    wall1.position.x = 100;
    wall1.position.y = -5;
    

    const wall3 = wall1.clone();
    wall3.position.z = 0;
    wall3.rotation.y = Math.PI;
    

    const wall2 = drawWall(200, 200, 1, [new THREE.Color(0xFFFEF8), new THREE.Color(0xF8ECD6), new THREE.Color(0xFFFEF8)]);
    wall2.position.x = 200; 
    wall2.position.z = -100;
    wall2.position.y = -5;
    wall2.rotation.y = - Math.PI / 2;
    

    const wall4 = wall2.clone();
    wall4.position.x = 0;

    group.add(wall1);
    group.add(wall2);
    group.add(wall3);
    group.add(wall4);

    // door
    const door = drawDoor(60, 150, 2);
    door.position.set(60, 75, -2);
    door.name = 'hallDoor';
    initData.push({uuid: door.uuid, position: door.position, rotation: door.rotation, children: door.children});
    group.add(door);

    // frame
    const frame = drawFrame(60, 70, 2, [new THREE.Color(0x4B586D), new THREE.Color(0xECE5C8), new THREE.Color(0x857F7D)]);
    frame.position.set(150, 115, -2);
    // frame.name = 'moveable';
    group.add(frame);

    // add flowerpot model
    loader.load('/models/flowerpot.glb', (gltf) => {
        gltf.scene.position.set(120, 10, -20);
        const flowerpot = gltf.scene;
        // console.log(flowerpot);
        // flowerpot.name = flowerpot.name + '&moveable';
        flowerpot.name = 'flowerpot';
        const flowerpot2 = flowerpot.clone();
        flowerpot2.position.set(100, 10, -20);
        // initData.push({uuid: flowerpot.uuid, position: flowerpot.position, rotation: flowerpot.rotation, children: flowerpot.children});
        // initData.push({uuid: flowerpot2.uuid, position: flowerpot2.position, rotation: flowerpot2.rotation, children: flowerpot2.children});
        initData.push({uuid: flowerpot.uuid, position: {x: flowerpot.position.x, y: flowerpot.position.y, z: flowerpot.position.z}, rotation: {x: flowerpot.rotation.x, y: flowerpot.rotation.y, z: flowerpot.rotation.z}, children: flowerpot.children});
        initData.push({uuid: flowerpot2.uuid, position: {x: flowerpot2.position.x, y: flowerpot.position.y, z: flowerpot2.position.z}, rotation: {x: flowerpot2.rotation.x, y: flowerpot.rotation.y, z: flowerpot.rotation.z}, children: flowerpot2.children});
        group.add(flowerpot, flowerpot2);
    })

    // add desk model
    loader.load('/models/desk.glb', (gltf) => {
        const desk = gltf.scene;
        desk.scale.set(2, 2, 2);
        desk.position.set(165, 20, -90);
        // console.log(flowerpot);
        // flowerpot.name = flowerpot.name + '&moveable';
        desk.name = 'desk';
        desk.receiveShadow = true;
        initData.push({uuid: desk.uuid, position: {x: desk.position.x, y: desk.position.y, z: desk.position.z}, rotation: {x: desk.rotation.x, y: desk.rotation.y, z: desk.rotation.z}, children: desk.children});
        group.add(desk);
    });

    // add fruitPlatter
    loader.load('/models/fruitPlatter.glb', (gltf) => {
        const fruitPlatter = gltf.scene;
        fruitPlatter.position.set(150, 60, -80);
        // console.log(flowerpot);
        // flowerpot.name = flowerpot.name + '&moveable';
        fruitPlatter.name = 'fruitPlatter';
        initData.push({uuid: fruitPlatter.uuid, position: {x: fruitPlatter.position.x, y: fruitPlatter.position.y, z: fruitPlatter.position.z}, rotation: {x: fruitPlatter.rotation.x, y: fruitPlatter.rotation.y, z: fruitPlatter.rotation.z}, children: fruitPlatter.children});
        group.add(fruitPlatter);
    });
    // add cups
    loader.load('/models/cups.glb', (gltf) => {
        const cups = gltf.scene;
        // cups.scale.set(2, 2, 2);
        cups.position.set(160, 60, -90);
        // console.log(flowerpot);
        // flowerpot.name = flowerpot.name + '&moveable';
        cups.name = 'cups';
        initData.push({uuid: cups.uuid, position: {x: cups.position.x, y: cups.position.y, z: cups.position.z}, rotation: {x: cups.rotation.x, y: cups.rotation.y, z: cups.rotation.z}, children: cups.children});
        group.add(cups);
    });

    // draw circle chair
    const chairGroup = drawCircleChair();
    
    chairGroup.position.set(20, 30, -160);
    initData.push({uuid: chairGroup.uuid, position: {x: chairGroup.position.x, y: chairGroup.position.y, z: chairGroup.position.z}, rotation: {x: chairGroup.rotation.x, y: chairGroup.rotation.y, z: chairGroup.rotation.z}, children: chairGroup.children});
    group.add(chairGroup);

    // draw television table
    const tvGroup = new THREE.Group();
    const tvTableBySub = new THREE.Mesh(
        new THREE.BoxGeometry(120, 20, 30),
        new THREE.MeshStandardMaterial({
            color: 0xBB9172,
            roughness: 0.93,
            metalness: 0
        })
    );
    const tvTableSub = new THREE.Mesh(
        new THREE.BoxGeometry(110, 10, 20),
        new THREE.MeshStandardMaterial({
            color: 0xBB9172,
            roughness: 0.93,
            metalness: 0
        })
    );
    tvTableBySub.position.set(0, 0, -10);
    tvTableBySub.updateMatrix();
    tvTableSub.updateMatrix();
    const tvTable = CSG.subtract(tvTableBySub, tvTableSub);
    tvTable.position.set(100, 20, -150);
    tvGroup.add(tvTable);
    // the leg of tv table
    const tvTableLeg = new THREE.Mesh(
        new THREE.BoxGeometry(5, 25, 5),
        new THREE.MeshStandardMaterial({
            color: 0xBB9172,
            roughness: 0.93,
            metalness: 0
        })
    );
    tvTableLeg.position.set(45, 0, -140);
    const tvTableLeg2 = tvTableLeg.clone();
    tvTableLeg2.position.set(155, 0, -140);
    tvGroup.position.set(10, 25, -10);
    tvGroup.add(tvTableLeg, tvTableLeg2);
    tvGroup.name = 'televisionTable';
    initData.push({uuid: tvGroup.uuid, position: {x: tvGroup.position.x, y: tvGroup.position.y, z: tvGroup.position.z}, rotation: {x: tvGroup.rotation.x, y: tvGroup.rotation.y, z: tvGroup.rotation.z}, children: tvGroup.children});
    group.add(tvGroup);

    // load television
    loader.load('/models/television.glb', (gltf) => {
        const tv = gltf.scene;
        tv.scale.set(1.5, 1.5, 1.5);
        tv.position.set(80, 40, -180);
        tv.rotation.y = Math.PI / 2;
        tv.name = 'television';
        initData.push({uuid: tv.uuid, position: {x: tv.position.x, y: tv.position.y, z: tv.position.z}, rotation: {x: tv.rotation.x, y: tv.rotation.y, z: tv.rotation.z}, children: tv.children});
        group.add(tv);
    });
    

    // draw cabinet
    const cabinet = new THREE.Group();

    const cabinetFrame = new THREE.Mesh(
        new THREE.BoxGeometry(70, 70, 15),
        new THREE.MeshStandardMaterial({
            color: 0xD8B485,
            roughness: 0.4,
            metalness: 0
        })
    )
    cabinetFrame.position.z = 5;

    const cabinetDoor = new THREE.Mesh(
        new THREE.BoxGeometry(60, 10, 15),
        new THREE.MeshStandardMaterial({
            color: 0xD8B485,
            roughness: 0.4,
            metalness: 0
        })
    )
    cabinetDoor.position.set(0, 10, 7);
    const cabinetDoor2 = cabinetDoor.clone();
    cabinetDoor2.position.set(0, -10, 7);

    cabinet.add(cabinetFrame, cabinetDoor, cabinetDoor2);
    cabinet.rotation.y = Math.PI / 2;
    cabinet.position.set(5, 35, -100);
    cabinet.name = 'cabinet';
    initData.push({uuid: cabinet.uuid, position:{ x: cabinet.position.x, y: cabinet.position.y, z: cabinet.position.z}, rotation: {x: cabinet.rotation.x, y: cabinet.rotation.y, z: cabinet.rotation.z}, children: cabinet.children});
    group.add(cabinet);

    // sofa
    const sofa = drawSofa(90, 50, 50);
    sofa.position.set(80, 40, -100);
    initData.push({uuid: sofa.uuid, position: {x: sofa.position.x, y: sofa.position.y, z: sofa.position.z}, rotation: {x: sofa.rotation.x, y: sofa.rotation.y, z: sofa.rotation.z}, children: sofa.children});
    group.add(sofa);

    group.name = 'hallGroup';
    return group;
}

// draw kitchen
const drawKitchen = () => {
    const group = new THREE.Group();
    const wall1 = drawWall(200, 200, 1, [new THREE.Color(0xB8E4DA), new THREE.Color(0xF8ECD6), new THREE.Color(0xFFFEF8)]);
    wall1.rotation.y = -Math.PI / 2;
    wall1.position.set(-1, -5, -100);
    group.add(wall1);

    const wall2 = wall1.clone();
    wall2.position.set(-200, -5, -100);
    wall2.rotation.y = Math.PI / 2;
    group.add(wall2);

    const wall3 = drawWall(200, 200, 1, [new THREE.Color(0x8EC770), new THREE.Color(0xF8ECD6), new THREE.Color(0xFFFEF8)]);
    wall3.position.set(-100, -5, 0);
    wall3.rotation.y = Math.PI;
    group.add(wall3);

    const wall4 = wall3.clone();
    wall4.position.set(-100, -5, -200);
    wall4.rotation.y = Math.PI;
    group.add(wall4);


    // load kitchen tool
    loader.load('/models/kitchenTool1.glb', (gltf) => {
        const tool = gltf.scene;
        tool.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        tool.scale.set(1.5, 1.5, 1.5);
        tool.rotation.y = Math.PI / 2;
        tool.position.set(-45, -5, -70);
        tool.name = 'kitchenTool1';
        initData.push({uuid: tool.uuid, position: {x: tool.position.x, y: tool.position.y, z: tool.position.z}, rotation: {x: tool.rotation.x, y: tool.rotation.y, z: tool.rotation.z}, children: tool.children});
        group.add(tool);
    });
    // load kitchen tool2
    loader.load('/models/kitchenTool2.glb', (gltf) => {
        const tool = gltf.scene;
        tool.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        tool.scale.set(1.2, 1.2, 1.2);
        tool.rotation.y = Math.PI / 2;
        tool.position.set(-130, 10, -110);
        tool.name = 'kitchenTool2';
        initData.push({uuid: tool.uuid, position: {x: tool.position.x, y: tool.position.y, z: tool.position.z}, rotation: {x: tool.rotation.x, y: tool.rotation.y, z: tool.rotation.z}, children: tool.children});
        group.add(tool);
    });

    // load exhuast fan
    loader.load('/models/exhaustFan.glb', (gltf) => {
        const fan = gltf.scene;
        fan.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        fan.scale.set(1.2, 1.2, 1.2);
        fan.rotation.y = Math.PI / 2;
        fan.position.set(-166, 80, -120);
        fan.name = 'exhaustFan';
        initData.push({uuid: fan.uuid, position: {x: fan.position.x, y: fan.position.y, z: fan.position.z}, rotation: {x: fan.rotation.x, y: fan.rotation.y, z: fan.rotation.z}, children: fan.children});
        group.add(fan);
    });

    // load fridge
    loader.load('/models/fridge.glb', (gltf) => {
        const fridge = gltf.scene;  
        fridge.scale.set(1.2, 1.2, 1.2);
        fridge.rotation.y = Math.PI / 2;
        fridge.position.set(-205, 5, -50);
        fridge.name = 'fridge';
        initData.push({uuid: fridge.uuid, position: {x: fridge.position.x, y: fridge.position.y, z: fridge.position.z}, rotation: {x: fridge.rotation.x, y: fridge.rotation.y, z: fridge.rotation.z}, children: fridge.children});
        group.add(fridge);
    });
    

    return group;
}


// draw bedroom
const drawBedroom = () => {
    const group = new THREE.Group();
    const wall1 = drawWall(300, 200, 1, [new THREE.Color(0xF8ECD6), new THREE.Color(0xF8ECD6), new THREE.Color(0xFFFEF8)]);
    // wall1.rotation.y = -Math.PI / 2;
    wall1.position.set(-50, -5, 1);
    group.add(wall1);

    const wall2 = wall1.clone();
    wall2.position.set(-50, -5, 200);
    wall2.rotation.y = Math.PI;
    group.add(wall2);

    const wall3 = drawWall(200, 200, 1, [new THREE.Color(0xF3B966), new THREE.Color(0xF8ECD6), new THREE.Color(0xFFFEF8)]);
    wall3.position.set(100, -5, 100);
    wall3.rotation.y = -Math.PI / 2;
    group.add(wall3);

    const wall4 = wall3.clone();
    wall4.position.set(-200, -5, 100);
    wall4.rotation.y = Math.PI / 2;
    group.add(wall4);

    // load bed
    loader.load('/models/bed.glb', (gltf) => {
        const bed = gltf.scene;
        bed.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        bed.scale.set(1.8, 1.8, 1.8);
        bed.rotation.y = Math.PI / 2;
        bed.position.set(-165, 25, 130);
        bed.name = 'bed';
        initData.push({uuid: bed.uuid, position: {x: bed.position.x, y: bed.position.y, z: bed.position.z}, rotation: {x: bed.rotation.x, y: bed.rotation.y, z: bed.rotation.z}, children: bed.children});
        group.add(bed);
    });

    const circleChair = drawCircleChair();
    circleChair.position.set(-180, 25, 20);
    initData.push({uuid: circleChair.uuid, position: {x: circleChair.position.x, y: circleChair.position.y, z: circleChair.position.z}, rotation: {x: circleChair.rotation.x, y: circleChair.rotation.y, z: circleChair.rotation.z}, children: circleChair.children});
    const circleChair2 = circleChair.clone();
    circleChair2.position.set(-180, 25, 180);
    initData.push({uuid: circleChair2.uuid, position: {x: circleChair2.position.x, y: circleChair2.position.y, z: circleChair2.position.z}, rotation: {x: circleChair2.rotation.x, y: circleChair2.rotation.y, z: circleChair2.rotation.z}, children: circleChair2.children});
    group.add(circleChair);
    group.add(circleChair2);

    // load white chair
    loader.load('/models/whiteChair.glb', (gltf) => {
        const chair = gltf.scene;
        chair.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        chair.scale.set(1.5, 1.5, 1.5);
        chair.rotation.y = Math.PI / 2;
        chair.position.set(45, 20, 90);
        chair.name = 'whiteChair';
        initData.push({uuid: chair.uuid, position: {x: chair.position.x, y: chair.position.y, z: chair.position.z}, rotation: {x: chair.rotation.x, y: chair.rotation.y, z: chair.rotation.z}, children: chair.children});
        const chair2 = chair.clone();
        chair2.position.set(40, 20, 150);
        chair2.rotation.y = - Math.PI / 2;
        initData.push({uuid: chair2.uuid, position: {x: chair2.position.x, y: chair2.position.y, z: chair2.position.z}, rotation: {x: chair2.rotation.x, y: chair2.rotation.y, z: chair2.rotation.z}, children: chair2.children});
        group.add(chair, chair2);
    });

    // load green chair
    loader.load('/models/greenChair.glb', (gltf) => {
        const chair = gltf.scene;
        chair.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        chair.scale.set(1.5, 1.5, 1.5);
        chair.rotation.y = Math.PI / 2;
        chair.position.set(80, 0, 100);
        chair.name = 'greenChair';
        initData.push({uuid: chair.uuid, position: {x: chair.position.x, y: chair.position.y, z: chair.position.z}, rotation: {x: chair.rotation.x, y: chair.rotation.y, z: chair.rotation.z}, children: chair.children});
        group.add(chair);
    });

    // load fruitPlatter
    loader.load('/models/fruitPlatter.glb', (gltf) => {
        const platter = gltf.scene;
        platter.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        // platter.scale.set(1.5, 1.5, 1.5);
        platter.rotation.y = Math.PI / 2;
        platter.position.set(30, 20, 140);
        platter.name = 'fruitPlatter';
        initData.push({uuid: platter.uuid, position: {x: platter.position.x, y: platter.position.y, z: platter.position.z}, rotation: {x: platter.rotation.x, y: platter.rotation.y, z: platter.rotation.z}, children: platter.children});
        group.add(platter);
    });

    // draw door
    const door = drawDoor(60, 150, 2)
    door.position.set(-50, 80, 2);
    door.rotation.y = Math.PI;
    initData.push({uuid: door.uuid, position: {x: door.position.x, y: door.position.y, z: door.position.z}, rotation: {x: door.rotation.x, y: door.rotation.y, z: door.rotation.z}, children: door.children});
    group.add(door);

    const door2 = door.clone();
    door2.position.set(99, 75, 90);
    door2.rotation.y = Math.PI / 2;
    initData.push({uuid: door2.uuid, position: {x: door2.position.x, y: door2.position.y, z: door2.position.z}, rotation: {x: door2.rotation.x, y: door2.rotation.y, z: door2.rotation.z}, children: door2.children});
    group.add(door2);

    // draw frame
    const frame = drawFrame(90, 70, 1, [new THREE.Color(0xEEDAB4), new THREE.Color(0xF8ECD6), new THREE.Color(0xAAAAAA)]);
    frame.position.set(-40, 110, 197);
    // frame.rotation.y = Math.PI;
    initData.push({uuid: frame.uuid, position: {x: frame.position.x, y: frame.position.y, z: frame.position.z}, rotation: {x: frame.rotation.x, y: frame.rotation.y, z: frame.rotation.z}, children: frame.children});
    group.add(frame);
    
    return group;
}


// draw toilet
const drawBathroom = () => {
    const group = new THREE.Group();
    const wall1 = drawWall(200, 200, 1, [new THREE.Color(0xC3C2BC), new THREE.Color(0xF8ECD6), new THREE.Color(0xFFFEF8)]);
    wall1.position.set(200, -5, 100);
    wall1.rotation.y = -Math.PI / 2;
    group.add(wall1);    

    const wall2 = wall1.clone();    
    wall2.position.set(101, -5, 100);
    wall2.rotation.y = Math.PI / 2;
    group.add(wall2);

    const wall3 = drawWall(100, 200, 1, [new THREE.Color(0xC3C2BC), new THREE.Color(0xF8ECD6), new THREE.Color(0xFFFEF8)]);
    wall3.position.set(150, -5, 200);
    wall3.rotation.y = -Math.PI;
    group.add(wall3);

    // load sink
    loader.load('/models/sink.glb', (gltf) => {
        const sink = gltf.scene;
        sink.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        sink.scale.set(1.5, 1.5, 1.5);
        sink.rotation.y = Math.PI / 2;
        sink.position.set(205, -5, 80);
        sink.name = 'sink';
        initData.push({uuid: sink.uuid, position: {x: sink.position.x, y: sink.position.y, z: sink.position.z}, rotation: {x: sink.rotation.x, y: sink.rotation.y, z: sink.rotation.z}, children: sink.children});
        group.add(sink);
    })

    // load toilet
    loader.load('/models/toilet.glb', (gltf) => {
        const toilet = gltf.scene;
        toilet.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        toilet.scale.set(1.5, 1.5, 1.5);
        toilet.rotation.y = Math.PI / 2;
        toilet.position.set(68, -15, 20);
        toilet.name = 'toilet';
        initData.push({uuid: toilet.uuid, position: {x: toilet.position.x, y: toilet.position.y, z: toilet.position.z}, rotation: {x: toilet.rotation.x, y: toilet.rotation.y, z: toilet.rotation.z}, children: toilet.children});
        group.add(toilet);
    })


    // load garbege
    loader.load('/models/garbage.glb', (gltf) => {
        const garbage = gltf.scene;
        garbage.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        garbage.scale.set(1.5, 1.5, 1.5);
        garbage.rotation.y = Math.PI / 2;
        garbage.position.set(160, -5, 0);
        garbage.name = 'garbage';
        initData.push({uuid: garbage.uuid, position: {x: garbage.position.x, y: garbage.position.y, z: garbage.position.z}, rotation: {x: garbage.rotation.x, y: garbage.rotation.y, z: garbage.rotation.z}, children: garbage.children});
        group.add(garbage);
    })

    // load bath
    loader.load('/models/bath.glb', (gltf) => {
        const bath = gltf.scene;
        bath.traverse(child => {
            if (child instanceof THREE.Mesh) child.receiveShadow = true
        })
        bath.scale.set(1.5, 1.5, 1.5);
        bath.rotation.y = Math.PI / 2;
        bath.position.set(170, 20, 150);
        bath.name = 'bath&unmoveable';
        group.add(bath);
    })

    // draw door
    const door = drawDoor(60, 150, 2)
    door.position.set(102, 80, 90);
    door.rotation.y = -Math.PI / 2;
    initData.push({uuid: door.uuid, position: {x: door.position.x, y: door.position.y, z: door.position.z}, rotation: {x: door.rotation.x, y: door.rotation.y, z: door.rotation.z}, children: door.children});
    group.add(door);

    // draw frame
    const frame = drawFrame(50, 60, 1, [new THREE.Color(0xEEDAB4), new THREE.Color(0xF8ECD6), new THREE.Color(0xAAAAAA)]);
    frame.position.set(196, 120, 80);
    frame.rotation.y = Math.PI / 2;
    initData.push({uuid: frame.uuid, position: {x: frame.position.x, y: frame.position.y, z: frame.position.z}, rotation: {x: frame.rotation.x, y: frame.rotation.y, z: frame.rotation.z}, children: frame.children});
    group.add(frame);

    return group;

}

// loading manage 
const loadManage = () => {
    // const manager = new THREE.LoadingManager();
    // manager.onProgress = function (item, loaded, total) {
    //     console.log(item, loaded, total);
    // };
    THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
        console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
}

// select buildings to add glith pass by mouse click and follow the mouse
const selectBuilding = (camera: THREE.Camera, scene: THREE.Scene, outlinePass: OutlinePass) => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedGroup: THREE.Group = [];
    document.addEventListener('click', function (event) {    
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        // console.log(intersects);
        if (intersects.length > 0) {
            // 获取点击的物体
            const clickedObject = intersects[0].object;
            // outlinePass.selectedObjects = [clickedObject];
            // console.log(clickedObject);
            // 查找点击物体所属的 Group
            if (clickedObject.parent instanceof THREE.Group) {
                selectedGroup = clickedObject.parent;
            }

            // 如果点击的是 Group 中的物体，则高亮整个 Group
            if (selectedGroup && !selectedGroup.name.includes('unmoveable')) {
                const selectedObjects: THREE.Mesh[] = [];
                selectedGroup.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        selectedObjects.push(child);
                    }
                });
                outlinePass.selectedObjects = selectedObjects;
                // console.log(intersects);
                // selectedObjects.forEach((item) => {
                //     console.log(item.name);
                // })
            }

        }
    });

    return selectedGroup;
}

// modification controller
const data = {
    rx: 0,
    ry: 0,
    rz: 0,
    color: new THREE.Color(0xAAAAAA).getHex(),
    opacity: 1
};
let controllers: Array<any> = [];
const initController = (selectedGroup: THREE.Group, gui: dat.GUI) => {
    // if(!selectedGroup.children.length) return;
    // mesh properties
    data.rx = selectedGroup.rotation.x;
    data.ry = selectedGroup.rotation.y;
    data.rz = selectedGroup.rotation.z;
    data.color = new THREE.Color(0xAAAAAA).getHex();
    data.opacity = 1;
    controllers.push(gui.add(data, 'rx', -Math.PI / 2, Math.PI / 2).name('x轴').onChange((value: number) => {
        selectedGroup.rotation.x = value;
    }))
    controllers.push(gui.add(data, 'ry', -Math.PI / 2, Math.PI / 2).name('y轴').onChange((value: number) => {
        selectedGroup.rotation.y = value;
    }))
    controllers.push(gui.add(data, 'rz', -Math.PI / 2, Math.PI / 2).name('z轴').onChange((value: number) => {
        selectedGroup.rotation.z = value;
    }))
    
    controllers.push(gui.addColor(data, 'color').name('颜色').onChange((value: THREE.Color) => {
        selectedGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material.color.set(value);
            }
        })
    }))
    controllers.push(gui.add(data, 'opacity', 0, 1).name('透明度').onChange((value: THREE.Color) => {
        selectedGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material.opacity = value;
            }
        })
    }))
}
const updateController = (selectedGroup: THREE.Group, gui: dat.GUI, useGroupData: any) => {
    if(!selectedGroup.children.length) return;
    // remove old controller
    controllers.forEach((item) => {
        gui.remove(item);
    })
    controllers = [];
    let color: THREE.Color, opacity: number;
    selectedGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            color = child.material.color;
            opacity = child.material.opacity;
            return;
        }
    })
    // mesh properties
    data.rx = selectedGroup.rotation.x;
    data.ry = selectedGroup.rotation.y;
    data.rz = selectedGroup.rotation.z;
    data.color = color.getHex();
    data.opacity = opacity;
    // gui.updateDisplay();
    controllers.push(gui.add(data, 'rx', 0, Math.PI * 2).name('x轴').onChange((value: number) => {
        selectedGroup.rotation.x = value;
    }))
    controllers.push(gui.add(data, 'ry', 0, Math.PI * 2).name('y轴').onChange((value: number) => {
        selectedGroup.rotation.y = value;
    }))
    controllers.push(gui.add(data, 'rz', 0, Math.PI * 2).name('z轴').onChange((value: number) => {
        selectedGroup.rotation.z = value;
    }))
    
    controllers.push(gui.addColor(data, 'color').name('颜色').onChange((value: THREE.Color) => {
        selectedGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material.color.set(value);
            }
        })
    }))
    controllers.push(gui.add(data, 'opacity', 0, 1).name('透明度').onChange((value: THREE.Color) => {
        selectedGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material.transparent = true;
                child.material.opacity = value;
            }
        })
    }))


    selectedGroup.isChanged = true;
    // useGroupData.addInitialGroupData({
    //     uuid: selectedGroup.uuid,
    //     position: { x: selectedGroup.position.x, y: selectedGroup.position.y, z: selectedGroup.position.z },
    //     rotation: { x: selectedGroup.rotation.x, y: selectedGroup.rotation.y, z: selectedGroup.rotation.z },
    //     children: selectedGroup.children
    // });
    // console.log(selectedGroup.isChanged);
}

// save intial group data
type TGroupData = {
    uuid: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    children: Array<any>;
};

const saveInitialGroupData = (scene: THREE.Scene, useGroupData: any) => {
    let initialGroupData: Array<TGroupData> = [];
    scene.traverse((child) => {
        if (child instanceof THREE.Group && !child.name.includes('unmoveable')) {

            initialGroupData.push({
                uuid: child.uuid,
                position: { x: child.position.x, y: child.position.y, z: child.position.z },
                rotation: { x: child.rotation.x, y: child.rotation.y, z: child.rotation.z },
                children: child.children
            })
        }
    })
    useGroupData.setInitialGroupData(initialGroupData);
    return initialGroupData;
}

// reset scene
const resetScene = (scene: THREE.Scene, useGroupData: any) => {
    // const initialGroupData = useGroupData.initialGroupData;
    
    // initialGroupData.forEach((item: TGroupData) => {
    //     const group = scene.getObjectByProperty('uuid', item.uuid);
    //     // console.log(group?.isChanged);
    //     if (group && group.isChanged) {
    //         console.log(group.name);
    //         group.position.set(item.position.x, item.position.y, item.position.z);
    //         group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
    //         // console.log(item);
    //         group.isChanged = false;
    //         // group.clear();
    //         // group.add(...item.children);
    //     }
    // })
    initData.forEach((item) => {
        const group = scene.getObjectByProperty('uuid', item.uuid);
        // console.log(group?.isChanged);
        if (group && group.isChanged) {
            // console.log(item.position.x);
            group.position.set(item.position.x, item.position.y, item.position.z);
            group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            // console.log(item);
            group.isChanged = false;
            // group.clear();
            // group.add(...item.children);
        }
    })

    const newChildren = [];
    // remove all new models
    scene.traverse((child) => {
        if (child?.isNew) newChildren.push(child);
    })
    newChildren.forEach((child) => {
        scene.remove(child);
    })
}


// add model
const addModel = (scene: THREE.Scene, name: string) => {
    if(name === '沙发1') {
        const sofa = (scene.getObjectByName('sofaGroup') as THREE.Group).clone();
        console.log(sofa);
        // const sofa = drawSofa(90, 50, 50);
        sofa.position.set(5, 30, 45);
        sofa.isNew = true;
        scene.add(sofa);
    }
    if(name === '柜子1') {
        const cabinet = (scene.getObjectByName('cabinet') as THREE.Group).clone();
        cabinet.position.set(-5, 30, 45);
        cabinet.isNew = true;
        scene.add(cabinet);
    }
    
}

export {
    drawFloor,
    drawWall,
    drawHall,
    selectBuilding,
    drawKitchen,
    drawBedroom,
    drawBathroom,
    loadManage,
    initController,
    updateController,
    saveInitialGroupData,
    resetScene,
    addModel
}