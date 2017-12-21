var cdb = require('cartodb.js-v3');

/**
 * View for the default footer
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-force-all-rows': '_onClickForceAllRows'
  },

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/georeference/default_footer')()
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:canContinue', this._onChangeCanContinue, this);
    this.model.bind('change:hideFooter', this._onChangeHideFooter, this);

    var geocodeStuff = this._geocodeStuff();
    geocodeStuff.bind('change:forceAllRows', this._onChangeForceAllRows, this);
    this.add_related_model(geocodeStuff);
  },

  _onChangeCanContinue: function(m, canContinue) {
    this.$('.ok').toggleClass('is-disabled', !canContinue);
  },

  _onChangeHideFooter: function(m, hideFooter) {
    this.$el.toggle(!hideFooter);
  },

  _onChangeForceAllRows: function(m, hasForceAllRows) {
    this.$('.js-force-all-rows button').toggleClass('is-checked', !!hasForceAllRows);
  },

  _onClickForceAllRows: function(ev) {
    this.killEvent(ev);
    var m = this._geocodeStuff();
    m.set('forceAllRows', !m.get('forceAllRows'));
  },

  _geocodeStuff: function() {
    return this.model.get('geocodeStuff');
  }

});
