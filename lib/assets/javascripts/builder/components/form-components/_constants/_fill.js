module.exports = {
  Size: {
    MARKER_MIN: 7,
    IMAGE_MIN: 20,
    DEFAULT: {
      min: 1,
      max: 45,
      step: 0.5
    },
    DefaultInput100: {
      MIN: 0,
      MAX: 100,
      STEP: 1
    },
    DEFAULT_RANGE: [ 5, 20 ]
  },

  Panes: {
    FIXED: 'fixed',
    BY_VALUE: 'value',
    FILE: 'file'
  },

  Tabs: {
    BINS: 'bins',
    QUANTIFICATION: 'quantification'
  },

  Quantification: {
    REFERENCE: {
      'Jenks': 'jenks',
      'Equal Interval': 'equal',
      'Heads/Tails': 'headtails',
      'Quantile': 'quantiles'
    }
  },

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
      },
      bins: {
        items: ['2', '3', '4', '5', '6', '7'],
        defaultIndex: 3
      }
    },

    NUMBER: {
      quantifications: {
        items: ['quantiles', 'jenks', 'equal', 'headtails'],
        defaultIndex: 0
      },
      bins: {
        items: ['2', '3', '4', '5', '6', '7'],
        defaultIndex: 3
      }
    }
  }
};
