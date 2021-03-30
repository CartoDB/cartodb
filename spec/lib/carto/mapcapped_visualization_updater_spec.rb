require 'spec_helper_min'
require 'carto/mapcapped_visualization_updater'

module Carto
  describe MapcappedVisualizationUpdater do
    include Factories::Visualizations
    include MapcappedVisualizationUpdater

    before(:all) do
      @user = create(:carto_user)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
    end

    after(:all) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      @user.destroy
    end

    it 'updates a non-mapcapped visualization' do
      Map.any_instance.stubs(:notify_map_change).once

      success = update_visualization_and_mapcap(@visualization) do |visualization, persisted|
        layer = visualization.layers.first
        layer.options[:wadus] = 'wadus!'
        layer.save if persisted
      end
      success.should be_true

      @visualization.reload
      @visualization.mapcapped?.should be_false
      @visualization.layers.first.options[:wadus].should eq 'wadus!'
    end

    it 'updates a mapcapped visualization' do
      @visualization.create_mapcap!
      @visualization.layers.first.update_attribute(:tooltip, do_not_publish_this: true)
      Map.any_instance.stubs(:notify_map_change).once

      success = update_visualization_and_mapcap(@visualization) do |visualization, persisted|
        layer = visualization.layers.first
        layer.options[:something] = 'else'
        layer.save if persisted
      end
      success.should be_true

      @visualization.reload
      @visualization.mapcapped?.should be_true
      @visualization.layers.first.options[:something].should eq 'else'

      mapcap_visualization = @visualization.latest_mapcap.regenerate_visualization
      mapcap_visualization.layers.first.options[:something].should eq 'else'
      mapcap_visualization.layers.first.tooltip.should be_nil
    end
  end
end
