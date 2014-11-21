/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');

module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function(){
    return [this.props.model]
  },

  render: function() {
    return <div className="inner">
      <section className="left tables active">
        <div className="content">
          <ul>
            <li>
              <div class="table-item-inner shared">
                <h3>Hello {this.props.model.get('initial')}</h3>
                <p className="table-description">
                  <input type="text" valueLink={this.bindTo(this.props.model, 'initial')}/>
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>;
  }
});
