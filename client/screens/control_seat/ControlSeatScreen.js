import Screen, { loadTemplateFromPath } from 'client/Screen.js'

const template = await loadTemplateFromPath('control_seat/index.html')

export default class ControlSeatScreen extends Screen {
  constructor(seat) {
    super(template)
    this.seat = seat

    this.current_thrusters = this.content.querySelector("#current_thrusters")
    this.available_thrusters = this.content.querySelector("#available_thrusters")
    this.current_gyroscopes = this.content.querySelector("#current_gyroscopes")
    this.available_gyroscopes = this.content.querySelector("#available_gyroscopes")

    this.rebuildOptions()

    this.setEventHandlers({
      add_thruster: this.addThruster,
      remove_thruster: this.removeThruster,
      add_gyroscope: this.addGyroscope,
      remove_gyroscope: this.removeGyroscope,
      close: this.close
    })
  }

  rebuildOptions() {
    const ourThrusters = this.seat.thrustManager.getThrusters()
    this.current_thrusters.length = 0
    for(const t of ourThrusters) {
      this.current_thrusters.add(new Option(t.hostname))
    }
    this.current_thrusters.add(new Option("<select all>", "$"))
    const networkThrusters = this.seat.network.getComponents("voxilon:thruster")
    this.available_thrusters.length = 0
    for(const t of networkThrusters) {
      if(!ourThrusters.includes(t)) {
        this.available_thrusters.add(new Option(t.hostname))
      }
    }
    this.available_thrusters.add(new Option("<select all>", "$"))

    const ourGyroscopes = this.seat.gyroManager.getGyroscopes()
    this.current_gyroscopes.length = 0
    for(const g of ourGyroscopes) {
      this.current_gyroscopes.add(new Option(g.hostname))
    }
    this.current_gyroscopes.add(new Option("<select all>", "$"))
    const networkGyroscopes = this.seat.network.getComponents("voxilon:gyroscope")
    this.available_gyroscopes.length = 0
    for(const g of networkGyroscopes) {
      if(!ourGyroscopes.includes(g)) {
        this.available_gyroscopes.add(new Option(g.hostname))
      }
    }
    this.available_gyroscopes.add(new Option("<select all>", "$"))
  }

  addThruster(event) {
    console.log("add thruster", event)
    const thrusters = []
    for(const option of this.available_thrusters.selectedOptions) {
      thrusters.push(option.value)
    }
    // send packet via link
    this.client.link.screenAction(this.seat, "add_thruster", thrusters)
  }
  removeThruster(event) {
    console.log("remove thruster", event)
    const thrusters = []
    for(const option of this.current_thrusters.selectedOptions) {
      thrusters.push(option.value)
    }
    // send packet via link
    this.client.link.screenAction(this.seat, "remove_thruster", thrusters)
  }

  addGyroscope(event) {
    console.log("add gyroscope", event)
    const gyroscopes = []
    for(const option of this.available_gyroscopes.selectedOptions) {
      gyroscopes.push(option.value)
    }
    // send packet via link
    this.client.link.screenAction(this.seat, "add_gyroscope", gyroscopes)
  }
  removeGyroscope(event) {
    console.log("remove gyroscope", event)
    const gyroscopes = []
    for(const option of this.current_gyroscopes.selectedOptions) {
      gyroscopes.push(option.value)
    }
    // send packet via link
    this.client.link.screenAction(this.seat, "remove_gyroscope", gyroscopes)
  }

  selectAll(event) {
    for(const option of event.target.parentElement.options) {
      option.selected = true
    }
    event.target.selected = false
  }

  handleClick(elementID, event) {
    if(event.target.value === "$") {
      this.selectAll(event)
    } else {
      super.handleClick(elementID, event)
    }
  }

  handleKeyDown(event) {
    return
  }

  receiveScreenUpdate(action, data) {
    if(action === "refresh") {
      this.rebuildOptions()
    }
  }
}

