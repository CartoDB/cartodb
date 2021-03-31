require 'spec_helper_unit'
require 'models/layer_shared_examples'

describe Carto::Layer do
  include Carto::Factories::Visualizations

  let(:user) { create(:carto_user, private_tables_enabled: true, factory_bot_context: { only_db_setup: true }) }

  it_behaves_like 'Layer model' do
    let(:layer_class) { described_class }
    def create_map(options = {})
      options.delete(:table_id)
      map = Carto::Map.create(options)
      create(:carto_visualization, map: map, user_id: options[:user_id]) if options[:user_id].present?

      map
    end

    def add_layer_to_entity(entity, layer)
      entity.layers << layer
    end

    before do
      @table = Table.new
      @table.user_id = user.id
      @table.save
    end

    describe '#copy' do
      it 'returns a copy of the layer' do
        layer       = layer_class.create(kind: 'carto', options: { style: 'bogus' })
        layer_copy  = layer.dup

        layer_copy.kind.should    == layer.kind
        layer_copy.options.should == layer.options
        layer_copy.id.should be_nil
      end
    end
  end

  describe '#affected_tables' do
    before do
      bypass_named_maps
      @map, @table1, _, @visualization = create_full_visualization(user)
      @table2 = create(:carto_user_table, user_id: user.id, map_id: @map.id)
      @analysis = create(:analysis_point_in_polygon,
                                     user: user, visualization: @visualization,
                                     source_table: @table1.name, target_table: @table2.name)
      @layer = @map.data_layers.first
    end

    let(:source_analysis_id) { @analysis.analysis_node.children[0].id }
    let(:target_analysis_id) { @analysis.analysis_node.children[1].id }

    it 'returns all tables from the root analysis' do
      @layer.stubs(:options).returns(source: @analysis.natural_id)
      @layer.stubs(:affected_table_names).returns([]).twice
      affected = @layer.send(:affected_tables)
      affected.count.should eq 2
      affected.should include @table1
      affected.should include @table2
    end

    it 'returns only tables from the sub-analysis' do
      @layer.stubs(:options).returns(source: source_analysis_id)
      @layer.stubs(:affected_table_names).returns([]).once
      affected = @layer.send(:affected_tables)
      affected.count.should eq 1
      affected.should include @table1

      @layer.stubs(:options).returns(source: target_analysis_id)
      @layer.stubs(:affected_table_names).returns([]).once
      affected = @layer.send(:affected_tables)
      affected.count.should eq 1
      affected.should include @table2
    end

    it 'ignores query/table_name if source is specified' do
      @layer.stubs(:options).returns(source: 'wadus', table_name: @table1.name)
      affected = @layer.send(:affected_tables)
      affected.should be_empty
    end

    it 'fallbacks to query/table_name if source is not specified' do
      @layer.stubs(:options).returns(table_name: @table1.name)
      affected = @layer.send(:affected_tables)
      affected.should eq [@table1]

      query = "SELECT * FROM #{@table2.name}"
      @layer.stubs(:options).returns(query: query)
      @layer.stubs(:affected_table_names).with(query).returns([@table2.name]).once
      affected = @layer.send(:affected_tables)
      affected.should eq [@table2]
    end

    it 'returns values only from query (overrides table_name) if both specified' do
      query = "SELECT * FROM #{@table2.name}"
      @layer.stubs(:options).returns(table_name: @table1.name, query: query)
      @layer.stubs(:affected_table_names).with(query).returns([@table2.name]).once
      affected = @layer.send(:affected_tables)
      affected.count.should eq 1
      affected.should include @table2
    end

    describe '#affected_table_names' do
      it 'should return the affected tables' do
        sql = "select coalesce('tabname', null) from cdb_tablemetadata;select 1;select * from spatial_ref_sys"
        @layer.send(:affected_table_names, sql).should =~ ["cartodb.cdb_tablemetadata", "public.spatial_ref_sys"]
      end
    end
  end

  describe '#backup' do
    before do
      @map, @table1, _, @visualization = create_full_visualization(user)
    end

    it 'creates a backup when layer is destroyed' do
      layer = @visualization.layers.first
      layer.destroy

      Carto::VisualizationBackup.all.count.should eq 1

      backup = Carto::VisualizationBackup.where(visualization_id: @visualization.id).first
      backup.should_not eq nil
      backup.user_id.should eq user.id
      backup.created_at.should_not eq nil
      backup.category.should eq Carto::VisualizationBackup::CATEGORY_LAYER
      backup.export.should_not be_empty
      backup.destroy
    end
  end
end
