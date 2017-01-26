# encoding: utf-8

require 'spec_helper_min'
require 'models/layer_shared_examples'

describe Carto::Layer do
  include Carto::Factories::Visualizations

  it_behaves_like 'Layer model' do
    let(:layer_class) { Carto::Layer }
    def create_map(options = {})
      options.delete(:table_id)
      map = Carto::Map.create(options)
      FactoryGirl.create(:carto_visualization, map: map, user_id: options[:user_id]) if options[:user_id].present?

      map
    end

    def add_layer_to_entity(entity, layer)
      entity.layers << layer
    end

    before(:all) do
      @user = FactoryGirl.create(:carto_user, private_tables_enabled: true)

      @table = Table.new
      @table.user_id = @user.id
      @table.save
    end

    before(:each) do
      bypass_named_maps
    end

    after(:all) do
      @user.destroy
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
    before(:all) do
      bypass_named_maps
      @user = FactoryGirl.create(:carto_user)
      @map, @table1, @table_visualization, @visualization = create_full_visualization(@user)
      @table2 = FactoryGirl.create(:carto_user_table, user_id: @user.id, map_id: @map.id)
      @analysis = FactoryGirl.create(:analysis_point_in_polygon,
                                     user: @user, visualization: @visualization,
                                     source_table: @table1.name, target_table: @table2.name)
      @layer = @map.data_layers.first
    end

    after(:all) do
      @analysis.destroy
      destroy_full_visualization(@map, @table1, @table_visualization, @visualization)
      @user.destroy
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
end
