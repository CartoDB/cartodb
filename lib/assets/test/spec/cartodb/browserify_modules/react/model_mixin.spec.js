/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');

describe('ModelMixin', function() {
  describe('given applied to a ReactClass', function() {
    beforeEach(function() {
      var Hello = React.createClass({
        mixins:[ModelMixin],
        getBackboneModels: function(){
          return [this.props.model]
        },
        render: function() {
          return <div>
            <div>Hello {this.props.model.get('initial')}</div>
            <input type="text" valueLink={this.bindTo(this.props.model, 'initial')}/>
          </div>;
        }
      });
      this.hello = Hello();
    });

    it('Can mixin model to a component', function() {
      expect(typeof this.hello).toBe('object');
    });
  });
});

