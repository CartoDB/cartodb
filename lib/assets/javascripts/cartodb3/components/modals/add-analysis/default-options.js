var AREA_OF_INFLUENCE_TYPE_GROUP = _t('analyses.area-of-influence');

module.exports = [
  {
    nodeAttrs: {
      type: 'buffer',
      radius: 100
    },
    title: _t('components.modals.add-analysis.option-types.buffer.title'),
    type_group: AREA_OF_INFLUENCE_TYPE_GROUP,
    desc: _t('components.modals.add-analysis.option-types.buffer.desc')
  }, {
    nodeAttrs: {
      type: 'trade-area',
      kind: 'car',
      isolines: 1,
      dissolved: false,
      time: 100
    },
    title: _t('components.modals.add-analysis.option-types.trade-area.title'),
    type_group: AREA_OF_INFLUENCE_TYPE_GROUP,
    desc: _t('components.modals.add-analysis.option-types.trade-area.desc')
  }, {
    Model: require('./analysis-option-models/point-in-polygon-analysis-option-model'),
    nodeAttrs: {
      type: 'point-in-polygon'
    },
    title: _t('components.modals.add-analysis.option-types.point-in-polygon.title'),
    desc: _t('components.modals.add-analysis.option-types.point-in-polygon.desc')
  }
];
