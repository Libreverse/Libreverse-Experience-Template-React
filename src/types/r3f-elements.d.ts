import { extend } from '@react-three/fiber';
import { Object3DNode } from '@react-three/fiber';
import * as THREE from 'three';

extend(THREE);

declare module '@react-three/fiber' {
  interface ThreeElements {
    ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
    directionalLight: Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
    mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
    boxGeometry: Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>;
    sphereGeometry: Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>;
    planeGeometry: Object3DNode<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>;
    meshStandardMaterial: Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
    meshBasicMaterial: Object3DNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>;
    group: Object3DNode<THREE.Group, typeof THREE.Group>;
  }
}
