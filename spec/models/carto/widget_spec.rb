require 'json'
require 'spec_helper_unit'

describe Carto::Widget do
  describe 'Storage' do
    it 'can be stored and retrieved keeping the data' do
      widget = create(:widget_with_layer)
      loaded_widget = Carto::Widget.find(widget.id)
      loaded_widget.order.should == widget.order
      loaded_widget.type.should == widget.type
      loaded_widget.title.should == widget.title
      loaded_widget.layer.should == widget.layer
      loaded_widget.options.should == widget.options
      loaded_widget.style.should == widget.style
      widget.destroy
    end

    it 'is deleted if layer is deleted' do
      widget = create(:widget_with_layer)
      widget.layer.destroy
      Carto::Widget.where(id: widget.id).first.should be_nil
    end

    describe '#save' do
      let(:user) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
      let(:map) { create(:carto_map_with_layers, user: user) }
      let!(:widget) { create(:widget, layer: map.data_layers.first) }

      it 'triggers notify_map_change on related map(s)' do
        ::Map.any_instance.expects(:notify_map_change)
        widget.title = 'Updated title'
        widget.save
      end
    end
  end

  describe 'Validations' do
    describe 'Format and validation' do
      before do
        @widget = build(:widget_with_layer, options: { valid: 'format' })
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

    describe 'Source id validation' do
      before do
        @widget = build(:widget_with_layer, source_id: 'foo')
      end

      it 'accepts source id if cames as string' do
        expect(@widget.valid?).to be_true
        expect(@widget.errors[:source_id]).to eq([])
      end

      it 'rejects source id if cames as a hash' do
        @widget.source_id = { foo: 'bar' }

        expect(@widget.valid?).to be_false
        expect(@widget.errors[:source_id]).to include('Source id must be a string')
      end
    end
  end

  describe '#from_visualization_id' do
    before do
      @user = create(:carto_user, factory_bot_context: { only_db_setup: true })
      @map = create(:carto_map_with_layers, user: @user)
      @visualization = create(:carto_visualization, map: @map)
    end

    it 'retrieves all visualization widgets' do
      # Twice expectation: creation + destroy
      Map.any_instance.expects(:update_related_named_maps).times(2).returns(true)
      layer = @visualization.data_layers.first
      widget = create(:widget, layer: layer)
      widget2 = create(:widget_with_layer)

      widgets = Carto::Widget.from_visualization_id(@visualization.id)
      widgets.length.should == 1
      widgets.should include(widget)
      widgets.should_not include(widget2)

      widget2.destroy
      widget.destroy
    end
  end

  context 'viewer users' do
    before do
      Map.any_instance.stubs(:update_related_named_maps)
      @user = create(:carto_user, factory_bot_context: { only_db_setup: true })
      @map = create(:carto_map_with_layers, user: @user)
      @visualization = create(:carto_visualization, map: @map, user: @user)
      @layer = @visualization.data_layers.first
      @widget = create(:widget, layer: @layer)

      @user.update_attribute(:viewer, true)
      @layer.user.reload
    end

    it "can't create a new widget" do
      widget = build(:widget, layer: @layer)
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
