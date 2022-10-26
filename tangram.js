import polygonBuilder from './polygonBuilder.js'

export default class Tangram {
  constructor(unit) {
    this.unit = unit;
    this.cube = this.buildCube()
    this.bigTriangle1 = this.buildTriangle('bigTriangle1', this.unit)
    this.bigTriangle2 = this.buildTriangle('bigTriangle2', this.unit)
    this.mediumTriangle = this.buildTriangle('mediumTriangle', this.unit * Math.sqrt(2) / 2)
    this.smallTriangle1 = this.buildTriangle('smallTriangle1', this.unit / 2)
    this.smallTriangle2 = this.buildTriangle('smallTriangle2', this.unit / 2)
    this.parallelogram = this.buildParallelogram()
  }

  buildCube() {
    return polygonBuilder({
      type: 'cube',
      name: 'cube',
      size: this.unit * Math.sqrt(2) / 4
    })
  }

  buildTriangle(name, size) {
    return polygonBuilder({
      type: 'triangle',
      name: name,
      size: size
    })
  }

  buildParallelogram() {
    return polygonBuilder({
      type: 'parallelogram',
      name: 'parallelogram',
      size: this.unit / 2,
    })
  }

  get polygons() {
    return [
      this.cube,
      this.bigTriangle1,
      this.bigTriangle2,
      this.mediumTriangle,
      this.smallTriangle1,
      this.smallTriangle2,
      this.parallelogram
    ]
  }
}