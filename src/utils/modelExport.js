import * as THREE from 'three';
import JSZip from 'jszip';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

const objExporter = new OBJExporter();
const stlExporter = new STLExporter();

function sanitizeName(name) {
  return String(name || 'part').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function buildSceneObject(part, sceneGraph, models) {
  if (!part || !part.properties) {
    return null;
  }

  const props = part.properties;
  const state = props.current_state || { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 };

  const finalPosition = [
    props.pos[0] + state.rel_pos[0],
    props.pos[1] + state.rel_pos[1],
    props.pos[2] + state.rel_pos[2]
  ];

  const finalRotation = [
    props.rot[0] + state.rel_rot[0],
    props.rot[1] + state.rel_rot[1],
    props.rot[2] + state.rel_rot[2]
  ];

  if (props.type === 'group') {
    const group = new THREE.Group();
    group.name = sanitizeName(part.part_id);
    group.position.set(...finalPosition);
    group.rotation.set(...finalRotation);

    (props.children || []).forEach((childId) => {
      const child = buildSceneObject(sceneGraph[childId], sceneGraph, models);
      if (child) {
        group.add(child);
      }
    });

    return group;
  }

  if (props.type === 'model') {
    if (state.alpha <= 0) {
      return null;
    }

    const sourceModel = models?.[props.model_id];
    if (!sourceModel) {
      return null;
    }

    const model = sourceModel.clone(true);
    model.name = sanitizeName(part.part_id);
    model.position.set(...finalPosition);
    model.rotation.set(...finalRotation);
    model.userData.exportPart = true;
    model.userData.partId = part.part_id;
    model.userData.modelId = props.model_id;
    return model;
  }

  return null;
}

function collectExportParts(root) {
  const parts = [];
  root.updateMatrixWorld(true);

  root.traverse((node) => {
    if (!node.userData?.exportPart) {
      return;
    }

    const exportObject = node.clone(true);
    exportObject.applyMatrix4(node.matrixWorld);
    exportObject.updateMatrixWorld(true);

    parts.push({
      object: exportObject,
      partId: node.userData.partId,
      modelId: node.userData.modelId
    });
  });

  return parts;
}

function exportPartToText(object, format) {
  if (format === 'obj') {
    return objExporter.parse(object);
  }

  if (format === 'stl') {
    return stlExporter.parse(object, { binary: false });
  }

  throw new Error(`Unsupported export format: ${format}`);
}

export async function exportScenePartsZip({ sceneGraph, models, format = 'obj', filePrefix = 'crate-model' }) {
  if (!sceneGraph || Object.keys(sceneGraph).length === 0) {
    throw new Error('No scene graph is available for export.');
  }

  if (!models) {
    throw new Error('Models are still loading, please try again.');
  }

  const crateRoot = sceneGraph.crate_root;
  if (!crateRoot) {
    throw new Error('Scene graph is missing crate_root.');
  }

  const root = new THREE.Group();
  const crateObject = buildSceneObject(crateRoot, sceneGraph, models);
  if (!crateObject) {
    throw new Error('Failed to build export scene.');
  }

  root.add(crateObject);
  const parts = collectExportParts(root);

  if (parts.length === 0) {
    throw new Error('No visible model parts were found to export.');
  }

  const zip = new JSZip();

  parts.forEach((part, index) => {
    const baseName = `${sanitizeName(part.partId)}__${sanitizeName(part.modelId)}__${index + 1}`;
    const exportedText = exportPartToText(part.object, format);
    zip.file(`${baseName}.${format}`, exportedText);
  });

  const archiveBlob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveName = `${sanitizeName(filePrefix)}-${timestamp}-${format}.zip`;

  const url = URL.createObjectURL(archiveBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = archiveName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    fileName: archiveName,
    partCount: parts.length,
    format
  };
}