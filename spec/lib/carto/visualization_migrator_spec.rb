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
      @map, @table, @table_visualization, @visualization = create_full_visualization(Carto::User.find(@user_1.id), visualization_attributes: { version: 3 })
    end

    after(:all) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      @user_1.destroy
    end
  end

  describe '#migrate_visualization_to_v3' do
    include_context 'full visualization'

    it 'migrates layer selector for sequel model' do
      @visualization.overlays << Carto::Overlay.new(type: 'layer_selector')

      model = CartoDB::Visualization::Member.new(id: @visualization.id).fetch
      migrator.migrate_visualization_to_v3(model)

      model = CartoDB::Visualization::Member.new(id: @visualization.id).fetch
      model.overlays.any? { |o| o.type == 'layer_selector' }.should be_false
      model.map.options['layer_selector'].should be_true
    end

    it 'migrates layer selector for ActiveRecord model' do
      @visualization.overlays << Carto::Overlay.new(type: 'layer_selector')
      @visualization.reload

      migrator.migrate_visualization_to_v3(@visualization)

      @visualization.reload
      @visualization.overlays.any? { |o| o.type == 'layer_selector' }.should be_false
      @visualization.map.options['layer_selector'].should be_true
    end
  end
end
