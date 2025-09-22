// src/utils/modelPreload.js
import * as THREE from 'three'
import { LoadingManager } from 'three'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { boardTypes } from '../configs/boardConfig'

export async function preloadModels() {
  const manager = new LoadingManager()
  const mtlLoader = new MTLLoader(manager)
  const objLoader = new OBJLoader(manager)

  // Helper to load one OBJ+MTL pair and preprocess it
  function loadObjModel(name) {
    return new Promise((resolve, reject) => {
  
          // objLoader.setMaterials(materials)
          objLoader.load(
            `./models/${name}.obj`,
            object => {
              // Preprocess: recompute normals and adjust materials
              object.traverse(child => {
                if (child.isMesh) {
                  // Ensure correct lighting normals
                  child.geometry.computeVertexNormals()

                  // set default material if none is set
                  if (!child.material) {
                    console.warn(`No material found for ${name}, using default.`)
                  }
                  else {
                    child.material.color = boardTypes[name]?.defaultColor || new THREE.Color(0xFFFFFF);

                  }
                  
                  // Optional: enable flat shading for crisp edges
                  child.material.flatShading = true
                  // Render both sides to avoid missing faces
                  child.material.side = THREE.DoubleSide
                  child.material.needsUpdate = true
                }
              })
              resolve(object)
            },
            undefined,
            err => reject(err)
          )
        
    })
  }

  // List your actual model names (without extension)
  const entries = [
    'b40x40', 'b40x24', 'b40x5',
    'b24x5', 'b5x5',
    'bar', 'cube', 'nut', 'screw'
  ]
  const results = await Promise.all(entries.map(loadObjModel))

  // Debug: see what got loaded
  console.log('✅ preloadModels loaded keys:', entries)
  console.log('✅ preloadModels loaded objects:', results)

  return entries.reduce((acc, key, i) => {
    acc[key] = results[i]
    return acc
  }, {})
}
