        import * as THREE from 'three';

        import Stats from 'three/addons/libs/stats.module.js';

        import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
        import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

        const manager = new THREE.LoadingManager();
        const breathingSound = new Audio('./assets/sounds/breath.mp3');
        breathingSound.loop = true;
        breathingSound.volume = 0.18;
        const runBreathSound = new Audio('./assets/sounds/run_breath.mp3');
        runBreathSound.loop = true;
        runBreathSound.preload = 'auto';
        runBreathSound.volume = 0.18;
        const growlSound = new Audio('./assets/sounds/growl.mp3');
        growlSound.preload = 'auto';
        growlSound.volume = 0.3;
        const attack1Sound = new Audio('./assets/sounds/attack1_sound.mp3');
        attack1Sound.preload = 'auto';
        attack1Sound.loop = false;
        attack1Sound.volume = 0.3;
        const attack2Sound = new Audio('./assets/sounds/attack2_sound.mp3');
        attack2Sound.preload = 'auto';
        attack2Sound.loop = false;
        attack2Sound.volume = 0.3;
        const stompSoundPool = Array.from({ length: 4 }, () => {
            const sound = new Audio('./assets/sounds/stomp.mp3');
            sound.preload = 'auto';
            sound.volume = 0.08;
            return sound;
        });

        let camera, cameraRig, cameraMotion, playerAnchor, scene, renderer, stats, object, loader, guiMorphsFolder;
        let streetRoot, streetBounds, streetSceneBounds, toxicFogMaterial;
        let policeTemplate;
        let policeRifleTemplate;
        let policeBulletTemplate;
        let policeDeadClip;
        let policeIdleClip;
        let policeLeftClip;
        let policeMoveClip;
        let policeRightClip;
        const policeAgents = [];
        let mixer;
        let policeLoadStarted = false;
        let policeTemplatePrepared = false;
        let policeOfficersSpawned = false;
        let policeSpawningStarted = false;
        let policeSpawnPositions = [];
        let policeSpawnIndex = 0;
        let policeSpawnSize;
        let policeSpawnRadius = 0;
        let gameplayReady = false;
        let policeSpawnDelayStarted = false;
        let policeSpawnDelayElapsed = false;
        let isPlayerDead = false;
        let damageOverlay;
        let playerHealth = 50;
        const playerMaxHealth = 50;
        const attackHitPolice = new Set();
        const playerClawBones = [];
        const clawWorldPosition = new THREE.Vector3();
        const policeHitCenter = new THREE.Vector3();
        let breathingAudioUnlocked = false;
        let breathingShouldPlay = false;
        let runBreathShouldPlay = false;
        let breathingPlayPending = false;
        let breathingPlaybackFailed = false;
        let runBreathPlayPending = false;
        let runBreathPlaybackFailed = false;
        let breathingResumePosition = 0;
        let stompPlaybackFailed = false;
        let nextStompSoundIndex = 0;
        let stompIntervalTimer = 0;
        let lastStompAnimationName = null;
        const modelRestPosition = new THREE.Vector3();
        const modelSize = new THREE.Vector3();
        const streetSize = new THREE.Vector3();
        const collisionRaycaster = new THREE.Raycaster();
        const collisionOrigin = new THREE.Vector3();
        const collisionDirection = new THREE.Vector3();
        const policeBulletRaycaster = new THREE.Raycaster();
        const policeBulletTarget = new THREE.Vector3();
        const spawnOverheadRaycaster = new THREE.Raycaster();
        const spawnOverheadOrigin = new THREE.Vector3();
        const spawnDownDirection = new THREE.Vector3(0, -1, 0);
        const cameraRaycaster = new THREE.Raycaster();
        const cameraFocusOffset = new THREE.Vector3();
        const policeScaleFactor = 0.6;
        const policeOfficerCount = 7;
        const policeMoveSpeed = 7;
        const policeMinShotInterval = 1.5;
        const policeMaxShotInterval = 3;
        const policeBulletSpeed = 55;
        const policeBulletLifetime = 3;
        const policeMuzzleFlashDuration = 0.08;
        const policeBullets = [];
        const muzzleFlashGeometry = new THREE.SphereGeometry(1, 10, 8);
        const muzzleFlashMaterial = new THREE.MeshBasicMaterial({ color: 0xffe5a0 });
        const cameraRelativeOffset = new THREE.Vector3();
        const cameraFocusWorld = new THREE.Vector3();
        const cameraDesiredWorld = new THREE.Vector3();
        const cameraRayDirection = new THREE.Vector3();
        const streetScale = 20;
        const previousModelScale = 1 / 4;
        const modelScale = previousModelScale / 8;
        const cameraScaleFactor = modelScale / previousModelScale;
        const cameraCollisionClearance = 8 * cameraScaleFactor;
        const cameraMinimumDistance = 30 * cameraScaleFactor;
        let cameraDistanceFactor = 1;
        let rootBoneNames = [];
        let streetMeshes = [];
        let walkableMeshes = [];
        let collisionHeights = [];
        let playerRadius = 20;
        let playerSpawned = false;
        const spawnLeftOffset = 80;
        let actions = {};
        let activeAction;
        let activeAnimationName;
        let manualAnimation = false;
        let attack1Requested = false;
        let attack2Queued = false;
        let attack2Requested = false;
        const pressedKeys = new Set();
        const walkSpeed = 9;
        const runSpeed = 20;
        const turnSpeed = 6;
        const mouseSensitivity = 0.0025;
        const minCameraPitch = -0.5;
        const maxCameraPitch = 0.7;
        let cameraYaw = 0;
        let cameraPitch = 0;
        let cameraShakeElapsed = 0;
        let lastCameraShakeAnimation = null;
        let mouseDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        const cameraOffset = new THREE.Vector3(0, 50, -120).multiplyScalar(cameraScaleFactor);
        const cameraLookOffset = new THREE.Vector3(0, 30, 0).multiplyScalar(cameraScaleFactor);
        const cameraShakePulseDuration = 0.1;
        const targetRotation = new THREE.Quaternion();
        const upAxis = new THREE.Vector3(0, 1, 0);
        const cameraForward = new THREE.Vector3();
        const cameraRight = new THREE.Vector3();

        const timer = new THREE.Timer();
        timer.connect(document);

        const params = {
            asset: 'Mutant'
        };

        const animationsList = [
        { name: "idle", file: "Idle.fbx" },
        { name: "Mutant_Walking", file: "Mutant Walking.fbx" },
        { name: "Run", file: "Fast Run.fbx" },
        { name: "Attack1", file: "Attack1.fbx" },
        { name: "Attack2", file: "Attack2.fbx" },
        { name: "MutantDead", file: "Mutant dead.fbx" },
        { name: "Boxing", file: "Boxing.fbx" },
        { name: "Flair", file: "Flair.fbx" }
        ];


        const assets = [
            'Samba Dancing',
            'morph_test',
            'monkey',
            'monkey_embedded_texture',
            'vCube',
        ];


        init();

        function init() {

            const container = document.createElement('div');
            document.body.appendChild(container);

            damageOverlay = document.createElement('div');
            damageOverlay.setAttribute('aria-hidden', 'true');
            Object.assign(damageOverlay.style, {
                position: 'fixed',
                inset: '0',
                pointerEvents: 'none',
                zIndex: '10',
                opacity: '1'
            });
            document.body.appendChild(damageOverlay);
            updateDamageOverlay();

            const controlsPanel = document.createElement('section');
            controlsPanel.setAttribute('aria-label', 'Controles del juego');
            Object.assign(controlsPanel.style, {
                position: 'fixed',
                top: '54px',
                left: '12px',
                zIndex: '11',
                display: 'grid',
                gap: '6px',
                padding: '12px 16px',
                border: '1px solid rgba(98, 189, 255, 0.6)',
                borderRadius: '8px',
                background: 'rgba(7, 14, 32, 0.82)',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
                color: '#ffffff',
                fontSize: '13px',
                lineHeight: '1.4',
                pointerEvents: 'none',
                backdropFilter: 'blur(6px)'
            });

            const controlsTitle = document.createElement('strong');
            controlsTitle.textContent = 'CONTROLES';
            controlsTitle.style.color = '#62bdff';
            controlsPanel.appendChild(controlsTitle);

            for (const [label, keys] of [
                ['Moverte', 'W · A · S · D'],
                ['Correr', 'Shift'],
                ['Pegar', 'K']
            ]) {
                const row = document.createElement('div');
                row.textContent = `${label}: ${keys}`;
                controlsPanel.appendChild(row);
            }
            document.body.appendChild(controlsPanel);

            camera = new THREE.PerspectiveCamera(61, window.innerWidth / window.innerHeight, 1, 2000);
            camera.zoom = 3;
            camera.updateProjectionMatrix();
            camera.position.copy(cameraOffset);
            camera.lookAt(cameraOffset.x, cameraLookOffset.y, 0);

            scene = new THREE.Scene();
            cameraRig = new THREE.Group();
            cameraMotion = new THREE.Group();
            cameraRig.add(cameraMotion);
            cameraMotion.add(camera);
            scene.add(cameraRig);
            scene.background = new THREE.Color(0x080d20);
            scene.fog = new THREE.Fog(0x080d20, 300, 1600);

            const hemiLight = new THREE.HemisphereLight(0x9bb8ef, 0x111827, 0.3);
            hemiLight.position.set(0, 200, 0);
            scene.add(hemiLight);

            const dirLight = new THREE.DirectionalLight(0xb7ccff, 0.6);
            dirLight.position.set(-300, 700, 250);
            dirLight.castShadow = true;
            dirLight.shadow.camera.top = 600;
            dirLight.shadow.camera.bottom = -600;
            dirLight.shadow.camera.left = -600;
            dirLight.shadow.camera.right = 600;
            dirLight.shadow.camera.far = 2000;
            scene.add(dirLight);

            // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

            loader = new FBXLoader(manager);
            manager.onLoad = () => {
                gameplayReady = true;
                if (policeSpawnDelayStarted) return;

                policeSpawnDelayStarted = true;
                window.setTimeout(() => {
                    policeSpawnDelayElapsed = true;
                    spawnPoliceOfficers();
                }, 5000);
            };
            loadModel();
            loadStreetScenario();

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setAnimationLoop(animate);
            renderer.shadowMap.enabled = true;
            container.appendChild(renderer.domElement);
            cameraRig.rotation.order = 'YXZ';

            renderer.domElement.addEventListener('pointerdown', (event) => {
                if (event.button !== 0) return;

                mouseDragging = true;
                lastMouseX = event.clientX;
                lastMouseY = event.clientY;

                if (!document.pointerLockElement) {
                    const lockRequest = renderer.domElement.requestPointerLock();
                    if (lockRequest && typeof lockRequest.catch === 'function') {
                        lockRequest.catch((error) => console.warn('Pointer lock could not be enabled:', error));
                    }
                }

                unlockBreathingSound();
            });
            document.addEventListener('pointerup', () => {
                mouseDragging = false;
            });
            document.addEventListener('mousemove', onMouseMove);

            window.addEventListener('resize', onWindowResize);

            // stats
            stats = new Stats();
            container.appendChild(stats.dom);

            const gui = new GUI();
            gui.add(params, 'asset', assets).onChange(function (value) {

                loadAsset(value);

            });

            guiMorphsFolder = gui.addFolder('Morphs').hide();

        }

        function loadModel() {
        loader.load('./assets/models/fbx/Mutant.fbx', function (fbx) {

            object = fbx;
            object.traverse((node) => {
                if (!node.isMesh) return;

                node.castShadow = true;
                node.receiveShadow = true;
            });
            modelRestPosition.copy(object.position);
            new THREE.Box3().setFromObject(object).getSize(modelSize);
            modelSize.multiplyScalar(modelScale);
            playerRadius = Math.max(12 * cameraScaleFactor, Math.max(modelSize.x, modelSize.z) * 0.3);
            collisionHeights = [0.2, 0.5, 0.8].map(height =>
                Math.max(10 * cameraScaleFactor, modelSize.y * height)
            );
            rootBoneNames = getRootBoneNames(object);
            playerClawBones.push(...getPlayerClawBones(object));
            if (playerClawBones.length === 0) {
                console.warn('Could not find hand or claw bones for melee hit detection.');
            }
            playerAnchor = new THREE.Group();
            playerAnchor.visible = false;
            const modelVisual = new THREE.Group();
            modelVisual.scale.setScalar(modelScale);
            modelVisual.add(object);
            playerAnchor.add(modelVisual);
            scene.add(playerAnchor);
            mixer = new THREE.AnimationMixer(object);
            mixer.addEventListener('finished', onAnimationFinished);

            placePlayerAtStreetStart();
            spawnPoliceOfficers();
            loadAnimations();

            });
        }

        function loadStreetScenario() {
            const gltfLoader = new GLTFLoader(manager);
            gltfLoader.load(
                './assets/models/fbx/street_cscenario.glb',
                (gltf) => {
                    streetRoot = gltf.scene;
                    streetRoot.scale.setScalar(streetScale);
                    scene.add(streetRoot);
                    streetRoot.updateMatrixWorld(true);

                    streetSceneBounds = new THREE.Box3().setFromObject(streetRoot);
                    streetBounds = new THREE.Box3();
                    streetMeshes = [];
                    walkableMeshes = [];

                    streetRoot.traverse((node) => {
                        if (!node.isMesh) return;

                        node.castShadow = true;
                        node.receiveShadow = true;
                        streetMeshes.push(node);

                        const bounds = new THREE.Box3().setFromObject(node);
                        bounds.getSize(streetSize);
                        const horizontalArea = streetSize.x * streetSize.z;
                        if (streetSize.y <= 15 && bounds.max.y <= 30 && horizontalArea > 1000) {
                            streetBounds.union(bounds);
                            walkableMeshes.push(node);
                        }
                    });

                    if (streetBounds.isEmpty()) {
                        streetBounds.copy(streetSceneBounds);
                        walkableMeshes = streetMeshes;
                    }
                    createStreetLamps();
                    createToxicBoundaryFog();
                    placePlayerAtStreetStart();
                    loadPoliceOfficers();
                    spawnPoliceOfficers();
                },
                undefined,
                (error) => console.error('Could not load street_cscenario.glb:', error)
            );
        }

        function loadPoliceOfficers() {
            if (policeLoadStarted) return;
            policeLoadStarted = true;

            loader.load(
                './assets/models/fbx/police.fbx',
                (policeModel) => {
                    policeTemplate = policeModel;
                    spawnPoliceOfficers();
                },
                undefined,
                (error) => console.error('Could not load police.fbx:', error)
            );

            loader.load(
                './assets/models/fbx/police_move.fbx',
                (animationModel) => {
                    if (!animationModel.animations.length) {
                        console.error('police_move.fbx does not contain an animation.');
                        return;
                    }
                    policeMoveClip = animationModel.animations[0];
                    spawnPoliceOfficers();
                },
                undefined,
                (error) => console.error('Could not load police_move.fbx:', error)
            );

            loader.load(
                './assets/models/fbx/police_idle.fbx',
                (animationModel) => {
                    if (!animationModel.animations.length) {
                        console.error('police_idle.fbx does not contain an animation.');
                        return;
                    }
                    policeIdleClip = animationModel.animations[0];
                    spawnPoliceOfficers();
                },
                undefined,
                (error) => console.error('Could not load police_idle.fbx:', error)
            );

            loader.load(
                './assets/models/fbx/police_left.fbx',
                (animationModel) => {
                    if (!animationModel.animations.length) {
                        console.error('police_left.fbx does not contain an animation.');
                        return;
                    }
                    policeLeftClip = animationModel.animations[0];
                    spawnPoliceOfficers();
                },
                undefined,
                (error) => console.error('Could not load police_left.fbx:', error)
            );

            loader.load(
                './assets/models/fbx/police_right.fbx',
                (animationModel) => {
                    if (!animationModel.animations.length) {
                        console.error('police_right.fbx does not contain an animation.');
                        return;
                    }
                    policeRightClip = animationModel.animations[0];
                    spawnPoliceOfficers();
                },
                undefined,
                (error) => console.error('Could not load police_right.fbx:', error)
            );

            loader.load(
                './assets/models/fbx/police_dead.fbx',
                (animationModel) => {
                    if (!animationModel.animations.length) {
                        console.error('police_dead.fbx does not contain an animation.');
                        return;
                    }
                    policeDeadClip = animationModel.animations[0];
                    spawnPoliceOfficers();
                },
                undefined,
                (error) => console.error('Could not load police_dead.fbx:', error)
            );

            loader.load(
                './assets/models/fbx/Rifle.fbx',
                (rifleModel) => {
                    rifleModel.traverse((node) => {
                        if (!node.isMesh) return;
                        node.castShadow = true;
                        node.receiveShadow = true;
                    });
                    policeRifleTemplate = rifleModel;
                    spawnPoliceOfficers();
                },
                undefined,
                (error) => console.error('Could not load Rifle.fbx:', error)
            );

            loadPoliceBullet();
        }

        function loadPoliceBullet() {
            const url = './assets/models/fbx/bullet.obj';
            manager.itemStart(url);
            fetch(url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Request failed with status ${response.status}`);
                    }
                    return response.text();
                })
                .then((source) => {
                    policeBulletTemplate = parsePoliceBulletOBJ(source);
                    spawnPoliceOfficers();
                })
                .catch((error) => {
                    manager.itemError(url);
                    console.error('Could not load bullet.obj:', error);
                })
                .finally(() => manager.itemEnd(url));
        }

        function parsePoliceBulletOBJ(source) {
            const vertices = [];
            const indices = [];

            for (const line of source.split(/\r?\n/)) {
                const parts = line.trim().split(/\s+/);
                if (parts[0] === 'v' && parts.length >= 4) {
                    vertices.push(Number(parts[1]), Number(parts[2]), Number(parts[3]));
                } else if (parts[0] === 'f' && parts.length >= 4) {
                    const face = parts.slice(1).map((part) => {
                        const rawIndex = Number(part.split('/')[0]);
                        const index = rawIndex > 0 ? rawIndex - 1 : vertices.length / 3 + rawIndex;
                        if (!Number.isInteger(index) || index < 0 || index >= vertices.length / 3) {
                            throw new Error('bullet.obj contains an invalid face index.');
                        }
                        return index;
                    });
                    for (let i = 1; i < face.length - 1; i++) {
                        indices.push(face[0], face[i], face[i + 1]);
                    }
                }
            }

            if (vertices.length === 0 || indices.length === 0) {
                throw new Error('bullet.obj contains no renderable geometry.');
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            geometry.computeBoundingBox();

            const bounds = geometry.boundingBox;
            const size = bounds.getSize(new THREE.Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);
            if (maxDimension <= 0) {
                throw new Error('Could not determine the bullet model dimensions.');
            }

            const center = bounds.getCenter(new THREE.Vector3());
            geometry.translate(-center.x, -center.y, -center.z);
            const scale = 0.2 / maxDimension;
            geometry.scale(scale, scale, scale);
            geometry.computeBoundingSphere();

            const bullet = new THREE.Mesh(
                geometry,
                new THREE.MeshStandardMaterial({
                    color: 0xffc15a,
                    emissive: 0xff6500,
                    emissiveIntensity: 1.2,
                    metalness: 0.6,
                    roughness: 0.25
                })
            );
            bullet.castShadow = true;

            const bulletRoot = new THREE.Group();
            bulletRoot.add(bullet);
            return bulletRoot;
        }

        function spawnPoliceOfficers() {
            if (policeOfficersSpawned || policeSpawningStarted || !policeTemplate || !streetBounds ||
                !policeSpawnDelayElapsed || !policeBulletTemplate || !policeDeadClip || !policeIdleClip ||
                !policeLeftClip || !policeMoveClip || !policeRightClip ||
                !policeRifleTemplate ||
                !playerSpawned || modelSize.y <= 0) {
                return;
            }

            if (!policeTemplatePrepared) {
                const sourceBounds = new THREE.Box3().setFromObject(policeTemplate);
                const sourceSize = sourceBounds.getSize(new THREE.Vector3());
                if (sourceSize.y <= 0) {
                    console.error('Could not determine the police model height.');
                    policeOfficersSpawned = true;
                    return;
                }

                policeTemplate.scale.multiplyScalar(modelSize.y * policeScaleFactor / sourceSize.y);
                policeTemplate.updateMatrixWorld(true);
                const scaledBounds = new THREE.Box3().setFromObject(policeTemplate);
                const center = scaledBounds.getCenter(new THREE.Vector3());
                policeTemplate.position.x -= center.x;
                policeTemplate.position.y -= scaledBounds.min.y;
                policeTemplate.position.z -= center.z;
                policeTemplate.traverse((node) => {
                    if (!node.isMesh) return;
                    node.castShadow = true;
                    node.receiveShadow = true;
                });

                const normalizedRoot = new THREE.Group();
                normalizedRoot.add(policeTemplate);
                policeTemplate = normalizedRoot;
                policeTemplatePrepared = true;
                const policeRootBoneNames = getRootBoneNames(policeTemplate);
                removeHorizontalRootMotion(policeIdleClip, policeRootBoneNames);
                removeHorizontalRootMotion(policeLeftClip, policeRootBoneNames);
                removeHorizontalRootMotion(policeMoveClip, policeRootBoneNames);
                removeHorizontalRootMotion(policeRightClip, policeRootBoneNames);
                removeHorizontalRootMotion(policeDeadClip, policeRootBoneNames);
            }

            const policeBounds = new THREE.Box3().setFromObject(policeTemplate);
            const policeSize = policeBounds.getSize(new THREE.Vector3());
            const policeRadius = Math.max(1, Math.max(policeSize.x, policeSize.z) * 0.35);
            const boundaryMargin = policeRadius + streetScale * 0.5;
            const minimumSpacing = Math.max(streetScale * 2, policeRadius * 6);
            const minX = streetBounds.min.x + boundaryMargin;
            const maxX = streetBounds.max.x - boundaryMargin;
            const minZ = streetBounds.min.z + boundaryMargin;
            const maxZ = streetBounds.max.z - boundaryMargin;
            const rayStartY = streetSceneBounds.max.y + 1;
            const groundRaycaster = new THREE.Raycaster();
            const clearanceRaycaster = new THREE.Raycaster();
            const rayOrigin = new THREE.Vector3();
            const positions = [];
            const directions = [
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3(0, 0, -1),
                new THREE.Vector3(0.707, 0, 0.707),
                new THREE.Vector3(-0.707, 0, 0.707),
                new THREE.Vector3(0.707, 0, -0.707),
                new THREE.Vector3(-0.707, 0, -0.707)
            ];

            for (let attempt = 0; attempt < 3000 && positions.length < policeOfficerCount; attempt++) {
                const x = THREE.MathUtils.randFloat(minX, maxX);
                const z = THREE.MathUtils.randFloat(minZ, maxZ);
                rayOrigin.set(x, rayStartY, z);
                groundRaycaster.set(rayOrigin, spawnDownDirection);
                groundRaycaster.far = rayStartY - streetBounds.min.y + 1;
                const groundHit = groundRaycaster.intersectObjects(walkableMeshes, false)[0];
                if (!groundHit || !hasPoliceSpawnClearance(
                    x, groundHit.point.y, z, policeRadius, policeSize.y,
                    directions, clearanceRaycaster, rayOrigin
                )) {
                    continue;
                }

                if (Math.hypot(x - playerAnchor.position.x, z - playerAnchor.position.z) < minimumSpacing ||
                    positions.some(position => Math.hypot(x - position.x, z - position.z) < minimumSpacing)) {
                    continue;
                }

                positions.push(new THREE.Vector3(x, groundHit.point.y, z));
            }

            policeSpawningStarted = true;
            policeSpawnPositions = positions;
            policeSpawnSize = policeSize;
            policeSpawnRadius = policeRadius;
            if (positions.length !== policeOfficerCount) {
                console.error(`Only found ${positions.length} safe road positions for the ${policeOfficerCount} police officers.`);
            }
            spawnNextPoliceOfficer();
        }

        function spawnNextPoliceOfficer() {
            if (policeSpawnIndex >= policeSpawnPositions.length) {
                policeOfficersSpawned = true;
                return;
            }

            const index = policeSpawnIndex++;
            const officer = cloneSkeleton(policeTemplate);
            officer.name = `PoliceOfficer_${index + 1}`;
            officer.position.copy(policeSpawnPositions[index]);
            officer.rotation.y = Math.random() * Math.PI * 2;
            scene.add(officer);
            const weapon = createPoliceWeapon(officer, policeSpawnSize.y);
            const shootSound = new Audio('./assets/sounds/shoot.mp3');
            shootSound.preload = 'auto';
            shootSound.volume = 0.25;

            const officerMixer = new THREE.AnimationMixer(officer);
            const idleAction = officerMixer.clipAction(policeIdleClip);
            const leftAction = officerMixer.clipAction(policeLeftClip);
            const moveAction = officerMixer.clipAction(policeMoveClip);
            const rightAction = officerMixer.clipAction(policeRightClip);
            const deadAction = officerMixer.clipAction(policeDeadClip);
            idleAction.setLoop(THREE.LoopRepeat, Infinity);
            leftAction.setLoop(THREE.LoopRepeat, Infinity);
            moveAction.setLoop(THREE.LoopRepeat, Infinity);
            rightAction.setLoop(THREE.LoopRepeat, Infinity);
            deadAction.setLoop(THREE.LoopOnce, 1);
            deadAction.clampWhenFinished = true;
            idleAction.play();
            policeAgents.push({
                root: officer,
                mixer: officerMixer,
                activeAction: idleAction,
                idleAction,
                leftAction,
                moveAction,
                rightAction,
                deadAction,
                health: 1,
                isDead: false,
                radius: policeSpawnRadius,
                height: policeSpawnSize.y,
                stopDistance: Math.max(10, playerRadius + policeSpawnRadius + 4),
                closeHysteresis: Math.max(4, policeSpawnRadius * 2),
                tacticalDistance: Math.max(24, (playerRadius + policeSpawnRadius) * 3),
                flankDirection: Math.random() < 0.5 ? -1 : 1,
                isPlayerClose: false,
                isTakingBreak: true,
                behaviorTimer: THREE.MathUtils.randFloat(0.8, 2),
                shotTimer: THREE.MathUtils.randFloat(policeMinShotInterval, policeMaxShotInterval),
                muzzleFlashTimer: 0,
                shootSound,
                weapon,
                toPlayer: new THREE.Vector3(),
                moveDirection: new THREE.Vector3(),
                separationDirection: new THREE.Vector3(),
                targetRotation: new THREE.Quaternion(),
                collisionRaycaster: new THREE.Raycaster(),
                collisionOrigin: new THREE.Vector3(),
                collisionDirection: new THREE.Vector3(),
                collisionHeights: [
                    policeSpawnSize.y * 0.3,
                    policeSpawnSize.y * 0.65,
                    policeSpawnSize.y * 0.9
                ]
            });

            if (policeSpawnIndex < policeSpawnPositions.length) {
                window.setTimeout(spawnNextPoliceOfficer, 1000);
            } else {
                policeOfficersSpawned = true;
            }
        }

        function createPoliceWeapon(officer, officerHeight) {
            const hand = officer.getObjectByName('mixamorig:RightHand') ||
                officer.getObjectByName('RightHand');
            const rifle = policeRifleTemplate.clone(true);
            rifle.name = `${officer.name}_Rifle`;
            rifle.scale.multiplyScalar(3);
            rifle.position.set(0, 0, 0);
            rifle.traverse((node) => {
                if (!node.isMesh || !node.material) return;
                node.frustumCulled = false;
                const brightenMaterial = (material) => {
                    const visibleMaterial = material.clone();
                    if (visibleMaterial.emissive) {
                        visibleMaterial.emissive.set(0x242424);
                        visibleMaterial.emissiveIntensity = Math.max(0.8, visibleMaterial.emissiveIntensity || 0);
                    }
                    return visibleMaterial;
                };
                node.material = Array.isArray(node.material)
                    ? node.material.map(brightenMaterial)
                    : brightenMaterial(node.material);
            });

            const sourceSize = new THREE.Box3().setFromObject(rifle).getSize(new THREE.Vector3());
            const sourceAxis = sourceSize.x >= sourceSize.y && sourceSize.x >= sourceSize.z
                ? new THREE.Vector3(1, 0, 0)
                : sourceSize.y >= sourceSize.z
                    ? new THREE.Vector3(0, 1, 0)
                    : new THREE.Vector3(0, 0, 1);
            rifle.quaternion.setFromUnitVectors(sourceAxis, new THREE.Vector3(0, 0, 1));
            rifle.updateMatrixWorld(true);

            let bounds = new THREE.Box3().setFromObject(rifle);
            let size = bounds.getSize(new THREE.Vector3());
            const currentLength = Math.max(size.x, size.y, size.z);
            if (currentLength <= 0) {
                console.error(`Could not determine the rifle barrel direction for ${officer.name}.`);
                return null;
            }

            const rifleLength = officerHeight * 0.9;
            rifle.scale.multiplyScalar(rifleLength / currentLength);
            rifle.updateMatrixWorld(true);

            bounds = new THREE.Box3().setFromObject(rifle);
            const center = bounds.getCenter(new THREE.Vector3());
            const muzzleWorldPosition = center.clone().addScaledVector(
                    rifle.getWorldDirection(new THREE.Vector3()),
                    rifleLength * 0.5
            );
            const muzzlePosition = rifle.worldToLocal(muzzleWorldPosition);
            rifle.position.sub(center);

            const mount = new THREE.Group();
            mount.name = `${officer.name}_WeaponMount`;
            const handPosition = new THREE.Vector3();
            if (hand) {
                officer.updateWorldMatrix(true, true);
                hand.getWorldPosition(handPosition);
                officer.worldToLocal(handPosition);
            } else {
                console.error(`Could not find a right-hand bone for ${officer.name}; using a chest mount.`);
                handPosition.set(0, officerHeight * 0.65, 0);
            }
            mount.position.copy(handPosition);
            officer.add(mount);
            mount.add(rifle);

            const muzzle = new THREE.Object3D();
            muzzle.name = `${officer.name}_Muzzle`;
            muzzle.position.copy(muzzlePosition);
            rifle.add(muzzle);

            const flash = new THREE.Mesh(muzzleFlashGeometry, muzzleFlashMaterial);
            const worldScale = rifle.getWorldScale(new THREE.Vector3());
            flash.scale.setScalar(
                (rifleLength * 0.08) / Math.max(worldScale.x, worldScale.y, worldScale.z)
            );
            flash.visible = false;
            muzzle.add(flash);

            const light = new THREE.PointLight(0xffa43a, 45, Math.max(3, officerHeight * 2));
            light.visible = false;
            muzzle.add(light);

            return { rifle, mount, hand, handPosition, muzzle, flash, light };
        }

        function hasPoliceSpawnClearance(x, y, z, radius, height, directions, raycaster, rayOrigin) {
            spawnOverheadOrigin.set(x, streetSceneBounds.max.y + 1, z);
            spawnOverheadRaycaster.set(spawnOverheadOrigin, spawnDownDirection);
            spawnOverheadRaycaster.far = streetSceneBounds.max.y - y + 1;
            const overheadHits = spawnOverheadRaycaster.intersectObjects(streetMeshes, false);
            if (overheadHits.some(hit => hit.point.y > y + height * 0.8 &&
                hit.point.y < y + streetScale * 8)) {
                return false;
            }

            const clearanceHeights = [height * 0.3, height * 0.65, height * 0.9];
            for (const clearanceHeight of clearanceHeights) {
                for (const direction of directions) {
                    rayOrigin.set(x, y + clearanceHeight, z);
                    raycaster.set(rayOrigin, direction);
                    raycaster.far = radius + streetScale * 0.25;
                    if (raycaster.intersectObjects(streetMeshes, false).length > 0) return false;
                }
            }

            return true;
        }

        function placePlayerAtStreetStart() {
            if (!playerAnchor || !streetBounds || playerSpawned) return;

            const target = streetBounds.getCenter(new THREE.Vector3());
            streetBounds.getSize(streetSize);
            const initialSpawn = findSafeSpawn(target.x - 80, target.z);
            if (!initialSpawn) {
                console.error('Could not find a safe spawn point on the scenario walkable surfaces.');
                return;
            }

            const spawnPosition = findSafeSpawn(
                initialSpawn.x + Math.cos(cameraYaw) * spawnLeftOffset,
                initialSpawn.z - Math.sin(cameraYaw) * spawnLeftOffset
            );
            if (!spawnPosition) {
                console.error(`Could not find a safe spawn point ${spawnLeftOffset} units to the left of the initial position.`);
                return;
            }

            playerAnchor.position.copy(spawnPosition);
            playerAnchor.visible = true;
            playerSpawned = true;
            unlockBreathingSound();
        }

        function findSafeSpawn(targetX, targetZ) {
            const directions = [
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3(0, 0, -1),
                new THREE.Vector3(0.707, 0, 0.707),
                new THREE.Vector3(-0.707, 0, 0.707),
                new THREE.Vector3(0.707, 0, -0.707),
                new THREE.Vector3(-0.707, 0, -0.707)
            ];
            const groundRaycaster = new THREE.Raycaster();
            const spawnRaycaster = new THREE.Raycaster();
            const rayOrigin = new THREE.Vector3();
            const groundDirection = spawnDownDirection;
            const step = Math.max(playerRadius * 2, streetScale * 0.75);
            const maxRing = Math.ceil(Math.max(streetSize.x, streetSize.z) / step);
            const maxAttempts = 1000;
            const rayStartY = streetBounds.max.y + modelSize.y + playerRadius + 10;
            let attempts = 0;

            for (let ring = 0; ring <= maxRing && attempts < maxAttempts; ring++) {
                for (let offsetZ = -ring; offsetZ <= ring && attempts < maxAttempts; offsetZ++) {
                    for (let offsetX = -ring; offsetX <= ring && attempts < maxAttempts; offsetX++) {
                        if (Math.max(Math.abs(offsetX), Math.abs(offsetZ)) !== ring) continue;

                        const x = targetX + offsetX * step;
                        const z = targetZ + offsetZ * step;
                        if (x < streetBounds.min.x + playerRadius || x > streetBounds.max.x - playerRadius ||
                            z < streetBounds.min.z + playerRadius || z > streetBounds.max.z - playerRadius) {
                            continue;
                        }

                        attempts++;
                        rayOrigin.set(x, rayStartY, z);
                        groundRaycaster.set(rayOrigin, groundDirection);
                        groundRaycaster.far = rayStartY - streetBounds.min.y + 1;
                        const groundHit = groundRaycaster.intersectObjects(walkableMeshes, false)[0];
                        if (!groundHit || !hasSpawnClearance(x, groundHit.point.y, z, directions, spawnRaycaster, rayOrigin)) {
                            continue;
                        }

                        return new THREE.Vector3(x, groundHit.point.y, z);
                    }
                }
            }

            return null;
        }

        function hasSpawnClearance(x, y, z, directions, raycaster, rayOrigin) {
            const clearanceHeights = collisionHeights.length > 1
                ? [collisionHeights[1], collisionHeights[2]]
                : [Math.max(10, modelSize.y * 0.5)];
            const horizontalClearance = playerRadius + streetScale * 0.5;

            spawnOverheadOrigin.set(x, streetSceneBounds.max.y + 1, z);
            spawnOverheadRaycaster.set(spawnOverheadOrigin, spawnDownDirection);
            spawnOverheadRaycaster.far = streetSceneBounds.max.y - y + 1;
            const overheadHits = spawnOverheadRaycaster.intersectObjects(streetMeshes, false);
            if (overheadHits.some(hit => hit.point.y > y + playerRadius &&
                hit.point.y < y + streetScale * 5)) {
                return false;
            }

            for (const height of clearanceHeights) {
                for (const direction of directions) {
                    rayOrigin.set(x, y + height, z);
                    raycaster.set(rayOrigin, direction);
                    raycaster.far = horizontalClearance;
                    if (raycaster.intersectObjects(streetMeshes, false).length > 0) return false;
                }
            }

            return true;
        }

        function createStreetLamps() {
            streetBounds.getSize(streetSize);

            const lampHeight = streetScale * 2;
            const sideOffset = Math.max(playerRadius * 2, streetScale * 0.75);
            const runsAlongZ = streetSize.z >= streetSize.x;
            const runMin = runsAlongZ ? streetBounds.min.z : streetBounds.min.x;
            const runMax = runsAlongZ ? streetBounds.max.z : streetBounds.max.x;
            const lampCount = 3;

            for (let side = 0; side < 2; side++) {
                const sideSign = side === 0 ? 1 : -1;
                const sidePosition = runsAlongZ
                    ? (side === 0 ? streetBounds.min.x + sideOffset : streetBounds.max.x - sideOffset)
                    : (side === 0 ? streetBounds.min.z + sideOffset : streetBounds.max.z - sideOffset);

                for (let i = 0; i < lampCount; i++) {
                    const alongPosition = THREE.MathUtils.lerp(runMin, runMax, (i + 1) / (lampCount + 1));
                    const armDirection = runsAlongZ ? sideSign : -sideSign;
                    const lamp = new THREE.Group();
                    const light = new THREE.PointLight(0xffbf75, 30000, streetScale * 12, 2);
                    light.position.set(armDirection * 11, lampHeight * 0.86, 0);
                    lamp.add(light);

                    if (runsAlongZ) {
                        lamp.position.set(sidePosition, 0, alongPosition);
                    } else {
                        lamp.position.set(alongPosition, 0, sidePosition);
                        lamp.rotation.y = Math.PI / 2;
                    }

                    lamp.updateMatrixWorld(true);
                    scene.add(lamp);
                }
            }
        }

        function createToxicBoundaryFog() {
            streetBounds.getSize(streetSize);

            const fogHeight = Math.max(100, streetScale * 8);
            const fogDepth = streetScale * 0.4;
            toxicFogMaterial = new THREE.ShaderMaterial({
                uniforms: { uTime: { value: 0 } },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float uTime;
                    varying vec2 vUv;

                    float hash(vec2 p) {
                        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                    }

                    float noise(vec2 p) {
                        vec2 i = floor(p);
                        vec2 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        return mix(
                            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                            f.y
                        );
                    }

                    float fbm(vec2 p) {
                        float value = 0.0;
                        float amplitude = 0.5;
                        for (int i = 0; i < 4; i++) {
                            value += noise(p) * amplitude;
                            p *= 2.0;
                            amplitude *= 0.5;
                        }
                        return value;
                    }

                    void main() {
                        float drift = uTime * 0.025;
                        float broad = fbm(vUv * vec2(3.0, 2.5) + vec2(drift, -drift));
                        float detail = fbm(vUv * vec2(10.0, 7.0) - vec2(drift * 1.4, drift));
                        float clouds = smoothstep(0.3, 0.72, broad * 0.65 + detail * 0.35);
                        float verticalFade = smoothstep(0.0, 0.1, vUv.y) *
                            (1.0 - smoothstep(0.72, 1.0, vUv.y));
                        float alpha = (0.08 + clouds * 0.25) * verticalFade;
                        gl_FragColor = vec4(vec3(0.16, 0.95, 0.1), alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });

            const addFogWall = (width, x, z, rotationY, xOffset, zOffset) => {
                const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, fogHeight), toxicFogMaterial);
                wall.position.set(x + xOffset, streetBounds.min.y + fogHeight / 2, z + zOffset);
                wall.rotation.y = rotationY;
                wall.renderOrder = 2;
                scene.add(wall);
            };

            const centerX = streetBounds.getCenter(new THREE.Vector3()).x;
            const centerZ = streetBounds.getCenter(new THREE.Vector3()).z;
            const sides = [
                [streetSize.x, centerX, streetBounds.min.z, 0, 0, fogDepth],
                [streetSize.x, centerX, streetBounds.max.z, 0, 0, -fogDepth],
                [streetSize.z, streetBounds.min.x, centerZ, Math.PI / 2, fogDepth, 0],
                [streetSize.z, streetBounds.max.x, centerZ, Math.PI / 2, -fogDepth, 0]
            ];

            for (const [width, x, z, rotationY, xOffset, zOffset] of sides) {
                addFogWall(width, x, z, rotationY, 0, 0);
                addFogWall(width, x, z, rotationY, xOffset, zOffset);
            }
        }

        function loadAnimations() {

        animationsList.forEach(anim => {

            loader.load('./assets/models/fbx/' + anim.file, function (animData) {

                const clip = animData.animations[0];
                removeHorizontalRootMotion(clip);
                const action = mixer.clipAction(clip);
                const isAttack = anim.name === 'Attack1' || anim.name === 'Attack2';
                const isOneShot = isAttack || anim.name === 'MutantDead';
                action.setLoop(isOneShot ? THREE.LoopOnce : THREE.LoopRepeat, isOneShot ? 1 : Infinity);
                action.clampWhenFinished = isOneShot;

                actions[anim.name] = action;

                if (anim.name === 'idle') playAnimation('idle');
                if (anim.name === 'Attack1' && attack1Requested) startAttack('Attack1');
                if (anim.name === 'Attack2' && attack2Requested) startAttack('Attack2');

                },
                undefined,
                (error) => console.error(`Could not load animation ${anim.file}:`, error)
            );

            });

        }

        function getRootBoneNames(model) {
            const names = [];

            model.traverse((node) => {
                if (!node.isBone) return;

                let parent = node.parent;
                while (parent && !parent.isBone) parent = parent.parent;
                if (!parent) names.push(node.name.toLowerCase());
            });

            return names;
        }

        function getPlayerClawBones(model) {
            const namedClaws = [];
            const hands = [];
            const fingerTips = new Map();

            model.traverse((node) => {
                if (!node.isBone) return;

                const name = node.name.toLowerCase();
                if (name.includes('claw')) {
                    namedClaws.push(node);
                    return;
                }

                if (/(left|right)hand$/.test(name)) {
                    hands.push(node);
                    return;
                }

                const finger = name.match(/(left|right)hand(index|middle|ring|pinky|little|thumb)(\d+)$/);
                if (!finger) return;

                const key = `${finger[1]}-${finger[2]}`;
                const joint = Number(finger[3]);
                const current = fingerTips.get(key);
                if (!current || joint > current.joint) {
                    fingerTips.set(key, { bone: node, joint });
                }
            });

            if (namedClaws.length > 0) return namedClaws;
            return hands.concat(Array.from(fingerTips.values(), (tip) => tip.bone));
        }

        function removeHorizontalRootMotion(clip, boneNames = rootBoneNames) {
            clip.tracks.forEach((track) => {
                if (!track.name.endsWith('.position')) return;

                const targetName = track.name.slice(0, -'.position'.length).toLowerCase();
                if (!boneNames.some((name) => targetName.includes(name))) return;

                const values = track.values;
                const startX = values[0];
                const startZ = values[2];

                for (let i = 0; i < values.length; i += 3) {
                    values[i] = startX;
                    values[i + 2] = startZ;
                }
            });
        }

        function onWindowResize() {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);

        }

        //

        function animate() {

            timer.update();

            const delta = timer.getDelta();

            if (toxicFogMaterial) toxicFogMaterial.uniforms.uTime.value += delta;
            if (mixer) mixer.update(delta);
            if (object) object.position.copy(modelRestPosition);

            if (object && playerSpawned && gameplayReady) {
                if (!isPlayerDead && !isAttackInProgress()) {
                    const direction = getMovementDirection();

                    if (direction.lengthSq() > 0) {
                        direction.normalize();
                        const running = pressedKeys.has('shift');
                        manualAnimation = false;
                        movePlayer(direction, (running ? runSpeed : walkSpeed) * delta);
                        targetRotation.setFromAxisAngle(upAxis, Math.atan2(direction.x, direction.z));
                        playerAnchor.quaternion.rotateTowards(targetRotation, turnSpeed * delta);
                        playAnimation(running ? 'Run' : 'Mutant_Walking');
                    } else if (!manualAnimation) {
                        playAnimation('idle');
                    }
                }

                if (!isPlayerDead) updatePlayerMeleeAttacks();
                updateFollowCamera(delta);
            }

            updatePoliceAI(delta);
            updatePoliceWeapons(delta);
            updateStompSound(delta);
            renderer.render(scene, camera);

            stats.update();

        }

        function movePlayer(direction, distance) {
            if (!streetBounds) return;

            if (direction.x !== 0) tryMovePlayerAxis('x', direction.x * distance);
            if (direction.z !== 0) tryMovePlayerAxis('z', direction.z * distance);
        }

        function tryMovePlayerAxis(axis, distance) {
            const nextPosition = playerAnchor.position[axis] + distance;
            const min = streetBounds.min[axis] + playerRadius;
            const max = streetBounds.max[axis] - playerRadius;
            if (nextPosition < min || nextPosition > max) return;

            collisionDirection.set(0, 0, 0);
            collisionDirection[axis] = Math.sign(distance);
            const rayDistance = Math.abs(distance) + playerRadius;

            for (const height of collisionHeights) {
                collisionOrigin.copy(playerAnchor.position);
                collisionOrigin.y += height;
                collisionRaycaster.set(collisionOrigin, collisionDirection);
                collisionRaycaster.far = rayDistance;

                if (collisionRaycaster.intersectObjects(streetMeshes, false).length > 0) return;
            }

            playerAnchor.position[axis] = nextPosition;
        }

        function updatePoliceAI(delta) {
            if (!playerSpawned) return;

            for (const agent of policeAgents) {
                if (agent.isDead || isPlayerDead) {
                    agent.mixer.update(delta);
                    continue;
                }

                agent.toPlayer.set(
                    playerAnchor.position.x - agent.root.position.x,
                    0,
                    playerAnchor.position.z - agent.root.position.z
                );
                const distance = agent.toPlayer.length();
                let targetAction = agent.idleAction;

                if (!agent.isPlayerClose && distance <= agent.stopDistance) {
                    agent.isPlayerClose = true;
                    agent.isTakingBreak = true;
                } else if (agent.isPlayerClose && distance > agent.stopDistance + agent.closeHysteresis) {
                    agent.isPlayerClose = false;
                    agent.isTakingBreak = true;
                    agent.behaviorTimer = THREE.MathUtils.randFloat(0.8, 2);
                }

                if (!agent.isPlayerClose) {
                    agent.behaviorTimer -= delta;
                    if (agent.behaviorTimer <= 0) {
                        agent.isTakingBreak = !agent.isTakingBreak;
                        agent.behaviorTimer = agent.isTakingBreak
                            ? THREE.MathUtils.randFloat(0.8, 2.5)
                            : THREE.MathUtils.randFloat(1.5, 4);
                    }

                    if (!agent.isTakingBreak) {
                        if (distance > agent.tacticalDistance + 6) {
                            agent.moveDirection.copy(agent.toPlayer);
                            targetAction = agent.moveAction;
                        } else {
                            agent.moveDirection.set(
                                -agent.toPlayer.z * agent.flankDirection,
                                0,
                                agent.toPlayer.x * agent.flankDirection
                            );
                            targetAction = agent.flankDirection > 0
                                ? agent.rightAction
                                : agent.leftAction;
                        }

                        targetAction = addPoliceSeparation(agent, distance, targetAction);
                        agent.moveDirection.normalize();
                        if (!movePoliceAgent(agent, policeMoveSpeed * delta)) {
                            agent.isTakingBreak = true;
                            agent.behaviorTimer = THREE.MathUtils.randFloat(0.8, 2.5);
                            targetAction = agent.idleAction;
                        }
                    }
                }

                if (distance > 0) {
                    agent.targetRotation.setFromAxisAngle(
                        upAxis,
                        Math.atan2(agent.toPlayer.x, agent.toPlayer.z)
                    );
                    agent.root.quaternion.rotateTowards(agent.targetRotation, turnSpeed * delta);
                }

                if (agent.activeAction !== targetAction) {
                    agent.activeAction.fadeOut(0.2);
                    targetAction.reset().fadeIn(0.2).play();
                    agent.activeAction = targetAction;
                }
                agent.mixer.update(delta);
            }
        }

        function addPoliceSeparation(agent, distanceToPlayer, targetAction) {
            agent.separationDirection.set(0, 0, 0);

            for (const other of policeAgents) {
                if (other === agent) continue;

                const offsetX = agent.root.position.x - other.root.position.x;
                const offsetZ = agent.root.position.z - other.root.position.z;
                const distance = Math.hypot(offsetX, offsetZ);
                const separationDistance = Math.max(
                    streetScale,
                    (agent.radius + other.radius) * 4
                );
                if (distance === 0 || distance >= separationDistance) continue;

                const strength = (separationDistance - distance) / separationDistance;
                agent.separationDirection.x += (offsetX / distance) * strength;
                agent.separationDirection.z += (offsetZ / distance) * strength;
            }

            if (agent.separationDirection.lengthSq() === 0) return targetAction;

            agent.separationDirection.normalize();
            agent.moveDirection.addScaledVector(agent.separationDirection, 2);

            const localRightX = agent.toPlayer.z / distanceToPlayer;
            const localRightZ = -agent.toPlayer.x / distanceToPlayer;
            const lateralMovement = agent.moveDirection.x * localRightX +
                agent.moveDirection.z * localRightZ;
            if (Math.abs(lateralMovement) > 0.25) {
                targetAction = lateralMovement > 0 ? agent.leftAction : agent.rightAction;
            }

            return targetAction;
        }

        function movePoliceAgent(agent, distance) {
            let moved = false;

            for (const axis of ['x', 'z']) {
                const axisDistance = agent.moveDirection[axis] * distance;
                if (axisDistance === 0) continue;

                const nextPosition = agent.root.position[axis] + axisDistance;
                const min = streetBounds.min[axis] + agent.radius;
                const max = streetBounds.max[axis] - agent.radius;
                if (nextPosition < min || nextPosition > max) continue;

                const nextX = axis === 'x' ? nextPosition : agent.root.position.x;
                const nextZ = axis === 'z' ? nextPosition : agent.root.position.z;
                const overlapsPolice = policeAgents.some((other) => {
                    if (other === agent) return false;

                    const minimumDistance = Math.max(
                        streetScale * 0.8,
                        (agent.radius + other.radius) * 3
                    );
                    const nextDistance = Math.hypot(
                        nextX - other.root.position.x,
                        nextZ - other.root.position.z
                    );
                    const currentDistance = Math.hypot(
                        agent.root.position.x - other.root.position.x,
                        agent.root.position.z - other.root.position.z
                    );
                    return nextDistance < minimumDistance && nextDistance < currentDistance;
                });
                if (overlapsPolice) continue;

                agent.collisionDirection.set(0, 0, 0);
                agent.collisionDirection[axis] = Math.sign(axisDistance);
                agent.collisionRaycaster.far = Math.abs(axisDistance) + agent.radius;

                let blocked = false;
                for (const height of agent.collisionHeights) {
                    agent.collisionOrigin.copy(agent.root.position);
                    agent.collisionOrigin.y += height;
                    agent.collisionRaycaster.set(agent.collisionOrigin, agent.collisionDirection);
                    if (agent.collisionRaycaster.intersectObjects(streetMeshes, false).length > 0) {
                        blocked = true;
                        break;
                    }
                }

                if (!blocked) {
                    agent.root.position[axis] = nextPosition;
                    moved = true;
                }
            }

            return moved;
        }

        function updatePoliceWeapons(delta) {
            for (const agent of policeAgents) {
                if (!agent.weapon) continue;

                if (agent.weapon.hand) {
                    agent.weapon.hand.updateWorldMatrix(true, false);
                    agent.weapon.hand.getWorldPosition(agent.weapon.handPosition);
                    agent.root.worldToLocal(agent.weapon.handPosition);
                    agent.weapon.mount.position.copy(agent.weapon.handPosition);
                }

                if (agent.muzzleFlashTimer > 0) {
                    agent.muzzleFlashTimer = Math.max(0, agent.muzzleFlashTimer - delta);
                    if (agent.muzzleFlashTimer === 0) {
                        agent.weapon.flash.visible = false;
                        agent.weapon.light.visible = false;
                    }
                }

                if (agent.isDead || isPlayerDead) continue;

                agent.shotTimer -= delta;
                if (agent.shotTimer <= 0) {
                    firePoliceBullet(agent);
                    agent.shotTimer = THREE.MathUtils.randFloat(policeMinShotInterval, policeMaxShotInterval);
                }
            }

            updatePoliceBullets(delta);
        }

        function firePoliceBullet(agent) {
            if (!policeBulletTemplate || !playerAnchor) return;

            agent.weapon.muzzle.updateWorldMatrix(true, false);
            const origin = agent.weapon.muzzle.getWorldPosition(new THREE.Vector3());
            policeBulletTarget.copy(playerAnchor.position);
            policeBulletTarget.y += modelSize.y * 0.55;

            const direction = policeBulletTarget.sub(origin);
            if (direction.lengthSq() === 0) {
                direction.set(0, 0, 1).applyQuaternion(agent.root.quaternion);
            } else {
                direction.normalize();
            }

            const bullet = policeBulletTemplate.clone(true);
            bullet.position.copy(origin);
            bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
            scene.add(bullet);
            policeBullets.push({
                object: bullet,
                direction: direction.clone(),
                lifetime: policeBulletLifetime
            });

            agent.weapon.flash.visible = true;
            agent.weapon.light.visible = true;
            agent.muzzleFlashTimer = policeMuzzleFlashDuration;
            playPoliceShootSound(agent);
        }

        function playPoliceShootSound(agent) {
            if (!breathingAudioUnlocked) return;

            agent.shootSound.currentTime = 0;
            agent.shootSound.play().catch((error) => {
                if (error.name === 'AbortError') return;

                if (error.name === 'NotAllowedError') {
                    console.info('Police gunshot audio autoplay is blocked until the first user interaction.');
                    return;
                }

                console.error('Could not play the police gunshot sound:', error);
            });
        }

        function updatePoliceBullets(delta) {
            if (!playerAnchor || policeBullets.length === 0) return;

            policeBulletTarget.copy(playerAnchor.position);
            policeBulletTarget.y += modelSize.y * 0.55;

            for (let i = policeBullets.length - 1; i >= 0; i--) {
                const bullet = policeBullets[i];
                const travelDistance = policeBulletSpeed * delta;
                policeBulletRaycaster.set(bullet.object.position, bullet.direction);
                policeBulletRaycaster.far = travelDistance;
                const obstacle = policeBulletRaycaster.intersectObjects(streetMeshes, false)[0];

                if (obstacle && obstacle.distance <= travelDistance) {
                    scene.remove(bullet.object);
                    policeBullets.splice(i, 1);
                    continue;
                }

                bullet.object.position.addScaledVector(bullet.direction, travelDistance);
                bullet.lifetime -= delta;
                const playerHitRadius = Math.max(playerRadius, modelSize.y * 0.2);
                if (bullet.object.position.distanceToSquared(policeBulletTarget) <= playerHitRadius ** 2 ||
                    bullet.lifetime <= 0) {
                    if (bullet.object.position.distanceToSquared(policeBulletTarget) <= playerHitRadius ** 2) {
                        damagePlayer(1);
                    }
                    scene.remove(bullet.object);
                    policeBullets.splice(i, 1);
                }
            }
        }

        function updatePlayerMeleeAttacks() {
            if (!isAttackInProgress()) return;

            const action = actions[activeAnimationName];
            const duration = action && action.getClip().duration;
            if (!duration) return;

            const progress = action.time / duration;
            if (progress < 0.2 || progress > 0.8) return;

            playerAnchor.updateMatrixWorld(true);
            const clawHitRadius = Math.max(playerRadius * 0.2, modelSize.y * 0.035);
            const attackAreaRadius = Math.max(playerRadius * 3, modelSize.y * 1.5);
            for (const agent of policeAgents) {
                if (agent.isDead || attackHitPolice.has(agent)) continue;

                const offsetX = agent.root.position.x - playerAnchor.position.x;
                const offsetZ = agent.root.position.z - playerAnchor.position.z;
                const areaRange = attackAreaRadius + agent.radius;
                const areaHit = offsetX * offsetX + offsetZ * offsetZ <= areaRange * areaRange;
                policeHitCenter.set(
                    agent.root.position.x,
                    agent.root.position.y + agent.height * 0.45,
                    agent.root.position.z
                );
                const hitRange = clawHitRadius + Math.max(agent.radius, agent.height * 0.15);
                const hitRangeSquared = hitRange * hitRange;
                const clawHit = playerClawBones.some((bone) =>
                    bone.getWorldPosition(clawWorldPosition).distanceToSquared(policeHitCenter) <= hitRangeSquared
                );
                if (!clawHit && !areaHit) continue;

                attackHitPolice.add(agent);
                damagePolice(agent, 1);
            }
        }

        function damagePolice(agent, amount) {
            if (agent.isDead) return;

            agent.health = Math.max(0, agent.health - amount);
            if (agent.health > 0) return;

            agent.isDead = true;
            agent.weapon.flash.visible = false;
            agent.weapon.light.visible = false;
            agent.mixer.stopAllAction();
            agent.deadAction.reset().play();
            agent.activeAction = agent.deadAction;
            agent.activeActionName = 'dead';
        }

        function damagePlayer(amount) {
            if (isPlayerDead || !gameplayReady) return;

            playerHealth = Math.max(0, playerHealth - amount);
            updateDamageOverlay();
            if (playerHealth > 0) return;

            isPlayerDead = true;
            pressedKeys.clear();
            breathingShouldPlay = false;
            runBreathShouldPlay = false;
            syncBreathingSound();
            syncRunBreathSound();
            manualAnimation = true;
            activeAnimationName = null;
            playAnimation('MutantDead');
        }

        function updateDamageOverlay() {
            if (!damageOverlay) return;

            const damageRatio = 1 - playerHealth / playerMaxHealth;
            const clearRadius = 46 * (1 - Math.pow(damageRatio, 0.55));
            const redOpacity = 0.82 * Math.sqrt(damageRatio);
            damageOverlay.style.background =
                `radial-gradient(ellipse at center, rgba(160, 0, 0, 0) ${clearRadius.toFixed(1)}%, ` +
                `rgba(120, 0, 0, ${redOpacity.toFixed(3)}) 100%)`;
        }

        function playAnimation(name) {
            if (isPlayerDead && name !== 'MutantDead') return;
            if (isAttackInProgress() && name !== activeAnimationName &&
                !(activeAnimationName === 'Attack1' && name === 'Attack2' && attack2Requested)) {
                return;
            }

            breathingShouldPlay = name === 'idle' || name === 'Mutant_Walking';
            runBreathShouldPlay = name === 'Run';
            syncBreathingSound();
            syncRunBreathSound();

            const newAction = actions[name];

            const isAttack = name === 'Attack1' || name === 'Attack2';
            if (newAction && (newAction !== activeAction || isAttack)) {

                newAction.reset().play();
                if (activeAction && activeAction !== newAction) activeAction.crossFadeTo(newAction, 0.2, true);
                activeAction = newAction;
                activeAnimationName = name;
                if (isAttack) attackHitPolice.clear();
                if (name === 'Run') playGrowlSound();
                if (name === 'Attack1') playAttack1Sound();
                if (name === 'Attack2') playAttack2Sound();

            }
        }

        function playAttack1Sound() {
            if (!breathingAudioUnlocked) return;

            attack1Sound.currentTime = 0;
            attack1Sound.play().catch((error) => {
                if (error.name === 'AbortError') return;

                if (error.name === 'NotAllowedError') {
                    console.info('Attack 1 audio autoplay is blocked until the first user interaction.');
                    return;
                }

                console.error('Could not play the Attack 1 sound:', error);
            });
        }

        function playAttack2Sound() {
            if (!breathingAudioUnlocked) return;

            attack2Sound.currentTime = 0;
            attack2Sound.play().catch((error) => {
                if (error.name === 'AbortError') return;

                if (error.name === 'NotAllowedError') {
                    console.info('Attack 2 audio autoplay is blocked until the first user interaction.');
                    return;
                }

                console.error('Could not play the Attack 2 sound:', error);
            });
        }

        function isAttackInProgress() {
            return activeAnimationName === 'Attack1' || activeAnimationName === 'Attack2';
        }

        function requestAttack() {
            if (!gameplayReady || isPlayerDead || !playerSpawned ||
                activeAnimationName === 'Attack2' || attack2Requested) return;

            if (activeAnimationName === 'Attack1' || attack1Requested) {
                attack2Queued = true;
                return;
            }

            attack2Queued = false;
            attack1Requested = true;
            startAttack('Attack1');
        }

        function startAttack(name) {
            if (!actions[name]) return false;

            manualAnimation = false;
            playAnimation(name);
            if (activeAnimationName !== name) return false;

            if (name === 'Attack1') attack1Requested = false;
            if (name === 'Attack2') attack2Requested = false;
            return true;
        }

        function onAnimationFinished(event) {
            if (isPlayerDead) return;

            if (event.action === actions.Attack1) {
                if (attack2Queued || pressedKeys.has('k')) {
                    attack2Queued = false;
                    attack2Requested = true;
                    startAttack('Attack2');
                } else {
                    attack1Requested = false;
                    activeAnimationName = null;
                }
                return;
            }

            if (event.action === actions.Attack2) {
                attack1Requested = false;
                attack2Queued = false;
                attack2Requested = false;
                activeAnimationName = null;
            }
        }

        function playGrowlSound() {
            if (!breathingAudioUnlocked) return;

            growlSound.currentTime = 0;
            growlSound.play().catch((error) => {
                if (error.name === 'AbortError') return;

                if (error.name === 'NotAllowedError') {
                    console.info('Growl audio autoplay is blocked until the first user interaction.');
                    return;
                }

                console.error('Could not play the mutant growl sound:', error);
            });
        }

        function unlockBreathingSound() {
            breathingAudioUnlocked = true;
            breathingPlaybackFailed = false;
            runBreathPlaybackFailed = false;
            stompPlaybackFailed = false;
            syncBreathingSound();
            syncRunBreathSound();
        }

        function syncBreathingSound() {
            if (!breathingShouldPlay) {
                if (!breathingSound.paused) {
                    breathingResumePosition = breathingSound.currentTime;
                }
                breathingSound.pause();
                breathingPlayPending = false;
                return;
            }

            if (!breathingAudioUnlocked || !breathingSound.paused ||
                breathingPlayPending || breathingPlaybackFailed) {
                return;
            }

            if (breathingSound.currentTime === 0 && breathingResumePosition > 0) {
                breathingSound.currentTime = breathingResumePosition;
            }

            breathingPlayPending = true;
            breathingSound.play().then(() => {
                breathingPlayPending = false;
                breathingResumePosition = 0;
            }).catch((error) => {
                breathingPlayPending = false;
                if (error.name === 'AbortError') return;

                breathingPlaybackFailed = true;
                if (error.name === 'NotAllowedError') {
                    breathingAudioUnlocked = false;
                    console.info('Breathing audio autoplay is blocked until the first user interaction.');
                    return;
                }

                console.error('Could not play the mutant breathing sound:', error);
            });
        }

        function syncRunBreathSound() {
            if (!runBreathShouldPlay) {
                runBreathSound.pause();
                runBreathPlayPending = false;
                return;
            }

            if (!breathingAudioUnlocked || !runBreathSound.paused ||
                runBreathPlayPending || runBreathPlaybackFailed) {
                return;
            }

            runBreathPlayPending = true;
            runBreathSound.play().then(() => {
                runBreathPlayPending = false;
            }).catch((error) => {
                runBreathPlayPending = false;
                if (error.name === 'AbortError') return;

                runBreathPlaybackFailed = true;
                if (error.name === 'NotAllowedError') {
                    breathingAudioUnlocked = false;
                    console.info('Running breath audio autoplay is blocked until the first user interaction.');
                    return;
                }

                console.error('Could not play the mutant running breath sound:', error);
            });
        }

        function updateStompSound(delta) {
            if (!activeAction || (activeAnimationName !== 'Mutant_Walking' && activeAnimationName !== 'Run')) {
                lastStompAnimationName = null;
                stompIntervalTimer = 0;
                return;
            }

            if (activeAnimationName !== lastStompAnimationName) {
                lastStompAnimationName = activeAnimationName;
                stompIntervalTimer = 0;
                return;
            }

            const interval = activeAnimationName === 'Run' ? 0.39 : 0.69;
            stompIntervalTimer += delta;

            if (stompIntervalTimer >= interval) {
                stompIntervalTimer = 0;
                playStompSound();
            }
        }

        function playStompSound() {
            if (!breathingAudioUnlocked || stompPlaybackFailed) return;

            const sound = stompSoundPool[nextStompSoundIndex];
            nextStompSoundIndex = (nextStompSoundIndex + 1) % stompSoundPool.length;
            sound.currentTime = 0;
            sound.play().then(() => {
                if (activeAnimationName === 'Mutant_Walking') {
                    cameraShakeElapsed = 0;
                    lastCameraShakeAnimation = 'Mutant_Walking';
                }
            }).catch((error) => {
                if (error.name === 'AbortError') return;

                stompPlaybackFailed = true;
                if (error.name === 'NotAllowedError') {
                    console.info('Stomp audio autoplay is blocked until the first user interaction.');
                    return;
                }

                console.error('Could not play the mutant stomp sound:', error);
            });
        }

        function updateFollowCamera(delta) {
            cameraRig.position.copy(playerAnchor.position);
            cameraRig.rotation.set(cameraPitch, cameraYaw, 0, 'YXZ');

            const isWalking = activeAnimationName === 'Mutant_Walking';
            const isRunning = activeAnimationName === 'Run';

            if (!activeAction || (!isWalking && !isRunning)) {
                cameraShakeElapsed = 0;
                lastCameraShakeAnimation = null;
                cameraMotion.position.set(0, 0, 0);
                cameraMotion.rotation.z = 0;
            } else {
                const verticalShakeInterval = isRunning ? 0.39 : 0.67;
                if (activeAnimationName !== lastCameraShakeAnimation) {
                    cameraShakeElapsed = 0;
                    lastCameraShakeAnimation = activeAnimationName;
                }
                cameraShakeElapsed += delta;
                const shakeScale = isRunning ? 0.4 : 0.8;
                const verticalShakeAmount = isRunning ? 4 : 1;
                const pulseTime = cameraShakeElapsed % verticalShakeInterval;

                if (pulseTime < cameraShakePulseDuration) {
                    const pulsePhase = pulseTime / cameraShakePulseDuration * Math.PI * 2;
                    cameraMotion.position.set(
                        Math.sin(pulsePhase * 3) * 2 * cameraScaleFactor * shakeScale,
                        Math.sin(pulsePhase) * verticalShakeAmount * cameraScaleFactor * shakeScale,
                        0
                    );
                    cameraMotion.rotation.z = Math.sin(pulsePhase) * 0.008 * shakeScale;
                } else {
                    cameraMotion.position.set(0, 0, 0);
                    cameraMotion.rotation.z = 0;
                }
            }

            cameraRig.updateMatrixWorld(true);
            cameraFocusOffset.set(cameraOffset.x, cameraLookOffset.y, 0);
            cameraRelativeOffset.copy(cameraOffset).sub(cameraFocusOffset);
            cameraFocusWorld.copy(cameraFocusOffset).applyMatrix4(cameraMotion.matrixWorld);
            cameraDesiredWorld.copy(cameraOffset).applyMatrix4(cameraMotion.matrixWorld);
            cameraRayDirection.subVectors(cameraDesiredWorld, cameraFocusWorld);
            const desiredDistance = cameraRayDirection.length();
            let targetDistanceFactor = 1;

            if (streetMeshes.length > 0 && desiredDistance > 0) {
                cameraRayDirection.normalize();
                cameraRaycaster.set(cameraFocusWorld, cameraRayDirection);
                cameraRaycaster.far = desiredDistance;
                const obstruction = cameraRaycaster.intersectObjects(streetMeshes, false)[0];

                if (obstruction) {
                    const safeDistance = Math.max(
                        cameraMinimumDistance,
                        obstruction.distance - cameraCollisionClearance
                    );
                    targetDistanceFactor = Math.min(1, safeDistance / desiredDistance);
                }
            }

            if (targetDistanceFactor < cameraDistanceFactor) {
                cameraDistanceFactor = targetDistanceFactor;
            } else {
                cameraDistanceFactor = THREE.MathUtils.damp(cameraDistanceFactor, targetDistanceFactor, 5, delta);
            }

            camera.position.copy(cameraFocusOffset).addScaledVector(cameraRelativeOffset, cameraDistanceFactor);
        }

        function onMouseMove(event) {
            if (document.pointerLockElement === renderer.domElement) {
                rotateCamera(event.movementX, event.movementY);
            } else if (mouseDragging) {
                rotateCamera(event.clientX - lastMouseX, event.clientY - lastMouseY);
                lastMouseX = event.clientX;
                lastMouseY = event.clientY;
            }
        }

        function rotateCamera(deltaX, deltaY) {
            cameraYaw -= deltaX * mouseSensitivity;
            cameraPitch = THREE.MathUtils.clamp(
                cameraPitch + deltaY * mouseSensitivity,
                minCameraPitch,
                maxCameraPitch
            );
        }


        function getMovementDirection() {
            const forwardInput = Number(pressedKeys.has('w')) - Number(pressedKeys.has('s'));
            const rightInput = Number(pressedKeys.has('d')) - Number(pressedKeys.has('a'));
            const direction = new THREE.Vector3();

            cameraForward.set(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
            cameraRight.set(-Math.cos(cameraYaw), 0, Math.sin(cameraYaw));
            direction.addScaledVector(cameraForward, forwardInput);
            direction.addScaledVector(cameraRight, rightInput);

            return direction;
        }

        const movementKeys = new Set(['w', 'a', 's', 'd']);

        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            const target = event.target;
            const isTyping = target instanceof HTMLElement &&
                (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

            if (isTyping) return;
            if (!gameplayReady || isPlayerDead) {
                if (movementKeys.has(key) || key === 'shift' || key === 'k') event.preventDefault();
                return;
            }

            if (movementKeys.has(key)) {
                event.preventDefault();
                pressedKeys.add(key);
                unlockBreathingSound();
                return;
            }

            if (key === 'shift') {
                pressedKeys.add('shift');
                unlockBreathingSound();
                return;
            }

            if (key === 'k') {
                event.preventDefault();
                pressedKeys.add('k');
                unlockBreathingSound();
                requestAttack();
                return;
            }

            if (isAttackInProgress()) return;

            switch (key) {
                case '1':
                    manualAnimation = true;
                    playAnimation('idle');
                    unlockBreathingSound();
                    break;
                case '4':
                    manualAnimation = true;
                    playAnimation('Boxing');
                    unlockBreathingSound();
                    break;
                case '5':
                    manualAnimation = true;
                    playAnimation('Flair');
                    unlockBreathingSound();
                    break;
            }
        });

        window.addEventListener('keyup', (event) => {
            pressedKeys.delete(event.key.toLowerCase());
        });

        window.addEventListener('blur', () => pressedKeys.clear());

