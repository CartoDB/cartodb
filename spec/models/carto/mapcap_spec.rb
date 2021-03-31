require 'spec_helper_unit'
require 'support/helpers'

describe Carto::Mapcap do
  include Carto::Factories::Visualizations

  let(:user) { create(:carto_user, private_tables_enabled: true, factory_bot_context: { only_db_setup: true }) }

  before do
    @map, _, _, @visualization = create_full_visualization(user)
  end

  describe '#ids_vizjson' do
    before do
      @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
      @ids_json = @mapcap.ids_json
    end

    it 'should have visualization_id' do
      @ids_json[:visualization_id].should_not be_nil
    end

    it 'should have map_id' do
      @ids_json[:map_id].should_not be_nil
    end

    it 'should have correct visualization_id' do
      @ids_json[:visualization_id].should eq @visualization.id
    end

    it 'should have correct map_id' do
      @ids_json[:map_id].should eq @map.id
    end

    describe 'with layers' do
      before do
        @carto_layer = create(:carto_layer, kind: 'carto', maps: [@map])
        @visualization.reload

        @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
        @ids_json_layers = @mapcap.ids_json[:layers]
      end

      it 'should not have empty layers' do
        @ids_json_layers.should_not be_empty
      end

      it 'should contain layer ids and in the right order' do
        @ids_json_layers.count.should eq @visualization.layers.count

        @ids_json_layers.each_with_index do |layer, index|
          layer[:layer_id].should eq @visualization.layers[index].id
        end
      end

      describe 'with widgets' do
        before do
          @widget = create(:widget, layer: @carto_layer)
          @visualization.reload

          @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
          @ids_json_layers = @mapcap.ids_json[:layers]
        end

        it 'should contain widgets only for layers with widgets and in the right order' do
          @visualization.layers.each_with_index do |layer, index|
            @ids_json_layers[index][:widgets].each_with_index do |widget_id, widget_index|
              widget_id.should eq layer.widgets[widget_index].id
            end
          end
        end
      end
    end
  end

  describe '#regenerate_visualization' do
    before do
      create(:analysis, visualization: @visualization, user: user)
      create(:widget, layer: @visualization.data_layers.first)
      @visualization.reload
      @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
    end

    it 'tokens should be functional from regenerated visualizations after privacy changes' do
      @visualization.create_mapcap!
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.password = "r4nr0mp455"
      @visualization.save!
      mapcap = @visualization.create_mapcap!
      mapcap.regenerate_visualization.non_mapcapped.auth_token
    end

    it 'should preserve map' do
      regenerated_visualization = @mapcap.regenerate_visualization
      regenerated_visualization.map.id.should eq @map.id
    end

    it 'should preserve visualization' do
      regenerated_visualization = @mapcap.regenerate_visualization
      regenerated_visualization.id.should eq @visualization.id
    end

    it 'should preserve user' do
      regenerated_visualization = @mapcap.regenerate_visualization
      regenerated_visualization.user.id.should eq @visualization.user.id
    end

    it 'should preserve permission' do
      regenerated_visualization = @mapcap.regenerate_visualization
      regenerated_visualization.permission.id.should eq @visualization.permission.id
    end

    it 'should preserve analyses' do
      regenerated_visualization = @mapcap.regenerate_visualization
      analysis = @visualization.analyses.first
      regenerated_analysis = regenerated_visualization.analyses.first
      expect(regenerated_analysis.analysis_definition).to eq analysis.analysis_definition
    end

    it 'should preserve widgets' do
      regenerated_visualization = @mapcap.regenerate_visualization
      widget = @visualization.widgets.first
      regenerated_widget = regenerated_visualization.widgets.first

      expect(regenerated_widget.order).to eq widget.order
      expect(regenerated_widget.type).to eq widget.type
      expect(regenerated_widget.title).to eq widget.title
      expect(regenerated_widget.options).to eq widget.options
      expect(regenerated_widget.source_id).to eq widget.source_id
      expect(regenerated_widget.style).to eq widget.style
    end

    it 'should be readonly' do
      rv = @mapcap.regenerate_visualization

      rv.readonly?.should eq true
      rv.user.readonly?.should eq true
      rv.full_user.readonly?.should eq true
      rv.permission.readonly?.should eq true
      rv.likes.each { |like| like.readonly?.should eq true }
      rv.shared_entities.each { |entity| entity.readonly?.should eq true }
      rv.unordered_children.each { |child| child.readonly?.should eq true }
      rv.overlays.each { |overlay| overlay.readonly?.should eq true }
      rv.active_layer.readonly?.should eq true
      rv.map.readonly?.should eq true
      rv.related_templates.each { |template| template.readonly?.should eq true }
      rv.external_sources.each { |resource| resource.readonly?.should eq true }
      rv.analyses.each { |analysis| analysis.readonly?.should eq true }
      rv.mapcaps.each { |mapcap| mapcap.readonly?.should eq true }
      rv.state.readonly?.should eq true
      rv.snapshots.each { |snapshot| snapshot.readonly?.should eq true }
    end

    describe 'without user DB' do
      before do
        user_nodb = create(:carto_user, private_tables_enabled: true, factory_bot_context: { only_db_setup: true })
        @map_nodb, @table_nodb, @table_visualization_nodb, @visualization_nodb = create_full_visualization(user_nodb)
        @mapcap_nodb = Carto::Mapcap.create!(visualization_id: @visualization_nodb.id)
        @actual_db_name = user_nodb.database_name
        user_nodb.update_attribute(:database_name, 'wadus')
        @mapcap_nodb.reload
      end

      it 'should work' do
        Rails.logger.expects(:warning).never
        User.any_instance.expects(:in_database).never
        @mapcap_nodb.regenerate_visualization
        User.any_instance.unstub(:in_database)
      end
    end

    describe 'with layers' do
      before do
        @carto_layer = create(:carto_layer, kind: 'carto', maps: [@map])
        @visualization.reload

        @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
      end

      it 'should contain same layers in same order' do
        Rails.logger.expects(:warning).never
        User.any_instance.stubs(:in_database).raises("Mapcap regeneration shouldn't touch user database")
        Carto::User.any_instance.stubs(:in_database).raises("Mapcap regeneration shouldn't touch user database")
        regenerated_visualization = @mapcap.regenerate_visualization
        regenerated_visualization.layers.each_with_index do |layer, index|
          expect(layer.id).to eq(regenerated_visualization.layers[index].id)
        end
        Carto::User.any_instance.unstub(:in_database)
        User.any_instance.unstub(:in_database)
      end

      describe 'with widgets' do
        before do
          @widget = create(:widget, layer: @carto_layer)
          @visualization.reload
          @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
        end

        it 'should contain widgets only for layers with widgets and in the right order' do
          @visualization.layers.each_with_index do |layer, index|
            regenerated_visualization = @mapcap.regenerate_visualization
            regenerated_layer = regenerated_visualization.layers[index]

            layer.widgets.length.should eq regenerated_layer.widgets.length

            layer.widgets.each_with_index do |widget, widget_index|
              widget.should eq regenerated_layer.widgets[widget_index]
            end
          end
        end
      end
    end
  end
end
