import * as THREE from "three";

/**
 * A perspective camera in pixel space: at z = 0 one world unit is one CSS pixel
 * and the origin is the centre of the window, so the model can be put exactly
 * where the page's own elements are, and still be seen in real perspective.
 * A narrow field of view keeps the cat's shape steady from one side of the
 * window to the other.
 */
export const FOV = 18;

export function fitCamera(camera: THREE.Camera, width: number, height: number) {
  const cam = camera as THREE.PerspectiveCamera;
  const d = height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  cam.fov = FOV;
  cam.aspect = width / height;
  cam.near = d * 0.3;
  cam.far = d * 2.5;
  cam.position.set(0, 0, d);
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
}
