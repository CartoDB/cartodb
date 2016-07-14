require 'json'
require_relative '../../spec_helper'

describe Carto::Widget do
  include Carto::Factories::Visualizations

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)

    @analysis = FactoryGirl.create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
  end

  after(:all) do
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    @user.destroy
  end

  describe 'Storage' do
    it 'can be stored and retrieved keeping the data' do
      widget = FactoryGirl.create(:widget_with_layer,
                                  layer: @map.data_layers.first,
                                  source_id: @analysis.analysis_definition[:id])
      loaded_widget = Carto::Widget.find(widget.id)
      loaded_widget.order.should == widget.order
      loaded_widget.type.should == widget.type
      loaded_widget.title.should == widget.title
      loaded_widget.layer.should == widget.layer
      loaded_widget.options.should == widget.options
      widget.destroy
    end

    it 'is deleted if layer is deleted' do
      layer = FactoryGirl.create(:carto_layer, kind: 'carto', maps: [@map])
      @map.reload

      layer = Carto::Layer.find(layer.id)

      widget = FactoryGirl.create(:widget_with_layer,
                                  layer: layer,
                                  source_id: @analysis.analysis_definition[:id])
      layer.destroy
      Carto::Widget.where(id: widget.id).first.should be_nil
    end

    describe '#save' do
      before(:each) do
        @widget = FactoryGirl.create(:widget_with_layer,
                                     layer: @map.data_layers.first,
                                     source_id: @analysis.analysis_definition[:id])
      end

      after(:each) do
        @widget.destroy
        @map.reload
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
    before(:all) do
      @widget = FactoryGirl.create(:widget_with_layer,
                                   layer: @map.data_layers.first,
                                   source_id: @analysis.analysis_definition[:id])
    end

    after(:all) do
      @widget.destroy
      @map.reload
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
    it 'retrieves all visualization widgets' do
      map2, table2, table_visualization2, visualization2 = create_full_visualization(@user)

      # Twice expectation: 2x (creation + destroy) + analysis2 create
      Map.any_instance.expects(:update_related_named_maps).times(5).returns(true)
      widget = FactoryGirl.create(:widget_with_layer,
                                  layer: @map.data_layers.first,
                                  source_id: @analysis.analysis_definition[:id])

      analysis2 = FactoryGirl.create(:source_analysis, visualization_id: visualization2.id, user_id: @user.id)
      widget2 = FactoryGirl.create(:widget_with_layer,
                                   layer: map2.data_layers.first,
                                   source_id: analysis2.analysis_definition[:id])

      widgets = Carto::Widget.from_visualization_id(@visualization.id)
      widgets.length.should == 1
      widgets.should include(widget)
      widgets.should_not include(widget2)

      widget2.destroy
      widget.destroy
      @map.reload

      destroy_full_visualization(map2, table2, table_visualization2, visualization2)
    end
  end

  context 'viewer users' do
    before(:all) do
      widget = FactoryGirl.create(:widget_with_layer,
                                  layer: @map.data_layers.first,
                                  source_id: @analysis.analysis_definition[:id])
      @widget = Carto::Widget.find(widget.id)

      @user.update_attributes(viewer: true)
      @map.reload
    end

    before(:each) do
      Map.any_instance.stubs(:update_related_named_maps)
    end

    after(:all) do
      @user.update_attributes(viewer: false)
      @widget.destroy
      @map.reload

      @map.reload
    end

    it "can't create a new widget" do
      widget = FactoryGirl.build(:widget_with_layer,
                                 layer: @map.data_layers.first,
                                 source_id: @analysis.analysis_definition[:id])

      widget.save.should be_false
      widget.errors[:layer].should eq(["Viewer users can't edit widgets"])
    end

    it "can't delete widgets" do
      @widget.destroy.should eq false
      Carto::Widget.exists?(@widget.id).should eq true
      @widget.errors[:layer].should eq(["Viewer users can't edit widgets"])
    end
  end
end
