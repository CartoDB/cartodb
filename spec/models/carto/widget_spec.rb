require 'json'
require_relative '../../spec_helper'

describe Carto::Widget do
  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(Carto::User.find(user.id))

    @analysis = FactoryGirl.create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
  end

  after(:all) do
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    @user.destroy
  end

  describe 'Storage' do
    it 'can be stored and retrieved keeping the data' do
      widget = FactoryGirl.create(:widget_with_layer)
      loaded_widget = Carto::Widget.find(widget.id)
      loaded_widget.order.should == widget.order
      loaded_widget.type.should == widget.type
      loaded_widget.title.should == widget.title
      loaded_widget.layer.should == widget.layer
      loaded_widget.options.should == widget.options
      widget.destroy
    end

    it 'is deleted if layer is deleted' do
      widget = FactoryGirl.create(:widget_with_layer)
      widget.layer.destroy
      Carto::Widget.where(id: widget.id).first.should be_nil
    end

    describe '#save' do
      before(:each) do
        @widget = FactoryGirl.create(:widget, layer: @map.data_layers.first)
      end

      after(:each) do
        @widget.destroy
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
      @widget = FactoryGirl.build(:widget_with_layer, options: { valid: 'format' })
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

  context 'viewer users' do
    before(:each) do
      Map.any_instance.stubs(:update_related_named_maps)
      @layer = @visualization.data_layers.first
    end

    it "can't create a new widget" do
      user = @visualization.user
      user.viewer = true
      user.save
      @visualization.reload
      @layer.reload

      widget = FactoryGirl.build(:widget, layer: @layer)
      widget.save.should be_false
      widget.errors[:layer].should eq(["Viewer users can't edit widgets"])
    end

    it "can't delete widgets" do
      widget = FactoryGirl.create(:widget, layer: @layer)

      user = @visualization.user
      user.viewer = true
      user.save
      @visualization.reload
      widget = Carto::Widget.find(widget.id)

      widget.destroy.should eq false
      Carto::Widget.exists?(widget.id).should eq true
      widget.errors[:layer].should eq(["Viewer users can't edit widgets"])
    end
  end
end
