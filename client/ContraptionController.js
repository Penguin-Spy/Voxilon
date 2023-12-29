import Contraption from '/common/Contraption.js'
import Component from '/common/Component.js'

import { Vector3, Quaternion, Matrix4, BoxGeometry, Mesh, MeshBasicMaterial } from 'three'
import Input from '/client/Input.js'
import Controller from '/client/Controller.js'

const _v1 = new Vector3()
const _v2 = new Vector3()
const _v3 = new Vector3()
const _q1 = new Quaternion()
const _q2 = new Quaternion()
const _matrix4 = new Matrix4()
let angle = 0

const RIGHT = new Vector3(1, 0, 0)
const UP = new Vector3(0, 1, 0)
const FORWARD = new Vector3(0, 0, 1)
const ZERO = new Vector3(0, 0, 0)

const HALF_PI = Math.PI / 2

const max = Math.max, min = Math.min
function toZero(value, delta) {
  if(value > 0) {
    return max(value - delta, 0)
  } else {
    return min(value + delta, 0)
  }
}

export default class ContraptionController extends Controller {
  constructor(link, hud, renderer) {
    super(link, hud, renderer)
  }

  activate(contraptionBody, component) {
    this.body = contraptionBody
    this.contraption = this.body.contraption
    this.component = component
    //this.hud.updateStatus(this)
    //this.hud.updateHotbar(this)

    this.renderer.attach(this.body, this)
    this.body.attach(this)

    this.lookPositionOffset.copy(component.position)
  }

  deactivate() {
  }

  preRender(deltaTime) {
  }

  // Take input data and apply it to the contraption
  update(DT) {
  }
}
