require 'json'
require_relative '../../spec_helper'

describe Carto::Widget do
  describe 'Storage' do
    it 'can be stored and retrieved keeping the data' do
      widget = FactoryGirl.create(:widget)
      loaded_widget = Carto::Widget.find(widget.id)
      loaded_widget.layer.should == widget.layer
      loaded_widget.order.should == widget.order
      loaded_widget.widget_json.should == widget.widget_json
      loaded_widget.widget_json_json.should == JSON.parse(widget.widget_json).symbolize_keys
    end
  end
end

