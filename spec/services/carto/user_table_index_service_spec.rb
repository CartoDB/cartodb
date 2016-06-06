require 'spec_helper_min'

describe Carto::UserTableIndexService do
  include NamedMapsHelper
  include Carto::Factories::Visualizations

  before(:all) do
    bypass_named_maps
    @user = FactoryGirl.create(:carto_user)
    @map1, @table1, @table_visualization1, @visualization1 = create_full_visualization(@user)
    @map2, @table2, @table_visualization2, @visualization2 = create_full_visualization(@user)

    @map12 = FactoryGirl.create(:carto_map, user_id: @user.id)
    FactoryGirl.create(:carto_tiled_layer, maps: [@map12])
    FactoryGirl.create(:carto_layer_with_sql, maps: [@map12], table_name: @table1.name)
    FactoryGirl.create(:carto_layer_with_sql, maps: [@map12], table_name: @table2.name)
    @map12.reload
    @visualization12 = FactoryGirl.create(:carto_visualization, user: @user, map: @map12)

    # Register table dependencies
    [@map1, @map2, @map12].each do |map|
      map.data_layers.each do |layer|
        ::Layer[layer.id].register_table_dependencies
      end
    end

    # Create analyses
    @analysis1 = FactoryGirl.create(:source_analysis,
                                    visualization: @visualization1,
                                    user: @user,
                                    source_table: @table1.name)
    @analysis2 = FactoryGirl.create(:analysis_with_source,
                                    visualization: @visualization2,
                                    user: @user,
                                    source_table: @table2.name)
    @analysis12_1 = FactoryGirl.create(:source_analysis,
                                       visualization: @visualization12,
                                       user: @user,
                                       source_table: @table1.name)
    @analysis12_2 = FactoryGirl.create(:source_analysis,
                                       visualization: @visualization12,
                                       user: @user,
                                       source_table: @table2.name)
  end

  after(:all) do
    bypass_named_maps
    @visualization12.destroy if @visualization12
    @map12.destroy if @map12
    destroy_full_visualization(@map2, @table2, @table_visualization2, @visualization2)
    destroy_full_visualization(@map1, @table1, @table_visualization1, @visualization1)
    # This avoids connection leaking.
    ::User[@user.id].destroy
  end

  describe '#table_widgets' do
    before(:all) do
      @widget1 = create_widget(@analysis1)
      @widget2_analysis = create_widget(@analysis2)
      @widget2_source = create_widget(@analysis2, child: true)
      @widget12_1 = create_widget(@analysis12_1)
      @widget12_2 = create_widget(@analysis12_2)
    end

    after(:all) do
      Carto::Widget.all.map(&:destroy)
    end

    it 'retrieves all widgets related to the table' do
      service = Carto::UserTableIndexService.new(@table1)
      widgets = service.send(:table_widgets)
      widgets.sort.should eq [@widget1, @widget12_1].sort
    end

    it 'does not retrieve widgets that operate on an analysis' do
      service = Carto::UserTableIndexService.new(@table2)
      widgets = service.send(:table_widgets)
      widgets.sort.should eq [@widget2_source, @widget12_2].sort
      widgets.should_not include @widget2_analysis
    end
  end

  private

  def create_widget(analysis, child = false)
    root_node = analysis.analysis_node
    child_node = root_node.children.first
    widget_node = child ? child_node : root_node

    # Locate the layer corresponding to this analysis (matches visualization and table name from source node)
    source_node = child_node || root_node
    layer = analysis.visualization.data_layers.find do |l|
      l.user_tables.any? { |t| t.name == source_node.options[:table_name] }
    end

    FactoryGirl.create(:widget, layer: layer, source_id: widget_node.id)
  end
end
