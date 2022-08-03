import * as THREE from 'three'
import assets from '../utils/assets'
import Experience from '../utils/Experience'

const envMapKey = assets.queue('textures/environmentMaps/3', (url) => {
  return assets.loaders.cubeTextureLoader
    .loadAsync([
      'textures/environmentMaps/3/px.jpg',
      'textures/environmentMaps/3/nx.jpg',
      'textures/environmentMaps/3/py.jpg',
      'textures/environmentMaps/3/ny.jpg',
      'textures/environmentMaps/3/pz.jpg',
      'textures/environmentMaps/3/nz.jpg',
    ] as any)
    .then((texture) => {
      texture.encoding = THREE.sRGBEncoding
      return texture
    })
})

export function addLights() {
  const { scene, gui } = new Experience()

  const directionalLight = new THREE.DirectionalLight()
  directionalLight.intensity = 1
  directionalLight.position.set(1, 0.5, -1.5).normalize().multiplyScalar(3)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.set(1024, 1024)
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 5.5
  directionalLight.shadow.camera.left = -2
  directionalLight.shadow.camera.right = 2
  directionalLight.shadow.camera.top = 1.5
  directionalLight.shadow.camera.bottom = -0.5
  directionalLight.shadow.normalBias = 0.005
  directionalLight.shadow.bias = 0.01
  scene.add(directionalLight)
  // scene.add(new THREE.CameraHelper(directionalLight.shadow.camera))

  if (gui) {
    const folder = gui.addFolder('Directional light')
    folder.add(directionalLight, 'intensity').min(0).max(5).step(0.01)
    folder.addColor(directionalLight, 'color')
  }

  const environmentMap = assets.get<THREE.CubeTexture>(envMapKey)
  environmentMap.encoding = THREE.sRGBEncoding
  scene.environment = environmentMap
}
