var ModelMixin = require('react/model_mixin');
var React = require('react');

describe('ModelMixin', function() {
  it('Can mixin model to a component', function() {
    Hello = React.createClass({
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
  });
});

