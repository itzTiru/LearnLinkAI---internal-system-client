"use client";
import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default function ThreeScene() {
  useEffect(() => {
    const canvas = document.querySelector("#goo-canvas");
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 5;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Light
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    // Group
    const rotatingGroup = new THREE.Group();
    scene.add(rotatingGroup);

    // --- Stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starsPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starsPositions[i] = (Math.random() - 0.5) * 200;
    }
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starsPositions, 3)
    );
    const starMaterial = new THREE.PointsMaterial({
      color: 0xff00ff,
      size: 0.1,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- Inner Mesh
    const innerGeometry = new THREE.IcosahedronGeometry(1, 1);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.5,
      metalness: 1,
      flatShading: true,
      transparent: true,
      opacity: 0.7,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    rotatingGroup.add(innerMesh);

    // --- Wireframe
    const outerGeometry = new THREE.IcosahedronGeometry(1.15, 1);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const wireframeMesh = new THREE.Mesh(outerGeometry, wireframeMaterial);
    rotatingGroup.add(wireframeMesh);

    // --- Particles
    const positions = [];
    const posAttr = outerGeometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff00ff,
      size: 0.025,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    rotatingGroup.add(particles);

    // --- Postprocessing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // Hardcoded Bloom values
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.1, // Strength
      0.7, // Radius
      0.295 // Threshold
    );
    composer.addPass(bloomPass);

    // --- Shockwave shader with hardcoded values
    const ShockwaveShader = {
      uniforms: {
        tDiffuse: { value: null },
        center: { value: new THREE.Vector2(0.5, 0.5) },
        time: { value: 0.0 },
        maxRadius: { value: 1.0 },
        amplitude: { value: 0.1 },
        speed: { value: 0.1 },
        width: { value: 0.19 },
        aspect: { value: window.innerWidth / window.innerHeight },
        smoothing: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        #define PI 3.14159265359
        uniform sampler2D tDiffuse;
        uniform vec2 center;
        uniform float time;
        uniform float maxRadius;
        uniform float amplitude;
        uniform float speed;
        uniform float width;
        uniform float aspect;
        uniform float smoothing;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv;
          vec2 aspectUV = vec2((uv.x - center.x) * aspect, uv.y - center.y);
          float dist = length(aspectUV);
          float wave = 0.0;
          float t = mod(time * speed, maxRadius + width);
          if (dist < t && dist > t - width) {
            float edgeDist = abs(dist - (t - width / 2.0)) / (width / 2.0);
            float smoothFactor = smoothstep(1.0 - smoothing, 1.0, edgeDist);
            wave = amplitude * sin((dist - t + width) / width * PI * 2.0) * (1.0 - smoothFactor);
          }
          uv += normalize(aspectUV) * wave;
          gl_FragColor = texture2D(tDiffuse, uv);
        }
      `,
    };

    const shockwavePass = new ShaderPass(ShockwaveShader);
    composer.addPass(shockwavePass);

    let shockwaveActive = false;
    let shockwaveStartTime = 0;
    const shockwaveDuration = 10;

    // Trigger shockwave on double click
    window.addEventListener("dblclick", (event) => {
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      shockwavePass.uniforms.center.value.set(
        (mouseX + 1) / 2,
        (mouseY + 1) / 2
      );
      shockwaveActive = true;
      shockwaveStartTime = performance.now() / 1000;
      shockwavePass.uniforms.time.value = 0.0;
    });

    // Handle resize
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      bloomPass.setSize(window.innerWidth, window.innerHeight);
      shockwavePass.uniforms.aspect.value =
        window.innerWidth / window.innerHeight;
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();

      rotatingGroup.rotation.x += 0.002;
      rotatingGroup.rotation.y += 0.003;

      if (shockwaveActive) {
        const elapsedTime = performance.now() / 1000 - shockwaveStartTime;
        if (elapsedTime < shockwaveDuration) {
          shockwavePass.uniforms.time.value = elapsedTime;
        } else {
          shockwaveActive = false;
          shockwavePass.uniforms.time.value = 0.0;
        }
      }
      composer.render();
    }

    animate();

    return () => {
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      id="goo-canvas"
      style={{ width: "100vw", height: "100vh", display: "block" }}
    />
  );
}