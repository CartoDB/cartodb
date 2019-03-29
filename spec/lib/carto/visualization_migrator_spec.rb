require 'spec_helper_min'
require 'carto/visualization_migrator'

describe Carto::VisualizationMigrator do
  include Carto::Factories::Visualizations
  include_context 'visualization creation helpers'

  class VizMigrator
    include Carto::VisualizationMigrator
  end

  let(:migrator) { VizMigrator.new }

  shared_context 'full visualization' do
    before(:all) do
      @user_1 = FactoryGirl.create(:carto_user, private_tables_enabled: false)
    end

    before(:each) do
      @map, @table, @table_visualization, @visualization = create_full_visualization(Carto::User.find(@user_1.id), visualization_attributes: { version: 3 })
    end

    after(:each) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    end

    after(:all) do
      @user_1.destroy
    end
  end

  describe '#migrate_visualization_to_v3' do
    include_context 'full visualization'

    it 'migrates layer selector for ActiveRecord model' do
      @visualization.overlays << Carto::Overlay.new(type: 'layer_selector')
      @visualization.reload

      migrator.migrate_visualization_to_v3(@visualization)

      @visualization.reload
      @visualization.overlays.any? { |o| o.type == 'layer_selector' }.should be_false
      @visualization.map.options['layer_selector'].should be_true
    end

    it 'fixes GMaps options' do
      basemap = @visualization.layers.first
      basemap.kind = 'gmapsbase'
      basemap.options = { "type" => "GMapsBase", "base_type" => "roadmap" }
      basemap.save!

      migrator.migrate_visualization_to_v3(@visualization)

      @visualization.reload
      @visualization.layers.first.options.should have_key(:baseType)
      @visualization.layers.first.options.should_not have_key(:base_type)
    end

    it 'adds analyses' do
      # Fixture check
      expect(@visualization.analyses.none?).to be_true
      expect(@visualization.data_layers.none?(&:source_id)).to be_true

      migrator.migrate_visualization_to_v3(@visualization)

      @visualization.reload
      expect(@visualization.analyses.any?).to be_true
      expect(@visualization.data_layers.all?(&:source_id)).to be_true
    end
  end
end
