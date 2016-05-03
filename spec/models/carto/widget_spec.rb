require 'json'
require_relative '../../spec_helper'

describe Carto::Widget do
  describe 'Storage' do
    it 'can be stored and retrieved keeping the data' do
      widget = FactoryGirl.create(:widget_with_layer)
      loaded_widget = Carto::Widget.find(widget.id)
      loaded_widget.order.should == widget.order
      loaded_widget.type.should == widget.type
      loaded_widget.title.should == widget.title
      loaded_widget.layer.should == widget.layer
      loaded_widget.options.should == widget.options
      loaded_widget.options_json.should == JSON.parse(widget.options).symbolize_keys
      widget.destroy
    end

    it 'is deleted if layer is deleted' do
      widget = FactoryGirl.create(:widget_with_layer)
      widget.layer.destroy
      Carto::Widget.where(id: widget.id).first.should be_nil
    end

    describe '#save' do
      before(:each) do
        @map = FactoryGirl.create(:carto_map_with_layers)
        @widget = FactoryGirl.create(:widget, layer: @map.data_layers.first)
      end

      after(:each) do
        @widget.destroy
        @map.destroy
      end

      it 'triggers notify_map_change on related map(s)' do
        map = mock
        map.stubs(:id).returns(@map.id)
        map.expects(:notify_map_change).twice
        Map.stubs(:where).with(id: map.id).returns([map])

        @widget.title = "xxx#{@widget.title}"
        @widget.save
      end
    end
  end

  describe 'Format and validation' do
    before(:each) do
      @widget = FactoryGirl.build(:widget_with_layer, options: { valid: 'format' }.to_json)
    end

    it 'validates correct options format' do
      @widget.valid?.should be_true
      @widget.errors[:options].empty?.should be_true
    end

    it 'validates incorrect options format' do
      @widget.options = 'badformat'

      @widget.valid?.should be_false
      @widget.errors[:options].empty?.should be_false
    end
  end

  describe '#from_visualization_id' do
    before(:each) do
      @map = FactoryGirl.create(:carto_map_with_layers)
      @visualization = FactoryGirl.create(:carto_visualization, map: @map)
    end

    after(:each) do
      @visualization.destroy
      @map.destroy
    end

    it 'retrieves all visualization widgets' do
      # Twice expectation: creation + destroy
      Map.any_instance.expects(:update_related_named_maps).times(2).returns(true)
      layer = @visualization.data_layers.first
      widget = FactoryGirl.create(:widget, layer: layer)
      widget2 = FactoryGirl.create(:widget_with_layer)

      widgets = Carto::Widget.from_visualization_id(@visualization.id)
      widgets.length.should == 1
      widgets.should include(widget)
      widgets.should_not include(widget2)

      widget2.destroy
      widget.destroy
    end
  end
end
