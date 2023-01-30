import polygonBuilder from 'polygonBuilder'

// For unit == 20 this will build the following polygons:
// - cube: 7.0710678118654755 sides
// - big triangle: 20 hypotenuse / 14.142135623730951 side / 14.142135623730951 altitude
// - medium triangle: 14.142135623730951 hypotenuse / 10 side / 10 altitude
// - small triangle: 10 hypotenuse / 7.0710678118654755 side / 7.0710678118654755 altitude

export default class Tangram {
  constructor(unit, textures) {
    this.unit = unit;
    this.textures = textures;
    this.cube = this.buildCube()
    this.bigTriangle1 = this.buildTriangle('bigTriangle', this.unit, 0x2f4e54, 0x223D42, 0.15, true)
    this.bigTriangle2 = this.buildTriangle('bigTriangle', this.unit, 0x2f4e54, 0x223D42, 0.15, true)
    this.mediumTriangle = this.buildTriangle('mediumTriangle', this.unit * Math.sqrt(2) / 2, 0xb3c6c6, 0xa7baba, 0.1, false)
    this.smallTriangle1 = this.buildTriangle('smallTriangle', this.unit / 2, 0x7A9E9F, 0x6f8e8e, 0.09, true)
    this.smallTriangle2 = this.buildTriangle('smallTriangle', this.unit / 2, 0x7A9E9F, 0x6f8e8e, 0.09, true)
    this.parallelogram = this.buildParallelogram()
  }

  buildCube() {
    return polygonBuilder({
      type: 'cube',
      name: 'cube',
      size: this.unit * Math.sqrt(2) / 4,
      lightColor: 0xA07178,
      darkColor: 0x91676c,
      texturePath: this.textures.cube,
      textureRepetition: 0.09,
      duplicated: false
    })
  }

  buildTriangle(name, size, lightColor, darkColor, textureRepetition, duplicated) {
    return polygonBuilder({
      type: 'triangle',
      name,
      size,
      lightColor,
      darkColor,
      texturePath: this.textures[name],
      textureRepetition,
      duplicated
    })
  }

  buildParallelogram() {
    return polygonBuilder({
      type: 'parallelogram',
      name: 'parallelogram',
      size: this.unit / 2,
      lightColor: 0xF7E8A4,
      darkColor: 0xd8cb91,
      texturePath: this.textures.parallelogram,
      textureRepetition: 0.15,
      duplicated: false
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