// Setting proper title names for current analyses

module.exports = function (type) {
  switch (type) {
    case 'buffer': return _t('analyses.area-of-influence');
    case 'trade-area': return _t('analyses.area-of-influence');
    case 'point-in-polygon': return _t('analyses.point-in-polygon');
    case 'filter-range': return _t('analyses.filter');
    case 'filter-category': return _t('analyses.filter');
    default: return type;
  }
};
