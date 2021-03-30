require 'spec_helper_min'

describe Carto::UserTableIndexService do
  include NamedMapsHelper
  include Carto::Factories::Visualizations

  before(:all) do
    bypass_named_maps
    @user = create(:carto_user)
    @map1, @table1, @table_visualization1, @visualization1 = create_full_visualization(@user)
    @map2, @table2, @table_visualization2, @visualization2 = create_full_visualization(@user)

    @map12 = create(:carto_map, user_id: @user.id)
    create(:carto_tiled_layer, maps: [@map12])
    create(:carto_layer_with_sql, maps: [@map12], table_name: @table1.name)
    create(:carto_layer_with_sql, maps: [@map12], table_name: @table2.name)
    @map12.reload
    @visualization12 = create(:carto_visualization, user: @user, map: @map12)

    # Register table dependencies
    [@map1, @map2, @map12].each do |map|
      map.data_layers.each do |layer|
        ::Layer[layer.id].register_table_dependencies
      end
    end

    # Create analyses
    @analysis1 = create(:source_analysis,
                                    visualization: @visualization1,
                                    user: @user,
                                    source_table: @table1.name)
    @analysis2 = create(:analysis_with_source,
                                    visualization: @visualization2,
                                    user: @user,
                                    source_table: @table2.name)
    @analysis12_1 = create(:source_analysis,
                                       visualization: @visualization12,
                                       user: @user,
                                       source_table: @table1.name)
    @analysis12_2 = create(:source_analysis,
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

  describe '#generate_indices' do
    before(:each) do
      bypass_named_maps
      Carto::Widget.all.map(&:destroy)
      @table1.reload
      Carto::UserTableIndexService.any_instance.stubs(:indexable_column?).returns(true)
    end

    it 'creates indices for all widgets' do
      @table1.service.stubs(:pg_indexes).returns([])
      @table1.service.stubs(:estimated_row_count).returns(100000)
      create_widget(@analysis1, column: 'number')
      create_widget(@analysis12_1, column: 'date', type: 'time-series')

      stub_create_index('number').once
      stub_create_index('date').once
      Carto::UserTableIndexService.new(@table1).send(:generate_indices)
    end

    it 'does not create indices for small tables' do
      @table1.service.stubs(:pg_indexes).returns([])
      @table1.service.stubs(:estimated_row_count).returns(100)
      create_widget(@analysis1, column: 'number')
      create_widget(@analysis12_1, column: 'date', type: 'time-series')

      stub_create_index('number').never
      stub_create_index('date').never
      Carto::UserTableIndexService.new(@table1).send(:generate_indices)
    end

    it 'does not create indices for formula widgets' do
      @table1.service.stubs(:pg_indexes).returns([])
      @table1.service.stubs(:estimated_row_count).returns(100000)
      create_widget(@analysis1, column: 'number', type: 'formula')

      stub_create_index('number').never
      Carto::UserTableIndexService.new(@table1).send(:generate_indices)
    end

    it 'does not create indices for indexed columns' do
      @table1.service.stubs(:pg_indexes).returns([{ name: 'wadus', column: 'number', valid: true }])
      @table1.service.stubs(:estimated_row_count).returns(100000)
      create_widget(@analysis1, column: 'number')
      create_widget(@analysis12_1, column: 'date', type: 'time-series')

      stub_create_index('number').never
      stub_create_index('date').once
      Carto::UserTableIndexService.new(@table1).send(:generate_indices)
    end

    it 'does not create indices for indexed columns (in multi-column indexes)' do
      @table1.service.stubs(:pg_indexes).returns([{ name: 'idx', column: 'number', valid: true },
                                                  { name: 'idx', column: 'date', valid: true }])
      @table1.service.stubs(:estimated_row_count).returns(100000)
      create_widget(@analysis1, column: 'number')
      create_widget(@analysis12_1, column: 'date', type: 'time-series')

      stub_create_index('number').never
      stub_create_index('date').never
      Carto::UserTableIndexService.new(@table1).send(:generate_indices)
    end

    it 'drops unneeded indices' do
      @table1.service.stubs(:pg_indexes).returns([automatic_index_record(@table1, 'number')])
      @table1.service.stubs(:estimated_row_count).returns(100000)

      stub_drop_index('number').once
      Carto::UserTableIndexService.new(@table1).send(:generate_indices)
    end

    it 'drops indices for small tables' do
      @table1.service.stubs(:pg_indexes).returns([automatic_index_record(@table1, 'number')])
      @table1.service.stubs(:estimated_row_count).returns(100)
      create_widget(@analysis1, column: 'number')

      stub_drop_index('number').once
      Carto::UserTableIndexService.new(@table1).send(:generate_indices)
    end

    it 'does not drop manual indices' do
      @table1.service.stubs(:pg_indexes).returns([{ name: 'idx', column: 'number', valid: true },
                                                  { name: 'idx', column: 'date', valid: false }])
      @table1.service.stubs(:estimated_row_count).returns(100)
      create_widget(@analysis1, column: 'number')

      @table1.service.stubs(:drop_index).never
      Carto::UserTableIndexService.new(@table1).send(:generate_indices)
    end

    it 'drops and recreates invalid auto indices' do
      @table1.service.stubs(:pg_indexes).returns([automatic_index_record(@table1, 'number', valid: false)])
      @table1.service.stubs(:estimated_row_count).returns(100000)
      create_widget(@analysis1, column: 'number')

      stub_drop_index('number').once
      stub_create_index('number').once
      Carto::UserTableIndexService.new(@table1).send(:generate_indices)
    end
  end

  describe '#indexable_column?' do
    before(:all) do
      @service = Carto::UserTableIndexService.new(@table1)
    end

    it 'returns true for a random numbers column' do
      @service.stubs(:pg_stats_by_column).returns(
        'col' => {
          null_frac: 0,
          n_distinct: -1,
          most_common_vals: [],
          most_common_freqs: [],
          histogram_bounds: [4, 10, 20, 50, 100],
          correlation: 0.4
        }
      )
      @service.send(:indexable_column?, 'col').should be_true
    end

    it 'returns true for a column with several categories' do
      @service.stubs(:pg_stats_by_column).returns(
        'col' => {
          null_frac: 0,
          n_distinct: 20,
          most_common_vals: ['a', 'b', 'c', 'd', 'e', 'f'],
          most_common_freqs: [0.2, 0.1, 0.1, 0.05, 0.05, 0.02],
          histogram_bounds: ['a', 'c', 'e', 'f'],
          correlation: 0.4
        }
      )
      @service.send(:indexable_column?, 'col').should be_true
    end

    it 'returns true for a column with several and no histogram' do
      @service.stubs(:pg_stats_by_column).returns(
        'col' => {
          null_frac: 0,
          n_distinct: 20,
          most_common_vals: nil,
          most_common_freqs: nil,
          histogram_bounds: nil,
          correlation: 0.4
        }
      )
      @service.send(:indexable_column?, 'col').should be_true
    end

    it 'returns false for a balance boolean column' do
      @service.stubs(:pg_stats_by_column).returns(
        'col' => {
          null_frac: 0,
          n_distinct: 2,
          most_common_vals: [true, false],
          most_common_freqs: [0.51, 0.49],
          histogram_bounds: nil,
          correlation: 0.502
        }
      )
      @service.send(:indexable_column?, 'col').should be_false
    end

    it 'returns true for an unbalance boolean column' do
      @service.stubs(:pg_stats_by_column).returns(
        'col' => {
          null_frac: 0,
          n_distinct: 2,
          most_common_vals: [true, false],
          most_common_freqs: [0.89, 0.11],
          histogram_bounds: nil,
          correlation: 0.602
        }
      )
      @service.send(:indexable_column?, 'col').should be_true
    end

    it 'returns true for a boolean column used as cluster (table sorted by it)' do
      @service.stubs(:pg_stats_by_column).returns(
        'col' => {
          null_frac: 0,
          n_distinct: 2,
          most_common_vals: [true, false],
          most_common_freqs: [0.51, 0.49],
          histogram_bounds: nil,
          correlation: -1
        }
      )
      @service.send(:indexable_column?, 'col').should be_true
    end

    it 'returns false if no stats can be gathered' do
      @service.stubs(:pg_stats_by_column).returns({})
      @service.send(:indexable_column?, 'col').should be_false
    end
  end

  private

  def automatic_index_record(table, column, valid: true)
    {
      name: table.service.send(:index_name, column, Carto::UserTableIndexService::AUTO_INDEX_PREFIX),
      column: column,
      valid: valid
    }
  end

  def stub_create_index(column)
    @table1.service.stubs(:create_index).with(column, Carto::UserTableIndexService::AUTO_INDEX_PREFIX, concurrent: true)
  end

  def stub_drop_index(column)
    @table1.service.stubs(:drop_index).with(column, Carto::UserTableIndexService::AUTO_INDEX_PREFIX, concurrent: true)
  end

  def create_widget(analysis, child: false, column: 'col', type: 'histogram')
    root_node = analysis.analysis_node
    child_node = root_node.children.first
    widget_node = child ? child_node : root_node

    # Locate the layer corresponding to this analysis (matches visualization and table name from source node)
    source_node = child_node || root_node
    layer = analysis.visualization.data_layers.find do |l|
      l.user_tables.any? { |t| t.name == source_node.options[:table_name] }
    end

    create(:widget, layer: layer, source_id: widget_node.id, column_name: column, type: type)
  end
end
