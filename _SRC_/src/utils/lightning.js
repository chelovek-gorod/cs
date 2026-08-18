const colors = [
    0xffffff,
    0xffffcc,
    0x66ffff,
    0xe5ccff,
    0x99ffff,
    0xffccff,
    0xffff99,
    0xccffff, 
    0xccffcc,
    0xe5ffcc,
    0xffff66,
]
let colorIndex = Math.floor(Math.random() * colors.length)

export function drawLightning(object, target, graphics) {
    const lineColor = colors[colorIndex]
    colorIndex++
    if (colorIndex === colors.length) colorIndex = 0
  
    const distance = getDistance(object, target)
    const stepsSize = 9 + Math.ceil(Math.random() * 10)
    const stepsCount = Math.ceil(distance / stepsSize)
    const offsetRate = Math.ceil(stepsSize * 0.75)
  
    let xx = object.position.x
    let yy = object.position.y
    let path = [{x: xx, y: yy}]
    for (let i = stepsCount; i > 1; i--) {
        let pathLength = Math.sqrt((xx - target.position.x) ** 2 + (yy - target.position.y) ** 2)
        let offset = Math.sin((pathLength / distance) * Math.PI) * offsetRate
        xx += (target.position.x - xx) / i + Math.random() * offset * 2 - offset
        yy += (target.position.y - yy) / i + Math.random() * offset * 2 - offset
        path.push({x: xx, y: yy})
    }

    //graphics.clear()
   
    path.forEach( (point, index) => {
      if (index === 0) graphics.moveTo(point.x, point.y);
      else graphics.lineTo(point.x, point.y);
    })
    graphics.stroke({ width: graphics.lineWidth, color: lineColor })
}