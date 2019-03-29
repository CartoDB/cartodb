module.exports = {
  Type: {
    SIMPLE: 'simple',
    ANIMATION: 'animation',
    HEATMAP: 'heatmap',
    POLYGON: 'polygon',
    REGIONS: 'regions',
    HEXABINS: 'hexabins',
    SQUARES: 'squares',
    NONE: 'none'
  },
  Blending: {
    SIMPLE: [
      'none',
      'multiply',
      'screen',
      'overlay',
      'darken',
      'lighten',
      'color-dodge',
      'color-burn',
      'xor',
      'src-over'
    ],
    ANIMATION: [
      'lighter',
      'multiply',
      'source-over',
      'xor'
    ]
  }
};
