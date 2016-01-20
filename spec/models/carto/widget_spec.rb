require 'json'
require_relative '../../spec_helper'

describe Carto::Widget do
  describe 'Storage' do
    it 'can be stored and retrieved keeping the data' do
      widget = FactoryGirl.create(:widget_with_layer)
      loaded_widget = Carto::Widget.find(widget.id)
      loaded_widget.layer.should == widget.layer
      loaded_widget.order.should == widget.order
      loaded_widget.widget_json.should == widget.widget_json
      loaded_widget.widget_json_json.should == JSON.parse(widget.widget_json).symbolize_keys
    end
  end

  describe 'dataview layer_id' do
    it 'trigger validation error if it does not match with widget id' do
      layer = FactoryGirl.create(:carto_layer)
      widget = FactoryGirl.build(:widget, layer: layer, widget_json: '{"dataview": { "layer_id": "a8e53ceb-c016-4ea3-92df-7b0b3c24eb36" }}')
      widget.save.should be_false
      widget.errors.should_not be_empty
    end
  end
end

