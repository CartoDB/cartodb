var InfoboxView = require('./infobox-item-view');

module.exports = {
  // Infobox with no buttons, only message
  createInfo: function (opts) {
    return new InfoboxView({
      title: opts.title,
      body: opts.body
    });
  },

  // Infobox with one button
  createConfirm: function (opts) {
    return new InfoboxView({
      title: opts.title,
      body: opts.body,
      mainAction: {
        label: opts.confirmLabel,
        type: opts.confirmType || 'link'
      }
    });
  },

  // Infobox with two buttons
  createConfirmAndCancel: function (opts) {
    return new InfoboxView({
      title: opts.title,
      body: opts.body,
      mainAction: {
        label: opts.cancelLabel,
        type: opts.cancelType || 'link'
      },
      secondAction: {
        label: opts.confirmLabel,
        type: opts.confirmType || 'link'
      }
    });
  }
};
