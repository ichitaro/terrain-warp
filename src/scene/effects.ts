import * as THREE from 'three'
import { EffectPass, DepthOfFieldEffect, VignetteEffect } from 'postprocessing'
import assets from '../utils/assets'
import Experience from '../utils/Experience'

export function addEffects() {
  const webgl = new Experience()
  const { composer, camera, gui } = webgl
  if (!composer) return

  const depthOfFieldEffect = new DepthOfFieldEffect(camera, {
    focalLength: 0.06,
    bokehScale: 8.0,
    // @ts-ignore
    resolutionScale: 0.25,
  })
  depthOfFieldEffect.target = new THREE.Vector3(0, 0, 0)
  const depthOfFieldPass = new EffectPass(camera, depthOfFieldEffect)
  composer.addPass(depthOfFieldPass)

  composer.addPass(new EffectPass(camera, new VignetteEffect()))

  if (gui) {
    const folder = gui.addFolder('Depth of field')
    folder
      .add({ enabled: depthOfFieldPass.enabled }, 'enabled')
      .onChange((value: boolean) => {
        depthOfFieldPass.enabled = value
      })
    folder.add(depthOfFieldEffect, 'bokehScale').min(0).max(20).step(0.5)
    folder
      .add(depthOfFieldEffect.circleOfConfusionMaterial, 'focalLength')
      .min(0.01)
      .max(0.15)
      .step(0.01)
  }
}
