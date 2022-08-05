import './style.css'
import * as THREE from 'three'
import Experience, { isDebug } from './utils/Experience'
import assets from './utils/assets'
import { addLights } from './scene/lights'
import { addEffects } from './scene/effects'
import customizeMaterial from './utils/customizeMaterial'

const webgl = new Experience({
  clearColor: '#020203',
  renderer: {
    canvas: document.querySelector('canvas.webgl') as HTMLCanvasElement,
  },
  orbitControls: true,
  stats: isDebug,
  gui: true,
  postprocessing: true,
})

if (webgl.gui) {
  webgl.gui.close()
}

assets.loadQueued().then(() => {
  const timeScale = {
    value: 1.0,
  }

  /**
   * Renderer
   */
  webgl.renderer.toneMapping = THREE.CineonToneMapping
  webgl.renderer.toneMappingExposure = 6

  /**
   * Camera
   */
  webgl.camera.fov = 30
  webgl.camera.near = 0.1
  webgl.camera.far = 20
  webgl.camera.updateProjectionMatrix()
  webgl.camera.position.set(-1, 0.65, 0.8).normalize().multiplyScalar(5)
  webgl.orbitControls!.target.y = 0.25
  webgl.orbitControls!.minDistance = 3
  webgl.orbitControls!.maxDistance = 8
  webgl.orbitControls!.minPolarAngle = 0
  webgl.orbitControls!.maxPolarAngle = Math.PI / 2 - 0.3
  webgl.orbitControls!.enablePan = false
  webgl.orbitControls!.enableDamping = true

  if (webgl.gui) {
    const clearColor = new THREE.Color(0, 0, 0)
    webgl.renderer.getClearColor(clearColor)
    webgl.gui
      .addColor(
        {
          clearColor,
        },
        'clearColor'
      )
      .onChange((color: THREE.Color) => {
        webgl.renderer.setClearColor(color)
      })
    webgl.gui
      .add(webgl.renderer, 'toneMappingExposure')
      .min(0.5)
      .max(10)
      .step(0.1)
    webgl.gui
      .add(webgl.camera, 'fov')
      .min(20)
      .max(60)
      .step(1)
      .onChange(() => {
        webgl.camera.updateProjectionMatrix()
      })
    webgl.gui.add(timeScale, 'value').min(0).max(2).step(0.1).name('timeScale')
    webgl.gui
      .add(
        {
          seguments: '256x256',
        },
        'seguments',
        ['128x128', '256x256', '384x384', '512x512']
      )
      .onChange((value: string) => {
        const seguments = value.split('x').map((s) => parseInt(s))
        setGeometry(seguments[0], seguments[1])
      })
  }

  /**
   * Objects
   */
  const { material, depthMaterial, uniforms } = createMaterial()
  const mesh = new THREE.Mesh(undefined, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.customDepthMaterial = depthMaterial
  mesh.rotation.x = -Math.PI / 2
  mesh.scale.set(3, 3, 3)
  webgl.scene.add(mesh)

  const setGeometry = (widthSegments: number, heightSegments: number) => {
    mesh.geometry?.dispose()

    const geometry = new THREE.PlaneGeometry(
      1,
      1,
      widthSegments,
      heightSegments
    )
    geometry.computeTangents()
    mesh.geometry = geometry

    uniforms.uSubdivision.value.set(widthSegments, heightSegments)
  }
  setGeometry(256, 256)

  webgl.events.tick.on((dt) => {
    uniforms.uTime.value += dt * timeScale.value
  })

  addLights()
  addEffects()

  /**
   * Toggle animation
   */
  window.addEventListener('keyup', (event) => {
    if (event.key === ' ') {
      webgl.isAnimationActive = !webgl.isAnimationActive
    }
  })

  /**
   * Start render loop
   */
  setTimeout(() => {
    webgl.start()
  }, 500)
})

function createMaterial() {
  const maxOctaves = 7

  const uniforms = {
    uTime: {
      value: 0,
    },
    uSubdivision: {
      value: new THREE.Vector2(1, 1),
    },
    uNumOctaves: {
      value: maxOctaves,
    },
    uFrequency1: {
      value: 3.0,
    },
    uFrequency2: {
      value: 4.0,
    },
    uAmplitude1: {
      value: 0.3,
    },
    uAmplitude2: {
      value: 0.02,
    },
    uHeightShadeStart: {
      value: 0.03,
    },
    uHeightShadeLength: {
      value: 0.15,
    },
    uLimPower: {
      value: 0.8,
    },
  }
  if (webgl.gui) {
    webgl.gui
      .add(uniforms.uNumOctaves, 'value')
      .min(1)
      .max(7)
      .step(1)
      .name('numOctaves')
    webgl.gui
      .add(uniforms.uFrequency1, 'value')
      .min(0.5)
      .max(10.0)
      .step(0.1)
      .name('frequency1')
    webgl.gui
      .add(uniforms.uFrequency2, 'value')
      .min(0.1)
      .max(10.0)
      .step(0.1)
      .name('frequency2')
    webgl.gui
      .add(uniforms.uAmplitude1, 'value')
      .min(-0.6)
      .max(+0.6)
      .step(0.01)
      .name('amplitude1')
    webgl.gui
      .add(uniforms.uAmplitude2, 'value')
      .min(-0.1)
      .max(+0.1)
      .step(0.001)
      .name('amplitude2')
    webgl.gui
      .add(uniforms.uLimPower, 'value')
      .min(0.2)
      .max(3)
      .step(0.05)
      .name('limPower')
    webgl.gui
      .add(uniforms.uHeightShadeStart, 'value')
      .min(-0.2)
      .max(+0.2)
      .step(0.01)
      .name('shadeStart')
    webgl.gui
      .add(uniforms.uHeightShadeLength, 'value')
      .min(0.05)
      .max(0.5)
      .step(0.01)
      .name('shadeLength')
  }

  const { material } = customizeMaterial(
    new THREE.MeshStandardMaterial({
      flatShading: true,
      metalness: 1.2,
      roughness: 1,
      envMapIntensity: 0.9,
      defines: {
        MAX_OCTAVES: maxOctaves.toFixed(0),
        USE_TANGENT: '',
      },
    }),
    uniforms,
    customizeShader
  )
  if (webgl.gui) {
    const folder = webgl.gui.addFolder('Material')
    folder.add(material, 'metalness').min(0).max(1.5).step(0.05)
    folder.add(material, 'roughness').min(0).max(1).step(0.05)
    folder.add(material, 'envMapIntensity').min(0).max(3).step(0.05)
    folder.add(material, 'flatShading').onChange(() => {
      material.needsUpdate = true
    })
  }

  const { material: depthMaterial } = customizeMaterial(
    new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
    }),
    uniforms,
    customizeShader
  )
  depthMaterial.defines = {
    ...depthMaterial.defines,
    MAX_OCTAVES: maxOctaves.toFixed(0),
    USE_TANGENT: '',
  }

  return {
    material,
    depthMaterial,
    uniforms,
  }

  function customizeShader(shader: THREE.Shader) {
    /**
     * Vertex shader
     */
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      /* glsl */ `
        #include <common>

        uniform float uTime;
        uniform vec2 uSubdivision;
        uniform float uNumOctaves;
        uniform float uFrequency1;
        uniform float uFrequency2;
        uniform float uAmplitude1;
        uniform float uAmplitude2;
        uniform float uHeightShadeStart;
        uniform float uHeightShadeLength;

        varying float vHeightShade;

        float random(in vec2 st) {
          return fract(
            sin(
              dot(st.xy, vec2(12.9898, 78.233))
            ) * 43758.5453123
          );
        }

        // Based on Morgan McGuire @morgan3d
        // https://www.shadertoy.com/view/4dS3Wd
        float noise(in vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);

          // Four corners in 2D of a tile
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));

          vec2 u = f * f * (3.0 - 2.0 * f);

          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(
          in vec2 st, float amplitude, in float amplitudeScale,
          out float values[MAX_OCTAVES]
        ) {
          float value = 0.0;
          float frequency = 0.0;
          
          for(int i = 0; i < MAX_OCTAVES; i ++ ) {
            float modulation = step(float(i), 1.5) * 2.0 - 1.0;
            modulation *= 1.0 - step(uNumOctaves, float(i));
            values[i] = modulation * amplitude * noise(st);
            value += values[i];
            st *= 2.0;
            amplitude *= amplitudeScale;
          }
          return value;
        }

        // Based on Inigo Quilez
        // https://iquilezles.org/articles/warp/
        float domainWarp(
          in vec2 p, in float amplitude,
          out float values[MAX_OCTAVES]
        ) {
          vec2 q = vec2(
            fbm(p + vec2(0.0, 0.0) + (0.1 * uTime), 0.5, 0.5, values),
            fbm(p + vec2(5.2, 1.3), 0.5, sin(uTime * 3.0) * 0.5, values)
          );
          
          vec2 r = vec2(
            fbm(p + 4.0 * q + vec2(1.7, 9.2) + (0.2 * uTime), - 0.3, 0.5, values),
            fbm(p + 7.0 * q + vec2(8.3, 2.8), - 0.3, cos(uTime * 3.75) * 0.5, values)
          );
          
          float f = fbm(p + uFrequency2 * r, amplitude, uAmplitude2, values);
          f = (f * f * f + (0.6 * f * f) + (0.5 * f));

          return f;
        }

        vec3 getPosition(vec3 pos, out float values[MAX_OCTAVES]) {
          vec2 p = pos.xy + vec2(0.0, 0.15 * uTime).yx;
          p *= uFrequency1;
          pos.z = domainWarp(p, uAmplitude1, values);
          return pos;
        }

        void displace(out vec3 displacedPosition, out vec3 displacedNormal) {
          vec3 biTangent = cross(normal, tangent.xyz);
          vec2 delta = 1.0 / uSubdivision;

          float centerValues[MAX_OCTAVES];
          float rightValues[MAX_OCTAVES];
          float topValues[MAX_OCTAVES];
          vec3 center = getPosition(position, centerValues);
          vec3 right = getPosition(position + tangent.xyz * delta.x, rightValues);
          vec3 top = getPosition(position + biTangent.xyz * delta.y, topValues);

          mat3 m = mat3(1.0);
          displacedPosition = position;
          displacedNormal = normal;

          for(int i = 0; i < MAX_OCTAVES; i ++ ) {
            vec3 c = center;
            c.z = centerValues[i];

            vec3 r = right;
            r.z = rightValues[i];

            vec3 t = top;
            t.z = topValues[i];

            displacedNormal = m * normal;
            displacedPosition += c.z * displacedNormal;

            vec3 newTangent = normalize(r - c);
            vec3 newBiNormal = normalize(t - c);
            vec3 newNormal = cross(newTangent, newBiNormal);
            m = m * mat3(newTangent, newBiNormal, newNormal);
          }

          displacedPosition.z += 0.1 - 0.5 * uAmplitude1;
        }
      `
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      /* glsl */ `
        vec3 displacedPosition = vec3(0.0);
        vec3 displacedNormal = vec3(0.0);
        displace(displacedPosition, displacedNormal);

        vHeightShade = clamp(smoothstep(
          uHeightShadeStart, uHeightShadeStart + uHeightShadeLength,
          displacedPosition.z
        ), 0.05, 1.0);

        #include <uv_vertex>
      `
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      /* glsl */ `
        #include <beginnormal_vertex>

        objectNormal = displacedNormal;
      `
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `
        #include <begin_vertex>

        transformed = displacedPosition;
      `
    )

    /**
     * Fragment shader
     */
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      /* glsl */ `
        #include <common>

        uniform float uLimPower;

        varying float vHeightShade;
      `
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      /* glsl */ `
        #include <normal_fragment_begin>

        vec4 worldNormal = vec4(normal, 0.0) * viewMatrix;
        diffuseColor.rgb *= 0.5 * worldNormal.xyz + 0.5;
      `
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <aomap_fragment>',
      /* glsl */ `
        float ambientOcclusion = vHeightShade;

        reflectedLight.indirectDiffuse *= ambientOcclusion;

        #if defined( USE_ENVMAP ) && defined( STANDARD )

          float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );

          reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );

        #endif
      `
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <output_fragment>',
      /* glsl */ `
        outgoingLight *= pow(1.0 - max(0.0, normal.z), uLimPower);

        #include <output_fragment>
      `
    )
  }
}
