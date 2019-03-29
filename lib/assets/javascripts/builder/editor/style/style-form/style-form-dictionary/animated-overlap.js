module.exports = {
  generate: function (params) {
    if (params.isTorqueCategory) {
      return {
        type: 'Hidden'
      };
    }

    return {
      type: 'Radio',
      title: _t('editor.style.components.animated-overlap.label'),
      options: [
        {
          val: 'false',
          label: _t('editor.style.components.animated-overlap.options.false')
        }, {
          val: 'true',
          label: _t('editor.style.components.animated-overlap.options.true')
        }
      ]
    };
  }
};
