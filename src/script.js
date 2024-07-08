import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'



document.addEventListener("DOMContentLoaded", function() {
    // Create Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("White");
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('three-container').appendChild(renderer.domElement);

    // add directional light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 10);
    scene.add(light);

    //setup model loader
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    
    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)
    
    let meshName,model;
    const initModelPos = new THREE.Vector3(0,0,0)
    const initModelScale = new THREE.Vector3(0.007,0.007,0.007)

    function modelLoader()
    {
       gltfLoader.load(                
           '3D/right_bone_structure1.glb',
           (gltf) =>
           {
               gltf.scene.position.set(initModelPos.x, initModelPos.y, initModelPos.z)
               gltf.scene.scale.set(initModelScale.x, initModelScale.y, initModelScale.z)
   
               model = gltf.scene
               model.traverse( (child) => {
                   if(child instanceof THREE.Mesh)  //original : child.name === 'polySurface1001_3'
                   {
                        child.material.transparent = true;
                        child.material.opacity = 0.5;
                        meshName = child.name
                   }
               })
   
   
               //update camera rotation
               camera.lookAt(model.position);
   
               scene.add(model);
           }
       )
   }
   modelLoader()
   

    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Create radio buttons and other elements
    const container = document.getElementById("radio-container");
    let activeSetButton = null;
    const points = new Map();  // Map to store points associated with each radio button
    const pointsArray = ["Femur center","Hip center","Femur Proximal Canal","Femur Distal Canal","Medial Epicondyle","Lateral Epicondyle","Distal Medial Point","Distal Lateral Point","Posterior Medial Point","Posterior Lateral Point"];    //array of the landmark points
    const savedPoints = new Set(); // Set to track saved radio buttons
    const pointColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500, 0x800080, 0x008080, 0x808080]; // Colors for points
    const lineColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00]; // Colors for lines
    const lineNames = ["Mechanical Axis", "Anatomical Axis", "Femoral Axis", "Trans epicondyle Axis(TEA)", "Posterior condyle Axis(PCA)"]; // Names for lines
    const cylinders = []; // Store references to the cylinders

    // Create the update button and disable it initially
    const leftContainer = document.getElementById("left-container");
    const rightContainer = document.getElementById("right-container");
    const right_section_1 = document.getElementById("right-section-1");
    const right_section_2 = document.getElementById("right-section-2");
    const right_section_3 = document.getElementById("right-section-3");
    const right_section_4 = document.getElementById("right-section-4");

    const updateButton = document.createElement("button");
    updateButton.textContent = "Update";
    updateButton.disabled = true;
    updateButton.style.marginTop = "20px";
    leftContainer.appendChild(updateButton);

    //Create plane buttons
    const createPlaneButton = document.createElement("button");
    createPlaneButton.textContent = "Create Plane Perpendicular to Mechanical Axis";
    createPlaneButton.id = "create-plane-button";
    createPlaneButton.disabled = true;
    leftContainer.appendChild(createPlaneButton); // Assuming 'container' is your button container

    function createCylinderBetweenPoints(point1, point2, color,name) {
        const direction = new THREE.Vector3().subVectors(point2.position, point1.position);
        const orientation = new THREE.Matrix4();
        const offsetRotation = new THREE.Matrix4();
        orientation.lookAt(point1.position, point2.position, new THREE.Object3D().up);
        offsetRotation.makeRotationX(Math.PI / 2);
        orientation.multiply(offsetRotation);
        const cylinderGeometry = new THREE.CylinderGeometry(0.01, 0.01, direction.length(), 8, 1);
        const material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
        const cylinder = new THREE.Mesh(cylinderGeometry, material);
        cylinder.applyMatrix4(orientation);
        cylinder.position.copy(point1.position).add(point2.position).multiplyScalar(0.5);
        scene.add(cylinder);

        //update the information
        updateStatusText(`${name} created`);

        return cylinder;
    }

    function updateCylinders() {
        // Clear existing cylinders first
        cylinders.forEach(cylinder => {
            scene.remove(cylinder);
            cylinder.geometry.dispose();
            cylinder.material.dispose();
        });
        cylinders.length = 0;  // Clear the array

        // Pairs that need to be connected
        const pairs = [
            [1, 2],
            [3, 4],
            [5, 6],
            [9, 10]
        ];

        // Create new cylinders for each pair
        pairs.forEach((pair, index) => {
            const point1 = points.get(pair[0] - 1);
            const point2 = points.get(pair[1] - 1);
            if (point1 && point2) {
                const cylinder = createCylinderBetweenPoints(point1, point2, lineColors[index],lineNames[index]);
                cylinders.push(cylinder);
            }
        });
    }
    updateButton.addEventListener("click", function() {
        const pairs = [
            [1, 2],
            [3, 4],
            [5, 6],
            [9, 10]
        ];

        pairs.forEach((pair, index) => {
            const point1 = points.get(pair[0] - 1);
            const point2 = points.get(pair[1] - 1);

            if (point1 && point2) {
                const cylinder = createCylinderBetweenPoints(point1, point2, lineColors[index]);
                cylinders.push(cylinder);
            }
        });

        //activate the create plane button
        createPlaneButton.disabled = false;

        //update status text
        updateStatusText("Landmarks updated - now you can create perpendicular plane to Mechanical Axis");
    });

    for (let i = 0; i < 10; i++) {
        const buttonGroup = document.createElement("div");
        buttonGroup.classList.add("button-group");

        const radioButton = document.createElement("input");
        radioButton.type = "radio";
        radioButton.name = "radio-group";
        radioButton.id = `radio-${i}`;
        radioButton.value = i;

        if (i === 0) {
            radioButton.checked = true;
        }

        const setButton = document.createElement("button");
        setButton.textContent = "Set";
        setButton.id = `set-${i}`;

        if (i === 0) {
            setButton.disabled = false;
            activeSetButton = setButton;
            updateStatusText(`Landmarks setup - click on bone and then save`);
        } else {
            setButton.disabled = true;
        }

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.id = `save-${i}`;
        saveButton.disabled = i !== 0;
        
        const label = document.createElement("label");
        label.htmlFor = radioButton.id;
        // label.textContent = `Button ${i + 1}`;
        label.textContent = `${pointsArray[i]}`;


        radioButton.addEventListener("change", function() {
            document.querySelectorAll("button[id^='set-']").forEach(btn => btn.disabled = true);
            document.querySelectorAll("button[id^='save-']").forEach(btn => btn.disabled = true);
            setButton.disabled = false;
            saveButton.disabled = false;
            activeSetButton = setButton;

            // Update drag controls to only enable dragging for the current point
            updateDragControls();
        });

        setButton.addEventListener("click", function() {
            activeSetButton = setButton;
            // updateStatusText(`${pointsArray[i]} setup`);
            updateStatusText(`Landmarks setup - click on bone and then save`);

        });

        saveButton.addEventListener("click", function() {
            const nextIndex = (i + 1) % 10;
            document.getElementById(`radio-${nextIndex}`).checked = true;
            document.getElementById(`set-${nextIndex}`).disabled = false;
            document.getElementById(`save-${nextIndex}`).disabled = false;
            setButton.disabled = true;
            saveButton.disabled = true;
            activeSetButton = document.getElementById(`set-${nextIndex}`);

            // Mark the current radio button as saved
            savedPoints.add(i);

            // Check if all points are saved
            if (savedPoints.size === 10) {
                updateButton.disabled = false;
            }

            updateDragControls();

        });

        buttonGroup.appendChild(label);
        buttonGroup.appendChild(radioButton);
        buttonGroup.appendChild(setButton);
        buttonGroup.appendChild(saveButton);

        container.appendChild(buttonGroup);
    }

    // Function to add point (small sphere) to the cylinder
    function addPointToObject(intersect, radioIndex) {
        if (points.has(radioIndex)) {
            // Remove the existing point if it exists
            scene.remove(points.get(radioIndex));
        }

        const pointGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        const pointMaterial = new THREE.MeshBasicMaterial({ color: pointColors[radioIndex] });
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.copy(intersect.point);
        scene.add(point);

        // Store the new point
        points.set(radioIndex, point);
        updateDragControls();
        updateCylinders(); // Update cylinders when points are moved

        // updateStatusText(`Use drag controls to move the point`);
    }

    // Raycaster and mouse for detecting clicks on the cylinder
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseClick(event) {
        if (!activeSetButton) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(model);

        if (intersects.length > 0) {
            const radioIndex = parseInt(activeSetButton.id.split('-')[1], 10);
            addPointToObject(intersects[0], radioIndex);
        }
    }

    window.addEventListener('click', onMouseClick);

    // Function to update drag controls
    function updateDragControls() {
        const dragObjects = [];
        const radioIndex = parseInt(activeSetButton.id.split('-')[1], 10);

        if (points.has(radioIndex)) {
            dragObjects.push(points.get(radioIndex));
        }

        const dragControls = new DragControls(dragObjects, camera, renderer.domElement);
        dragControls.addEventListener('dragstart', function(event) {
            controls.enabled = false;
        });
        dragControls.addEventListener('dragend', function(event) {
            controls.enabled = true;
            updateCylinders(); // Update cylinders when points are dragged
        });
    }

    //Step 4-1
    function createPerpendicularPlane(point1, point2) {
        // Calculate the direction vector from point1 to point2
        const direction = new THREE.Vector3().subVectors(point2.position, point1.position);

        // Create the plane geometry; this might be large to be visible appropriately
        const planeGeometry = new THREE.PlaneGeometry(5, 5);  // Adjust size as needed
        const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(planeMesh);

        // Align the normal of the plane with the direction vector
        // We use Point 1's position to make sure the plane passes through it
        planeMesh.position.copy(point1.position);
        planeMesh.lookAt(new THREE.Vector3().addVectors(point1.position, direction));

        // Define the mathematical plane for later use in projections
        const plane = new THREE.Plane();
        direction.normalize();  // Normalize the direction vector to use as a normal
        plane.setFromNormalAndCoplanarPoint(direction, point1.position);

        return { mesh: planeMesh, plane: plane };
    }

    let planeDetails; // Store the plane details here
    createPlaneButton.addEventListener("click", function() {
        // Check if points for the first pair exist
        const point1 = points.get(0); // Ensure these points exist in your map
        const point2 = points.get(1);
        if (point1 && point2) {
            planeDetails = createPerpendicularPlane(point1, point2);

            //activate the next button
            projectLineButton.disabled = false;
        } else {
            updateStatusText("Points for creating the plane are not defined.");
        }
    });

    //step 4-2
    function projectLineOntoPlane(pointA, pointB, plane) {
        // Create vectors for the original points
        const projectedPointA = new THREE.Vector3();
        const projectedPointB = new THREE.Vector3();
        
        // Project the start and end points onto the plane
        plane.projectPoint(pointA.position, projectedPointA);
        plane.projectPoint(pointB.position, projectedPointB);
        
        // Calculate the direction vector from projectedPointA to projectedPointB
        const direction = new THREE.Vector3().subVectors(projectedPointB, projectedPointA);
        const length = direction.length();  // Length of the cylinder
        direction.normalize();  // Normalize the direction vector for rotation calculation

        // Create cylinder geometry to represent the projected line
        const radius = 0.02; // Very thin radius
        const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, length, 32);
        const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        
        // Position and orient the cylinder correctly
        const orientation = new THREE.Matrix4(); // A new matrix to orient the cylinder
        const offsetRotation = new THREE.Matrix4(); // A matrix to correct cylinder's default alignment
        orientation.lookAt(projectedPointA, projectedPointB, new THREE.Object3D().up);
        offsetRotation.makeRotationX(Math.PI / 2);
        orientation.multiply(offsetRotation); // Combine rotations to align correctly
        cylinder.applyMatrix4(orientation);

        // Set the position of the cylinder to the midpoint of the segment
        cylinder.position.copy(projectedPointA).add(projectedPointB).multiplyScalar(0.5);

        // Add the cylinder to the scene
        scene.add(cylinder);
        return cylinder;
    }

    // Button to project line between Point 5 and Point 6 onto the created plane
    const projectLineButton = document.createElement("button");
    projectLineButton.textContent = "Project TEA on perpendicular plane";
    projectLineButton.disabled = true;
    projectLineButton.onclick = function() {
        const point5 = points.get(4); // Assuming 0-indexed, adjust if necessary
        const point6 = points.get(5);
        if (point5 && point6 && planeDetails.plane) {
            projectLineOntoPlane(point5, point6, planeDetails.plane);

            //enable the next button
            createAnteriorLineButton.disabled = false;
        } else {
            updateStatusText("Required points or plane not defined.");
        }
    };
    leftContainer.appendChild(projectLineButton);


    //Step 4-3
    // let valgusPlaneDetails;  // Store the plane details here
    let anteriorLine;  // Store the anterior line mesh here

    let perpendicularDirection;
    function createAnteriorLine(point, direction, length) {
        const up = new THREE.Vector3(0, 1, 0); // Using Y-axis as arbitrary up vector
        const lineDirection = new THREE.Vector3().subVectors(camera.position, point.position).normalize(); // Direction towards the camera
        perpendicularDirection = new THREE.Vector3().crossVectors(direction, lineDirection).normalize(); // Perpendicular to both

        // Create geometry and material for the line
        const lineGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 32);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);

        // Align and position the line
        const orientation = new THREE.Matrix4();
        const offsetRotation = new THREE.Matrix4();
        orientation.lookAt(new THREE.Vector3(), perpendicularDirection, up);
        offsetRotation.makeRotationX(Math.PI / 2);
        orientation.multiply(offsetRotation);
        lineMesh.applyMatrix4(orientation);
        lineMesh.position.copy(point.position).add(perpendicularDirection.multiplyScalar(length / 2));

        scene.add(lineMesh);

        return lineMesh;
    }

    const createAnteriorLineButton = document.createElement("button");
    createAnteriorLineButton.textContent = "Create Anterior Line";
    createAnteriorLineButton.disabled = true;
    createAnteriorLineButton.addEventListener("click", function() {
        const point1 = points.get(0); // Make sure this point is already defined
        if (!point1 || !planeDetails || !planeDetails.plane) {
            updateStatusText("Required elements (point or plane) are not defined.");
            return;
        }
        const direction = new THREE.Vector3().subVectors(points.get(1).position, point1.position).normalize(); // Direction from point 1 to point 2
        anteriorLine = createAnteriorLine(point1, direction, 0.1); // Length set to 10 units
        //enable next button
        valgusPlaneButton.disabled = false;

    });
    leftContainer.appendChild(createAnteriorLineButton);

    //Step 4-4-1
    function createValgusPlane(originalPlane) {
        if (!originalPlane) {
            updateStatusText("No plane to duplicate!");
            return;
        }

        // Create a new mesh with the same geometry and material
        const planeGeometry = originalPlane.geometry.clone();
        const planeMaterial = originalPlane.material.clone();
        const duplicatedPlane = new THREE.Mesh(planeGeometry, planeMaterial);

        // Copy the position, rotation, and scale
        duplicatedPlane.position.copy(originalPlane.position);
        duplicatedPlane.rotation.copy(originalPlane.rotation);
        duplicatedPlane.scale.copy(originalPlane.scale);

        // Add the duplicated plane to the scene
        scene.add(duplicatedPlane);
    }

    const valgusPlaneButton = document.createElement("button");
    valgusPlaneButton.textContent = "Create Valgus Plane";
    valgusPlaneButton.disabled = true;
    valgusPlaneButton.addEventListener("click", function() {
        if (!planeDetails || !planeDetails.mesh) {
            updateStatusText("No existing plane to duplicate!");
            return;
        }
        createValgusPlane(planeDetails.mesh);

        //enable next button
        rotatePositiveBtn.disabled = false;
        rotateNegativeBtn.disabled = false;

        createLateralLineButton.disabled = false;
    });
    leftContainer.appendChild(valgusPlaneButton);

    //Step 4-1-2
    function rotatePlane(angle) {
        if (!planeDetails || !planeDetails.mesh) {
            updateStatusText("No plane available to rotate!");
            return;
        }

        // Convert angle from degrees to radians for rotation
        const radians = THREE.MathUtils.degToRad(angle);
        const quaternion = new THREE.Quaternion();
        const rotationAxis = perpendicularDirection; // Use the previously calculated perpendicular direction
        quaternion.setFromAxisAngle(rotationAxis, radians);
        planeDetails.mesh.applyQuaternion(quaternion);

        // Update line based on new plane orientation
        const point1 = points.get(0); // Reuse the existing point
        const direction = new THREE.Vector3().subVectors(points.get(1).position, point1.position).normalize();
        scene.remove(anteriorLine); // Remove old line from scene
        anteriorLine = createAnteriorLine(point1, direction, 0.1, planeDetails.mesh); // Recreate line based on new orientation
    }

    const rotatePositiveBtn = document.createElement("button");
    rotatePositiveBtn.textContent = "Rotate valgus plane +";
    rotatePositiveBtn.disabled = true;
    rotatePositiveBtn.addEventListener("click", function() {
        rotatePlane(5); // Rotate by 5 degrees positively
    });
    right_section_1.appendChild(rotatePositiveBtn);

    const rotateNegativeBtn = document.createElement("button");
    rotateNegativeBtn.textContent = "Rotate valgus plane -";
    rotateNegativeBtn.disabled = true;
    rotateNegativeBtn.addEventListener("click", function() {
        rotatePlane(-5); // Rotate by 5 degrees negatively
    });
    right_section_1.appendChild(rotateNegativeBtn);

    rightContainer.appendChild(right_section_1);

    //Step 4-2
    function createLateralLine(point1, planeMesh, anteriorLine, length) {
        if (!anteriorLine || !planeMesh) {
            updateStatusText("Anterior line or plane not available.");
            return;
        }

        // Extracting direction from the anterior line
        const start = new THREE.Vector3().fromBufferAttribute(anteriorLine.geometry.attributes.position, 0);
        const end = new THREE.Vector3().fromBufferAttribute(anteriorLine.geometry.attributes.position, 1);
        let anteriorDirection = new THREE.Vector3().subVectors(end, start).normalize();

        // Getting the plane normal from its orientation
        const planeNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(planeMesh.quaternion);

        // Lateral direction as cross product to ensure it lies on the plane and is perpendicular to the anterior line
        let lateralDirection = new THREE.Vector3().crossVectors(planeNormal, anteriorDirection).normalize();

        // Check if lateral direction needs adjustment (e.g., if the result is zero length due to parallel vectors)
        if (lateralDirection.length() === 0) {
            lateralDirection = planeNormal.clone(); // This case should not occur if anterior is correctly on the plane and not aligned with the normal
        }

        // Create the geometry for the lateral line
        const lineGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 32);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const lateralLine = new THREE.Mesh(lineGeometry, lineMaterial);

        // Orienting and positioning the lateral line
        const orientation = new THREE.Matrix4();
        orientation.lookAt(start, start.clone().add(lateralDirection), planeNormal);
        lateralLine.geometry.applyMatrix4(orientation);
        lateralLine.position.copy(start);

        scene.add(lateralLine);
        return lateralLine;
    }

    const createLateralLineButton = document.createElement("button");
    createLateralLineButton.textContent = "Create Lateral Line";
    createLateralLineButton.disabled = true;
    createLateralLineButton.addEventListener("click", function() {
        const point1 = points.get(0); // Assuming this is already defined
        if (!point1 || !planeDetails || !planeDetails.mesh || !anteriorLine) {
            updateStatusText("Essential elements are missing.");
            return;
        }
        // Call the function with an example length of 10 units
        createLateralLine(point1, planeDetails.mesh, anteriorLine, 0.1);

        //enable next button
        createFlexionPlaneButton.disabled = false;
    });
    leftContainer.appendChild(createLateralLineButton);

    //Step 4-3
    let flexionPlaneDetails; // Store the flexion plane details globally

    const createFlexionPlaneButton = document.createElement("button");
    createFlexionPlaneButton.textContent = "Create Flexion Plane";
    createFlexionPlaneButton.disabled = true;
    createFlexionPlaneButton.addEventListener("click", function() {
        if (!planeDetails || !planeDetails.mesh) {
            updateStatusText("No valgus plane available to duplicate for flexion plane.");
            return;
        }

        // Duplicate the plane
        const planeGeometry = planeDetails.mesh.geometry.clone();
        const planeMaterial = planeDetails.mesh.material.clone();
        const flexionPlane = new THREE.Mesh(planeGeometry, planeMaterial);

        // Copy the position, rotation, and scale from the valgus plane
        flexionPlane.position.copy(planeDetails.mesh.position);
        flexionPlane.rotation.copy(planeDetails.mesh.rotation);
        flexionPlane.scale.copy(planeDetails.mesh.scale);

        scene.add(flexionPlane);

        // Store details for rotation and other manipulations
        flexionPlaneDetails = { mesh: flexionPlane };

        //enable next button
        rotateFlexionPositiveBtn.disabled = false;
        rotateFlexionNegativeBtn.disabled = false;

        createDistalMedialPlaneButton.disabled = false;
    });
    leftContainer.appendChild(createFlexionPlaneButton);

    function rotateFlexionPlane(angleDegrees) {
        if (!flexionPlaneDetails || !flexionPlaneDetails.mesh || !anteriorLine) {
            updateStatusText("Flexion plane or anterior line not defined.");
            return;
        }

        // Compute the rotation axis from the anterior line direction
        const start = new THREE.Vector3().fromBufferAttribute(anteriorLine.geometry.attributes.position, 0);
        const end = new THREE.Vector3().fromBufferAttribute(anteriorLine.geometry.attributes.position, 1);
        const lateralDirection = new THREE.Vector3().subVectors(end, start).normalize();

        // Convert angle from degrees to radians and apply rotation
        const angleRadians = THREE.MathUtils.degToRad(angleDegrees);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(lateralDirection, angleRadians);
        flexionPlaneDetails.mesh.applyQuaternion(quaternion);
    }

    const rotateFlexionPositiveBtn = document.createElement("button");
    rotateFlexionPositiveBtn.textContent = "Rotate Flexion plane +";
    rotateFlexionPositiveBtn.disabled = true;
    rotateFlexionPositiveBtn.addEventListener("click", function() {
        rotateFlexionPlane(5); // Rotate by 5 degrees positively
    });
    right_section_2.appendChild(rotateFlexionPositiveBtn);

    const rotateFlexionNegativeBtn = document.createElement("button");
    rotateFlexionNegativeBtn.textContent = "Rotate Flexion plane -";
    rotateFlexionNegativeBtn.disabled = true;
    rotateFlexionNegativeBtn.addEventListener("click", function() {
        rotateFlexionPlane(-5); // Rotate by 5 degrees negatively
    });
    right_section_2.appendChild(rotateFlexionNegativeBtn);

    rightContainer.appendChild(right_section_2);

    //Step 4-4
    // Step 1: Create the "Create Distal Medial Plane" button
    let distalMedialPlane; // You would set this when creating the distal medial plane

    const createDistalMedialPlaneButton = document.createElement("button");
    createDistalMedialPlaneButton.textContent = "Create Distal Medial Plane";
    createDistalMedialPlaneButton.disabled = true;
    createDistalMedialPlaneButton.addEventListener("click", function() {
        // Ensure the Flexion Plane and Point 7 are defined
        if (!flexionPlaneDetails || !flexionPlaneDetails.mesh || !points.has(6)) {
            updateStatusText("Flexion plane or Point 7 not defined.");
            return;
        }

        // Step 2: Duplicate the Flexion Plane geometry and material
        const planeGeometry = flexionPlaneDetails.mesh.geometry.clone();
        const planeMaterial = flexionPlaneDetails.mesh.material.clone();
        distalMedialPlane = new THREE.Mesh(planeGeometry, planeMaterial);

        // Copy the rotation and scale from the Flexion Plane
        distalMedialPlane.rotation.copy(flexionPlaneDetails.mesh.rotation);
        distalMedialPlane.scale.copy(flexionPlaneDetails.mesh.scale);

        // Step 3: Position the plane to pass through Point 7
        const point7 = points.get(6); // Points are zero-indexed; adjust if your indexing differs
        distalMedialPlane.position.copy(point7.position);

        // Add the new plane to the scene
        scene.add(distalMedialPlane);

        //enable next button
        createDistalResectionPlaneButton.disabled = false;
    });
    leftContainer.appendChild(createDistalMedialPlaneButton);

    //Step 4-5
    // Assuming the distalMedialPlane is stored or accessible globally
    let distalResectionPlane; // Store the distal resection plane here
    const createDistalResectionPlaneButton = document.createElement("button");
    createDistalResectionPlaneButton.textContent = "Create Distal Resection Plane";
    createDistalResectionPlaneButton.disabled = true;
    createDistalResectionPlaneButton.addEventListener("click", function() {
        if (!distalMedialPlane) {
            updateStatusText("Distal Medial Plane has not been defined.");
            return;
        }

        // Duplicate the geometry and material of the Distal Medial Plane
        const planeGeometry = distalMedialPlane.geometry.clone();
        const planeMaterial = distalMedialPlane.material.clone();
        distalResectionPlane = new THREE.Mesh(planeGeometry, planeMaterial);

        // Copy the rotation and scale from the Distal Medial Plane
        distalResectionPlane.rotation.copy(distalMedialPlane.rotation);
        distalResectionPlane.scale.copy(distalMedialPlane.scale);

        // Set the position to be 0.1 units above the Distal Medial Plane
        const offsetDirection = new THREE.Vector3(0, 1, 0); // Upward in Y-axis
        const offsetDistance = 0.1;
        distalResectionPlane.position.copy(distalMedialPlane.position).add(offsetDirection.multiplyScalar(offsetDistance));

        // Add the new plane to the scene
        scene.add(distalResectionPlane);

        //enable next button
        increaseDistanceButton.disabled = false;
        decreaseDistanceButton.disabled = false;
        toggleResectionPlaneButton.disabled = false;

    });
    leftContainer.appendChild(createDistalResectionPlaneButton);

    //Step 4-6
    // Assuming 'distalMedialPlane' and 'distalResectionPlane' are accessible globally
    let offsetDistance = 0.1; // Initial distance between the planes

    const increaseDistanceButton = document.createElement("button");
    increaseDistanceButton.textContent = "Resection +";
    increaseDistanceButton.disabled = true;
    increaseDistanceButton.addEventListener("click", function() {
        offsetDistance += 0.01; // Increase distance by 0.01 units
        updateResectionPlanePosition();
    });

    const decreaseDistanceButton = document.createElement("button");
    decreaseDistanceButton.textContent = "Resection -";
    decreaseDistanceButton.disabled = true;
    decreaseDistanceButton.addEventListener("click", function() {
        offsetDistance = Math.max(0, offsetDistance - 0.01); // Decrease distance, but not below 0
        updateResectionPlanePosition();
    });

    right_section_3.appendChild(increaseDistanceButton);
    right_section_3.appendChild(decreaseDistanceButton);

    rightContainer.appendChild(right_section_3);

    function updateResectionPlanePosition() {
        if (!distalMedialPlane || !distalResectionPlane) {
            console.error("One or both planes are not defined.");
            return;
        }

        // Calculate the new position for the Distal Resection Plane
        const offsetDirection = new THREE.Vector3(0, 1, 0); // Upward in Y-axis
        distalResectionPlane.position.copy(distalMedialPlane.position).add(offsetDirection.multiplyScalar(offsetDistance));
        
        // Rerender the scene to reflect the position change
        renderer.render(scene, camera);
    }

    // This assumes the creation of the Distal Resection Plane already includes:
    // distalResectionPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    // This object must be globally accessible or stored in a way that the update function can access it.

    //step 4-7
    const toggleResectionPlaneButton = document.createElement("button");
    toggleResectionPlaneButton.textContent = "Toggle Resection Plane";
    toggleResectionPlaneButton.disabled = true;
    toggleResectionPlaneButton.addEventListener("click", function() {
        if (!distalResectionPlane) {
            updateStatusText("Distal Resection Plane has not been created yet.");
            return;
        }

        // Toggle the visibility
        distalResectionPlane.visible = !distalResectionPlane.visible;

        // Update the button text based on the visibility state
        toggleResectionPlaneButton.textContent = distalResectionPlane.visible ? "Hide Resection Plane" : "Show Resection Plane";

        // Rerender the scene to reflect the visibility change
        renderer.render(scene, camera);
    });

    right_section_4.appendChild(toggleResectionPlaneButton);

    rightContainer.appendChild(right_section_4);


    //informative text to display the current action explanation
    function updateStatusText(text) {
        const statusDisplay = document.getElementById('status-display');
        statusDisplay.textContent = text; // Updates the content of the status display
    }

    // Controls for camera orbit
    const controls = new OrbitControls(camera, renderer.domElement);
});
