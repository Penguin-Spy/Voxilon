import HUD from '/client/HUD.js'
import Renderer from '/client/Renderer.js'
import Link from '/link/Link.js'
import ControllerManager from '/client/ControllerManager.js'

import * as THREE from 'three'


export default class Controller {
  /**
   * @param {ControllerManager} controllerManager
   * @param {Link} link
   * @param {HUD} hud
   * @param {Renderer} renderer
  */
  constructor(controllerManager, link, hud, renderer) {
    this.controllerManager = controllerManager
    this.link = link
    this.hud = hud
    this.renderer = renderer

    this.lookPositionOffset = new THREE.Vector3()
    this.lookQuaternion = new THREE.Quaternion()
  }

  activate(options) {
    throw new TypeError(`activate not implemented`)
  }

  deactivate() {
    throw new TypeError(`deactivate not implemented`)
  }

  setHotbarSlot(i) {
    throw new TypeError(`setHotbarSlot not implemented`)
  }
}
