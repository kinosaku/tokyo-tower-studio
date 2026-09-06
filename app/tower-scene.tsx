'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTowerParts, type TowerPart, type TowerSectionId } from '../lib/tower-geometry';
import { sections } from '../lib/tower-sections';

export interface SceneHandle { reset(): void; zoom(factor: number): void }
interface Props {
  explosion: number; section: TowerSectionId | null; piece: string | null;
  isolated: boolean; labels: boolean; autoRotate: boolean; wireframe: boolean;
  onSelect: (part: TowerPart) => void; onReady: () => void; onError: (message: string) => void;
}
type PieceMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
const PARTS = createTowerParts();
const UP = new THREE.Vector3(0, 1, 0);

export const TowerScene = forwardRef<SceneHandle, Props>(function TowerScene(props, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const state = useRef(props);
  state.current = props;
  const actions = useRef<SceneHandle>({ reset() {}, zoom() {} });
  useImperativeHandle(ref, () => ({ reset: () => actions.current.reset(), zoom: f => actions.current.zoom(f) }), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { state.current.onError('无法启动 3D 视图。请启用浏览器硬件加速，或使用支持 WebGL 的浏览器。'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x090d12, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.65;
    host.insertBefore(renderer.domElement, host.firstChild);
    renderer.domElement.setAttribute('aria-label', '东京塔交互式三维模型，拖动旋转，滚轮缩放。也可使用周围的键盘操作按钮。');
    renderer.domElement.setAttribute('role', 'img');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 150);
    const controls = new OrbitControls(camera, renderer.domElement);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.enableDamping = !reducedMotion; controls.dampingFactor = 0.09;
    controls.minDistance = 0.15; controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI * 0.91;
    controls.autoRotateSpeed = 0.65;
    const ambient = new THREE.HemisphereLight(0xeaf3ff, 0x445269, 2.4); scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffe4cd, 4.2); key.position.set(3, 6, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xbedbff, 3.0); rim.position.set(-3, 2, -3); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 1.4); fill.position.set(-2, 1, 4); scene.add(fill);

    const colors = { orange: 0xf34d24, white: 0xf7eee3, glass: 0x294955, dark: 0x24303c, concrete: 0x7d8590 };
    const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => [name, new THREE.MeshStandardMaterial({ color, roughness: name === 'glass' ? 0.2 : 0.5, metalness: name === 'glass' ? 0.72 : 0.35 })])) as Record<TowerPart['color'], THREE.MeshStandardMaterial>;
    const dimMaterials = Object.fromEntries(Object.entries(materials).map(([name, mat]) => { const clone = mat.clone(); clone.color.multiplyScalar(0.3); return [name, clone]; })) as typeof materials;
    const highlight = new THREE.MeshStandardMaterial({ color: 0xffc66d, emissive: 0xc35a13, emissiveIntensity: 0.28, metalness: 0.35, roughness: 0.38 });
    const box = new THREE.BoxGeometry(1, 1, 1);
    const beam = new THREE.CylinderGeometry(1, 1, 1, 6);
    const geometries = new Set<THREE.BufferGeometry>([box, beam]);
    const meshes: PieceMesh[] = [];
    const originalScales: THREE.Vector3[] = [];
    const basePositions: THREE.Vector3[] = [];
    const group = new THREE.Group(); scene.add(group);
    PARTS.forEach(part => {
      let geometry: THREE.BufferGeometry = box;
      if (part.shape === 'beam') geometry = beam;
      if (part.shape === 'cylinder') { geometry = new THREE.CylinderGeometry(part.size[0], part.size[1], part.size[2], part.section === 'top-deck' ? 8 : 16); geometries.add(geometry); }
      const mesh = new THREE.Mesh(geometry, materials[part.color]);
      mesh.position.fromArray(part.position);
      if (part.shape === 'beam' && part.from && part.to) {
        const start = new THREE.Vector3(...part.from), end = new THREE.Vector3(...part.to);
        const direction = end.clone().sub(start);
        mesh.position.copy(start.add(end).multiplyScalar(0.5));
        mesh.quaternion.setFromUnitVectors(UP, direction.clone().normalize());
        mesh.scale.set(part.size[0], direction.length(), part.size[0]);
      } else if (part.shape === 'box') mesh.scale.fromArray(part.size);
      if (part.rotation) mesh.rotation.set(...part.rotation);
      mesh.userData.part = part;
      group.add(mesh); meshes.push(mesh);
      originalScales.push(mesh.scale.clone()); basePositions.push(mesh.position.clone());
    });

    const platform = new THREE.Group(); scene.add(platform);
    const podiumMat = new THREE.MeshStandardMaterial({ color: 0x151f2a, metalness: 0.68, roughness: 0.46 });
    const podiumGeo = new THREE.CylinderGeometry(1.1, 1.14, 0.07, 96); geometries.add(podiumGeo);
    const podium = new THREE.Mesh(podiumGeo, podiumMat); podium.position.y = -0.045; platform.add(podium);
    const topGeo = new THREE.CylinderGeometry(1.095, 1.095, 0.009, 96); geometries.add(topGeo);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x283543, roughness: 0.65, metalness: 0.6 });
    const top = new THREE.Mesh(topGeo, topMat); top.position.y = -0.003; platform.add(top);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc57841, transparent: true, opacity: 0.75 });
    const ringGeo = new THREE.TorusGeometry(1.102, 0.004, 6, 128); geometries.add(ringGeo);
    const ring = new THREE.Mesh(ringGeo, ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = -0.006; platform.add(ring);
    const outerGeo = new THREE.TorusGeometry(1.27, 0.0018, 4, 128); geometries.add(outerGeo);
    const outerMat = new THREE.MeshBasicMaterial({ color: 0x536173, transparent: true, opacity: 0.35 });
    const outer = new THREE.Mesh(outerGeo, outerMat); outer.rotation.x = Math.PI / 2; outer.position.y = -0.07; platform.add(outer);
    const grid = new THREE.GridHelper(20, 100, 0x293440, 0x17212b); grid.position.y = -0.085;
    (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = 0.23; scene.add(grid);
    scene.fog = new THREE.FogExp2(0x090d12, 0.08);

    const targets = basePositions.map(p => p.clone());
    let targetScale = 1, signature = '', frame = 0, disposed = false;
    let framing = true, fitDistance = 6, zoomMultiplier = 1;
    const fitCenter = new THREE.Vector3(0, 1.53, 0);
    camera.position.set(4, 2.8, 6); controls.target.copy(fitCenter); controls.update();
    const direction = new THREE.Vector3(0.62, 0.17, 1).normalize();
    let resetDirection = true;

    function updateTargets() {
      const s = state.current;
      const t = s.explosion / 100;
      const phase1 = THREE.MathUtils.smoothstep(t, 0, 0.55), phase2 = THREE.MathUtils.smoothstep(t, 0.55, 1);
      targetScale = THREE.MathUtils.lerp(1, 0.33, phase2);
      const eligible = PARTS.map((part, i) => ({ part, i })).filter(({ part }) => !s.isolated || (s.piece ? part.id === s.piece : !s.section || part.section === s.section));
      const columns = Math.min(30, Math.ceil(Math.sqrt(eligible.length * 1.65)));
      const rows = Math.ceil(eligible.length / Math.max(columns, 1));
      const bounds = new THREE.Box3();
      let slot = 0;
      PARTS.forEach((part, i) => {
        const visible = !s.isolated || (s.piece ? part.id === s.piece : !s.section || part.section === s.section);
        const mesh = meshes[i]; mesh.visible = visible;
        const selected = s.piece ? part.id === s.piece : s.section === part.section;
        mesh.material = selected ? highlight : s.section || s.piece ? dimMaterials[part.color] : materials[part.color];
        targets[i].copy(basePositions[i]);
        const system = sections.findIndex(v => v.id === part.section);
        const angle = system / 7 * Math.PI * 2;
        if (!s.isolated) targets[i].add(new THREE.Vector3(Math.sin(angle) * phase1 * 1.3, (system - 2) * phase1 * 0.23, Math.cos(angle) * phase1 * 0.85));
        if (visible) {
          const spread = new THREE.Vector3((slot % columns - (columns - 1) / 2) * 0.24, (rows - 1 - Math.floor(slot / columns)) * 0.24 + 0.25, 0);
          targets[i].lerp(spread, phase2); slot++;
          mesh.geometry.computeBoundingSphere();
          const radius = (mesh.geometry.boundingSphere?.radius ?? 0.1) * Math.max(...originalScales[i].toArray()) * targetScale;
          bounds.expandByPoint(targets[i].clone().addScalar(radius)); bounds.expandByPoint(targets[i].clone().addScalar(-radius));
        }
      });
      for (const material of [...Object.values(materials), ...Object.values(dimMaterials), highlight]) material.wireframe = s.wireframe;
      platform.visible = !s.isolated && t < 0.58; grid.visible = !s.isolated;
      if (bounds.isEmpty()) bounds.setFromCenterAndSize(new THREE.Vector3(0, 1.65, 0), new THREE.Vector3(2.3, 3.5, 2.3));
      if (!s.isolated && t === 0) { bounds.expandByPoint(new THREE.Vector3(-1.3, -0.1, -1.3)); bounds.expandByPoint(new THREE.Vector3(1.3, 3.36, 1.3)); }
      bounds.getCenter(fitCenter);
      const size = bounds.getSize(new THREE.Vector3());
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      fitDistance = Math.max(size.y / (2 * tan), size.x / (2 * tan * camera.aspect)) * 1.12 + size.z * 0.38;
      fitDistance = Math.max(fitDistance, 0.45);
      framing = true;
    }
    function resize() { const { width, height } = host!.getBoundingClientRect(); if (!width || !height) return; camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); updateTargets(); }
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    actions.current = {
      reset() { zoomMultiplier = 1; resetDirection = true; framing = true; },
      zoom(factor) { zoomMultiplier = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) / fitDistance * factor, 0.2, 4); framing = true; },
    };
    const cancelFraming = () => { framing = false; resetDirection = false; };
    controls.addEventListener('start', cancelFraming);
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    let down = { x: 0, y: 0, time: 0, id: -1 };
    const activePointers = new Set<number>();
    let tapEligible = false;
    const pointerDown = (event: PointerEvent) => {
      if (activePointers.size === 0) { down = { x: event.clientX, y: event.clientY, time: performance.now(), id: event.pointerId }; tapEligible = event.button === 0; }
      activePointers.add(event.pointerId);
      if (activePointers.size > 1) tapEligible = false;
    };
    const pointerMove = (event: PointerEvent) => { if (event.pointerId === down.id && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) tapEligible = false; };
    const pointerCancel = (event: PointerEvent) => { activePointers.delete(event.pointerId); tapEligible = false; };
    const pointerUp = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);
      const isTap = tapEligible && activePointers.size === 0 && event.pointerId === down.id;
      tapEligible = false;
      if (!isTap || event.button !== 0 || performance.now() - down.time > 650 || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes.filter(m => m.visible), false)[0];
      if (hit) state.current.onSelect(hit.object.userData.part as TowerPart);
    };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointercancel', pointerCancel);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); state.current.onError('3D 图形上下文已中断。请重新载入页面恢复模型。'); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const labelPositions = [new THREE.Vector3(0.03, 3.33, 0), new THREE.Vector3(0.09, 2.5, 0), new THREE.Vector3(0.25, 1.5, 0)];
    let lastTime = performance.now();
    function animate(now: number) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
      if (document.hidden) return;
      const p = state.current;
      const nextSignature = [p.explosion, p.section, p.piece, p.isolated, p.wireframe].join('|');
      if (signature !== nextSignature) { signature = nextSignature; updateTargets(); }
      const alpha = reducedMotion ? 1 : 1 - Math.exp(-delta * 9);
      meshes.forEach((mesh, i) => { if (mesh.visible) { mesh.position.lerp(targets[i], alpha); mesh.scale.lerp(originalScales[i].clone().multiplyScalar(targetScale), alpha); } });
      if (framing) {
        const offset = resetDirection ? direction.clone() : camera.position.clone().sub(controls.target).normalize();
        const desiredDistance = THREE.MathUtils.clamp(fitDistance * zoomMultiplier, controls.minDistance, controls.maxDistance);
        const desiredPosition = fitCenter.clone().addScaledVector(offset, desiredDistance);
        camera.position.lerp(desiredPosition, alpha); controls.target.lerp(fitCenter, alpha);
        if (camera.position.distanceTo(desiredPosition) < 0.001 && controls.target.distanceTo(fitCenter) < 0.001) { framing = false; resetDirection = false; }
      }
      controls.autoRotate = p.autoRotate && !framing; controls.update(delta);
      labelPositions.forEach((pos, i) => {
        const el = labelRefs.current[i]; if (!el) return;
        const projected = pos.clone().project(camera);
        el.style.display = p.labels && p.explosion < 2 && !p.isolated && projected.z < 1 ? 'block' : 'none';
        el.style.transform = `translate(${(projected.x + 1) * host!.clientWidth / 2 + 25}px, ${(-projected.y + 1) * host!.clientHeight / 2 - 10}px)`;
      });
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate); state.current.onReady();
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointerup', pointerUp); renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('pointermove', pointerMove); renderer.domElement.removeEventListener('pointercancel', pointerCancel);
      geometries.forEach(g => g.dispose());
      [...Object.values(materials), ...Object.values(dimMaterials), highlight, podiumMat, topMat, ringMat, outerMat].forEach(m => m.dispose());
      grid.geometry.dispose(); (grid.material as THREE.Material).dispose();
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div ref={hostRef} className="scene-host">{['333 m · 塔尖', '250 m · TOP DECK', '150 m · MAIN DECK'].map((label, i) => <div key={label} ref={el => { labelRefs.current[i] = el; }} className="height-label">{label}</div>)}</div>;
});
