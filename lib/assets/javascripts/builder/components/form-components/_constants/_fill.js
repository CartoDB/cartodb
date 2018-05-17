module.exports = {
  Settings: {
    COLOR: {
      quantifications: {
        items: ['jenks', 'equal', 'headtails', 'quantiles', 'category'],
        defaultIndex: 0
      }
    },

    COLOR_RAMPS: {
      quantifications: {
        items: ['quantiles', 'jenks', 'equal', 'headtails', 'category'],
        defaultIndex: 0
      }
    }
  },
  'NUMBER': {
    quantifications: {
      items: ['quantiles', 'jenks', 'equal', 'headtails'],
      defaultIndex: 0
    },
    bins: {
      items: ['2', '3', '4', '5', '6', '7'],
      defaultIndex: 3
    }
  }
};
