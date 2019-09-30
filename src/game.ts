const rectShape = new GLTFShape('models/TubeRect.glb')
const curveShape = new GLTFShape('models/TubeCurve.glb')
const crossShape = new GLTFShape('models/TubeCross.glb')
const mouseShape = new GLTFShape('models/Mesh_Hamster.gltf')

type PipeShape = 'straight' | 'curved' | 'cross'
type Position = { x: number; y: number; rotation: number }
type Pipe = Position & { type: PipeShape }
enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

function addContent(parent: Entity, shape: PipeShape) {
  switch (shape) {
    case 'straight': {
      const piece = new Entity()
      piece.addComponent(rectShape)
      piece.addComponent(
        new Transform({
          position: new Vector3(0, 0, 0),
          rotation: Quaternion.Euler(90, 0, 0),
          scale: new Vector3(1, 1, 1)
        })
      )
      piece.setParent(parent)
      engine.addEntity(piece)
      break
    }
    case 'curved': {
      const piece = new Entity()
      piece.addComponent(curveShape)
      piece.addComponent(
        new Transform({
          position: new Vector3(0, 0, 0),
          rotation: Quaternion.Euler(0, 0, 90),
          scale: new Vector3(1, 1, 1)
        })
      )
      piece.setParent(parent)
      engine.addEntity(piece)
      break
    }
    case 'cross': {
      const piece = new Entity()
      piece.addComponent(crossShape)
      piece.addComponent(
        new Transform({
          position: new Vector3(0, 0, 0),
          rotation: Quaternion.Euler(0, 0, 90),
          scale: new Vector3(1, 1, 1)
        })
      )
      piece.setParent(parent)
      engine.addEntity(piece)
    }
  }
}

let pipeEntities: Entity[] = []

function addPipe(
  x: number,
  y: number,
  rotation: number = 0,
  type: PipeShape = 'straight'
) {
  if (x >= 0 && y >= 0) {
    const id = x + ',' + y
    if (id in pipes) return
    pipes[id] = { x, y, rotation, type }
  }

  const parent = new Entity()

  parent.addComponent(
    new Transform({
      position: new Vector3(x + 0.5, 0.25, y + 0.5),
      rotation: Quaternion.Euler(0, rotation, 0),
      scale: new Vector3(1, 1, 1)
    })
  )
  engine.addEntity(parent)

  addContent(parent, type)

  pipeEntities.push(parent)

  return parent
}

let rotation = 0
let type: PipeShape = 'straight'
const control = new Entity() //addPiece(-1, -1, rotation, type as any)

const input = Input.instance

let pipes: Record<string, Pipe> = {}

input.subscribe('BUTTON_DOWN', ActionButton.POINTER, false, e => {
  const transform = control.getComponent(Transform)
  const x = transform.position.x - 0.5
  const y = transform.position.z - 0.5
  addPipe(x, y, rotation, type)
})

input.subscribe('BUTTON_DOWN', ActionButton.SECONDARY, false, e => {
  for (const key of Object.keys(control.children)) {
    engine.removeEntity(control.children[key])
  }
  switch (type) {
    case 'straight':
      type = 'curved'
      break
    case 'curved':
      type = 'cross'
      break
    case 'cross':
      type = 'straight'
      break
  }

  addContent(control, type)
})

input.subscribe('BUTTON_DOWN', ActionButton.PRIMARY, false, e => {
  rotation += 90
  rotation %= 360
  const transform = control.getComponent(Transform)
  transform.rotation.setEuler(0, rotation, 0)
})

const controlSystem = {
  update(dt: number) {
    const physicsCast = PhysicsCast.instance
    const rayFromCamera = physicsCast.getRayFromCamera(1000)
    physicsCast.hitFirst(rayFromCamera, event => {
      const transform = control.getComponent(Transform)
      const x = Math.floor(event.hitPoint.x)
      const y = Math.floor(event.hitPoint.z)
      const id = x + ',' + y
      if (id in pipes) return
      if (x > 0 && y > 0 && x < 16 && y < 16) {
        transform.position.set(x + 0.5, 0, y + 0.5)
      } else {
      }
    })
  }
}

// engine.addSystem(controlSystem)

//
const mouse = new Entity()
mouse.addComponent(new Transform({ position: new Vector3(8.5, 0.25, 0.5) }))
engine.addEntity(mouse)

const mouseContent = new Entity()
mouseContent.addComponent(
  new Transform({
    position: new Vector3(0, 0.001, 0),
    rotation: Quaternion.Euler(0, 0, 0),
    scale: new Vector3(0.0025, 0.0025, 0.0025)
  })
)
mouseContent.addComponent(mouseShape)
mouseContent.setParent(mouse)
engine.addEntity(mouseContent)

pipes['8,0'] = {
  x: 8,
  y: 0,
  rotation: 0,
  type: 'straight'
}

function reset() {
  pipes = {}
  shouldReset = false
  resetCount = 0
  for (const entity of pipeEntities) {
    engine.removeEntity(entity)
  }
  mouseX = 8
  mouseY = 0
  mouseRotation = 0
  lastBuild = {
    x: mouseX,
    y: mouseY,
    rotation: 0,
    type: 'straight'
  }
  buildRotation = 0
  const transform = mouse.getComponent(Transform)
  originPosition = new Vector3(mouseX, 0, mouseY)
  targetPosition = originPosition.clone()
  originRotation = Quaternion.Euler(0, mouseRotation, 0)
  targetRotation = originRotation.clone()
  progress = -1
  transform.position.set(mouseX + 0.5, 0.25, mouseY + 0.5)
  transform.rotation.setEuler(0, 0, 0)
  pipes['8,0'] = {
    x: mouseX,
    y: mouseY,
    rotation: 0,
    type: 'straight'
  }
}

//

let stepTime = 0
const gameSystem = {
  update(dt: number) {
    stepTime += dt
    if (stepTime > 1) {
      stepTime = 0
      step()
    }
  }
}
engine.addSystem(gameSystem)

let buildTime = 0
const buildSystem = {
  update(dt: number) {
    buildTime += dt
    if (buildTime > 0.001) {
      buildTime = 0
      build()
    }
  }
}
engine.addSystem(buildSystem)

let mouseRotation = 0
let mouseX = 8
let mouseY = 0
let shouldReset = false
let resetCount = 0

let originPosition = new Vector3(mouseX, 0, mouseY)
let targetPosition = originPosition.clone()
let originRotation = Quaternion.Euler(0, mouseRotation, 0)
let targetRotation = originRotation.clone()
let progress = -1

const muñecaSystem = {
  update(dt: number) {
    const mouseTransform = mouse.getComponent(Transform)
    if (progress >= 0 && progress < 1) {
      mouseTransform.position.copyFrom(
        Vector3.Lerp(originPosition, targetPosition, progress)
      )
      mouseTransform.rotation.copyFrom(
        Quaternion.Slerp(originRotation, targetRotation, progress)
      )
      progress += dt
    } else if (progress > 0) {
      mouseTransform.position.copyFrom(targetPosition)
      mouseTransform.rotation.copyFrom(targetRotation)
      progress = -1
    }
  }
}

engine.addSystem(muñecaSystem)

function step() {
  const currentX = mouseX
  const currentY = mouseY
  const currentId = currentX + ',' + currentY
  const current = pipes[currentId]
  log('Current:', currentId, current)
  if (!current) return

  const [nextX, nextY, nextRotation] = getNext(current, mouseRotation)
  const nextId = nextX + ',' + nextY
  const next = pipes[nextId]
  log('Next:', nextId, next)

  let direction = getDirection(nextRotation)
  log('Direction:', direction)

  if (!next) {
    if (Object.keys(pipes).length > 5) {
      if (resetCount < 5) {
        resetCount++
      } else {
        shouldReset = true
      }
    }
    return
  }
  resetCount = 0

  if (canMove(direction, next)) {
    mouseX = nextX
    mouseY = nextY
    const [extraRotation, offsetX, offsetY] = getCurveOffset(next, nextRotation)
    originPosition.copyFrom(targetPosition)
    originRotation.copyFrom(targetRotation)
    targetPosition.set(mouseX + 0.5 + offsetX, 0.25, mouseY + 0.5 + offsetY)
    targetRotation.setEuler(0, nextRotation + extraRotation, 0)
    progress = 0
    mouseRotation = nextRotation
  }
}

function getCurveOffset(next: Pipe, rotation: number) {
  const direction = getDirection(rotation)
  const offset = 0.1
  switch (next.type) {
    case 'straight':
    case 'cross':
      return [0, 0, 0]
    case 'curved':
      switch (direction) {
        case Direction.UP:
          switch (next.rotation) {
            case 0:
              return [45, offset, -offset]
            case 90:
              return [-45, -offset, -offset]
            case 180:
              return [0, 0, 0]
            case 270:
              return [0, 0, 0]
          }
        case Direction.RIGHT:
          switch (next.rotation) {
            case 0:
              return [0, 0, 0]
            case 90:
              return [45, -offset, -offset]
            case 180:
              return [-45, -offset, offset]
            case 270:
              return [0, 0, 0]
          }
        case Direction.DOWN:
          switch (next.rotation) {
            case 0:
              return [0, 0, 0]
            case 90:
              return [0, 0, 0]
            case 180:
              return [45, -offset, offset]
            case 270:
              return [-45, offset, offset]
          }
        case Direction.LEFT:
          switch (next.rotation) {
            case 0:
              return [-45, offset, -offset]
            case 90:
              return [0, 0, 0]
            case 180:
              return [0, 0, 0]
            case 270:
              return [45, offset, offset]
          }
      }
  }
}
function getDirection(rotation: number) {
  switch (rotation) {
    case 0:
      return Direction.UP
      break
    case 90:
      return Direction.RIGHT
      break
    case 180:
      return Direction.DOWN
      break
    case 270:
      return Direction.LEFT
      break
  }
}

function getNext(current: Pipe, currentRotation: number) {
  let nextX
  let nextY
  let nextRotation = currentRotation
  switch (current.type) {
    case 'straight': {
      switch (currentRotation) {
        case 0: {
          nextX = current.x
          nextY = current.y + 1
          break
        }
        case 90: {
          nextX = current.x + 1
          nextY = current.y
          break
        }
        case 180: {
          nextX = current.x
          nextY = current.y - 1
          break
        }
        case 270: {
          nextX = current.x - 1
          nextY = current.y
          break
        }
      }
      break
    }
    case 'curved': {
      switch (currentRotation) {
        case 0: {
          switch (current.rotation) {
            case 0:
              nextX = current.x + 1
              nextY = current.y
              nextRotation = 90
              break
            case 90:
              nextX = current.x - 1
              nextY = current.y
              nextRotation = 270
              break
          }
          break
        }
        case 90: {
          switch (current.rotation) {
            case 180:
              nextX = current.x
              nextY = current.y + 1
              nextRotation = 0
              break
            case 90:
              nextX = current.x
              nextY = current.y - 1
              nextRotation = 180
              break
          }
          break
        }
        case 180: {
          switch (current.rotation) {
            case 180:
              nextX = current.x - 1
              nextY = current.y
              nextRotation = 270
              break
            case 270:
              nextX = current.x + 1
              nextY = current.y
              nextRotation = 90
              break
          }
          break
        }
        case 270: {
          switch (current.rotation) {
            case 0:
              nextX = current.x
              nextY = current.y - 1
              nextRotation = 180
              break
            case 270:
              nextX = current.x
              nextY = current.y + 1
              nextRotation = 0
              break
          }
          break
        }
      }
      break
    }
    case 'cross': {
      switch (currentRotation) {
        case 0: {
          nextX = current.x
          nextY = current.y + 1
          break
        }
        case 90: {
          nextX = current.x + 1
          nextY = current.y
          break
        }
        case 180: {
          nextX = current.x
          nextY = current.y - 1
          break
        }
        case 270: {
          nextX = current.x - 1
          nextY = current.y
          break
        }
      }
      break
    }
  }
  if (nextX < 0 || nextY < 0 || nextX > 15 || nextY > 15) {
    return [null, null, null]
  }
  return [nextX, nextY, nextRotation]
}

function canMove(direction: Direction, next: Pipe) {
  switch (direction) {
    case Direction.UP:
      switch (next.type) {
        case 'straight':
          switch (next.rotation) {
            case 0:
            case 180:
              return true
            case 90:
            case 270:
              return false
          }
        case 'curved':
          switch (next.rotation) {
            case 0:
            case 90:
              return true
            case 180:
            case 270:
              return false
          }
        case 'cross':
          return true
      }
    case Direction.RIGHT:
      switch (next.type) {
        case 'straight':
          switch (next.rotation) {
            case 0:
            case 180:
              return false
            case 90:
            case 270:
              return true
          }
        case 'curved':
          switch (next.rotation) {
            case 90:
            case 180:
              return true
            case 0:
            case 270:
              return false
          }
        case 'cross':
          return true
      }
    case Direction.DOWN:
      switch (next.type) {
        case 'straight':
          switch (next.rotation) {
            case 0:
            case 180:
              return true
            case 90:
            case 270:
              return false
          }
        case 'curved':
          switch (next.rotation) {
            case 0:
            case 90:
              return false
            case 180:
            case 270:
              return true
          }
        case 'cross':
          return true
      }
    case Direction.LEFT:
      switch (next.type) {
        case 'straight':
          switch (next.rotation) {
            case 0:
            case 180:
              return false
            case 90:
            case 270:
              return true
          }
        case 'curved':
          switch (next.rotation) {
            case 0:
            case 270:
              return true
            case 180:
            case 90:
              return false
          }
        case 'cross':
          return true
      }
  }
}

/// build

let buildRotation = 0
let lastBuild: Pipe = {
  x: 8,
  y: 0,
  rotation: 0,
  type: 'straight'
}

function build() {
  if (Object.keys(pipes).length < 4) {
    const [nextX, nextY] = getNext(lastBuild, buildRotation)
    lastBuild = {
      x: nextX,
      y: nextY,
      rotation: 0,
      type: 'straight'
    }
    buildRotation = lastBuild.rotation
    addPipe(nextX, nextY, lastBuild.rotation, lastBuild.type)
    return
  }
  const [pipe, rotation, args] = getBuild(lastBuild, buildRotation)
  if (!canKeepBuilding(pipe, rotation, 4)) {
    return
  }
  if (pipe) {
    lastBuild = pipe
    buildRotation = rotation
    if (args) {
      const [nextX, nextY, pipeRotation, pipeShape] = args
      addPipe(nextX, nextY, pipeRotation, pipeShape)
    }
  }
}

function canKeepBuilding(pipe: Pipe, rotation: number, steps: number) {
  let [nextPipe, nextRotation] = getBuild(pipe, rotation) as [Pipe, number]
  while (steps > 1 && nextPipe && !shouldReset) {
    const results = getBuild(nextPipe, nextRotation)
    nextPipe = results[0]
    nextRotation = results[1]
    steps--
  }
  if (shouldReset) {
    reset()
    return false
  }
  return !!nextPipe
}

function getBuild(currentBuild: Pipe, currentBuildRotation: number) {
  const [nextX, nextY, nextRotation] = getNext(
    currentBuild,
    currentBuildRotation
  )
  log(nextX, nextY)
  if (!nextX && !nextY && !nextRotation) return [null, null, null]
  const direction = getDirection(nextRotation)
  const nextId = nextX + ',' + nextY
  const next = pipes[nextId]
  if (nextId in pipes) {
    if (canMove(direction, next)) {
      return [next, nextRotation, null]
    }
    return [null, null, null]
  }

  let pipeRotation = pickRandom<number>([0, 90, 180, 270])
  let pipeShape = pickRandom<PipeShape>([
    'straight',
    'curved',
    'cross',
    'straight',
    'curved',
    'curved',
    'curved',
    'curved'
  ])
  const nextPipe = {
    x: nextX,
    y: nextY,
    rotation: pipeRotation,
    type: pipeShape
  }
  if (canMove(direction, nextPipe)) {
    return [nextPipe, nextRotation, [nextX, nextY, pipeRotation, pipeShape]]
  }
}

function pickRandom<T>(array: T[]): T {
  return array[(Math.random() * array.length) | 0]
}

///

const groundFloorSciFi_03 = new Entity()
const gltfShape = new GLTFShape(
  'models/GroundFloorSciFi_03/GroundFloorSciFi_03.glb'
)
groundFloorSciFi_03.addComponentOrReplace(gltfShape)
const transform_2 = new Transform({
  position: new Vector3(8, 0, 8),
  rotation: new Quaternion(0, 0, 0, 1),
  scale: new Vector3(1, 1, 1)
})
groundFloorSciFi_03.addComponentOrReplace(transform_2)
engine.addEntity(groundFloorSciFi_03)

const terminal_01 = new Entity()
const gltfShape_2 = new GLTFShape('models/Terminal_01/Terminal_01.glb')
terminal_01.addComponentOrReplace(gltfShape_2)
const transform_3 = new Transform({
  position: new Vector3(8.5, 0, 0.6115339688275139),
  rotation: new Quaternion(0, 9.71445146547012e-17, 0, 1.0000000000000007),
  scale: new Vector3(1, 1, 1)
})
terminal_01.addComponentOrReplace(transform_3)
engine.addEntity(terminal_01)
