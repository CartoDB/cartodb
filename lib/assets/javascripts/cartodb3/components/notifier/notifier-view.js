var CoreView = require('backbone/core-view');
var _ = require('underscore');
var NotifierItemView = require('./notifier-item-view');

module.exports = CoreView.extend({
  className: 'Notifier',

  initialize: function (opts) {
    if (!opts.collection) throw new Error('collection is mandatory');
    if (!opts.editorModel) throw new Error('editorModel is mandatory');

    this._editorModel = opts.editorModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderAllSubviews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.collection, 'reset', this.render);
    this.listenTo(this.collection, 'add', this._renderSubview);
    this.listenTo(this.collection, 'remove', this._removeSubview);
    this.add_related_model(this.collection);

    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);
  },

  _renderAllSubviews: function () {
    this.collection.each(this._renderSubview, this);
  },

  _renderSubview: function (model) {
    var view = new NotifierItemView({
      notifierModel: model,
      editorModel: this._editorModel
    });

    this.$el.append(view.render().el);
    this.addView(view);
  },

  _removeSubview: function (model) {
    var id = model.get('id');
    var view = _.first(_.filter(this._subviews, function (subview) {
      return subview._notifierModel.get('id') === id;
    }));

    if (view) {
      this.removeView(view);
      view.remove();
    }
  },

  _changeStyle: function () {
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());
  }

});
