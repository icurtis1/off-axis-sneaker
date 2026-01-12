import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HeadPose } from './headPose';
import { OffAxisCamera } from './offAxisCamera';
import { calibrationManager, CalibrationData } from './calibration';

export interface ThreeSceneOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
}

export class ThreeSceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private offAxisCamera: OffAxisCamera;
  private model: THREE.Object3D | null = null;
  private animationFrameId: number | null = null;
  private isRunning = false;
  private currentHeadPose: HeadPose = { x: 0.5, y: 0.5, z: 1 };
  private debugMode: boolean = false;
  private debugHelpers: THREE.Object3D[] = [];
  private roomObjects: THREE.Object3D[] = [];

  constructor(options: ThreeSceneOptions) {
    const width = options.width || options.container.clientWidth;
    const height = options.height || options.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;

    const calibration = calibrationManager.getCalibration();
    calibration.pixelWidth = width;
    calibration.pixelHeight = height;
    calibrationManager.updatePixelDimensions(width, height);

    this.offAxisCamera = new OffAxisCamera(this.camera, calibration);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    options.container.appendChild(this.renderer.domElement);

    this.loadShoeModel();
    this.createWireframeRoom();
    this.createDebugHelpers();
  }

  private loadShoeModel(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, 0.5);
    this.scene.add(directionalLight2);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/models/shoe.glb',
      (gltf) => {
        this.model = gltf.scene;
        this.model.position.set(0, -0.09, -0.03);
        this.model.rotation.set(0, -0.628, 0);
        this.model.scale.set(0.071, 0.071, 0.071);
        this.scene.add(this.model);
      },
      undefined,
      (error) => {
        console.error('Error loading shoe model:', error);
      }
    );
  }

  private createWireframeRoom(): void {
    this.removeWireframeRoom();

    const screenDims = this.offAxisCamera.getScreenDimensions();
    const roomWidth = screenDims.width;
    const roomHeight = screenDims.height;
    const roomDepth = 0.35;
    const gridDivisions = 8;
    const gridColor = 0xff8c00;

    const wallMaterial = new THREE.LineBasicMaterial({
      color: gridColor,
      transparent: true,
      opacity: 0.8,
      depthTest: true,
      depthWrite: true,
      linewidth: 8
    });

    const createGridWall = (width: number, height: number): THREE.LineSegments => {
      const geometry = new THREE.BufferGeometry();
      const vertices: number[] = [];

      for (let i = 0; i <= gridDivisions; i++) {
        const t = i / gridDivisions;
        vertices.push(-width / 2 + t * width, -height / 2, 0);
        vertices.push(-width / 2 + t * width, height / 2, 0);
      }

      for (let i = 0; i <= gridDivisions; i++) {
        const t = i / gridDivisions;
        vertices.push(-width / 2, -height / 2 + t * height, 0);
        vertices.push(width / 2, -height / 2 + t * height, 0);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      return new THREE.LineSegments(geometry, wallMaterial);
    };

    const backWall = createGridWall(roomWidth, roomHeight);
    backWall.position.z = -roomDepth;
    this.scene.add(backWall);
    this.roomObjects.push(backWall);

    const leftWall = createGridWall(roomDepth, roomHeight);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -roomWidth / 2;
    leftWall.position.z = -roomDepth / 2;
    this.scene.add(leftWall);
    this.roomObjects.push(leftWall);

    const rightWall = createGridWall(roomDepth, roomHeight);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.x = roomWidth / 2;
    rightWall.position.z = -roomDepth / 2;
    this.scene.add(rightWall);
    this.roomObjects.push(rightWall);

    const floor = createGridWall(roomWidth, roomDepth);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = -roomHeight / 2;
    floor.position.z = -roomDepth / 2;
    this.scene.add(floor);
    this.roomObjects.push(floor);

    const ceiling = createGridWall(roomWidth, roomDepth);
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.position.y = roomHeight / 2;
    ceiling.position.z = -roomDepth / 2;
    this.scene.add(ceiling);
    this.roomObjects.push(ceiling);

    const screenFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(roomWidth, roomHeight)),
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 4,
        depthTest: true,
        depthWrite: true
      })
    );
    screenFrame.position.z = 0.001;
    this.scene.add(screenFrame);
    this.roomObjects.push(screenFrame);
  }

  private removeWireframeRoom(): void {
    this.roomObjects.forEach(obj => {
      this.scene.remove(obj);
      if (obj instanceof THREE.LineSegments) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose();
        }
      }
    });
    this.roomObjects = [];
  }

  private createDebugHelpers(): void {
    const axesHelper = new THREE.AxesHelper(0.1);
    axesHelper.visible = false;
    this.debugHelpers.push(axesHelper);
    this.scene.add(axesHelper);

    const headPositionMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff00ff })
    );
    headPositionMarker.visible = false;
    this.debugHelpers.push(headPositionMarker);
    this.scene.add(headPositionMarker);
  }

  updateHeadPose(headPose: HeadPose): void {
    this.currentHeadPose = headPose;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.debugHelpers.forEach(helper => {
      helper.visible = enabled;
    });
  }

  updateCalibration(calibration: CalibrationData): void {
    this.offAxisCamera.updateCalibration(calibration);
    this.createWireframeRoom();
  }

  updateModelPosition(x: number, y: number, z: number): void {
    if (this.model) {
      this.model.position.set(x, y, z);
    }
  }

  updateModelScale(scale: number): void {
    if (this.model) {
      this.model.scale.set(scale, scale, scale);
    }
  }

  getModelPosition(): { x: number; y: number; z: number } {
    if (this.model) {
      return {
        x: this.model.position.x,
        y: this.model.position.y,
        z: this.model.position.z
      };
    }
    return { x: 0, y: -0.09, z: -0.03 };
  }

  getModelScale(): number {
    if (this.model) {
      return this.model.scale.x;
    }
    return 0.071;
  }

  updateModelRotation(x: number, y: number, z: number): void {
    if (this.model) {
      this.model.rotation.set(x, y, z);
    }
  }

  getModelRotation(): { x: number; y: number; z: number } {
    if (this.model) {
      return {
        x: this.model.rotation.x,
        y: this.model.rotation.y,
        z: this.model.rotation.z
      };
    }
    return { x: 0, y: -0.628, z: 0 };
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    this.offAxisCamera.updateFromHeadPose(this.currentHeadPose);

    if (this.debugMode && this.debugHelpers.length > 1) {
      const worldPos = this.offAxisCamera.headPoseToWorldPosition(this.currentHeadPose);
      this.debugHelpers[1].position.set(worldPos.x, worldPos.y, worldPos.z);
    }

    this.renderer.render(this.scene, this.camera);
  };

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose(): void {
    this.stop();

    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }

    this.renderer.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
