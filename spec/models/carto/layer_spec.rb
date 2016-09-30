# encoding: utf-8

require 'spec_helper_min'

describe Carto::Layer do
  include Carto::Factories::Visualizations

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
      affected = @layer.affected_tables
      affected.count.should eq 2
      affected.should include @table1
      affected.should include @table2
    end

    it 'returns only tables from the sub-analysis' do
      @layer.stubs(:options).returns(source: source_analysis_id)
      @layer.stubs(:affected_table_names).returns([]).once
      affected = @layer.affected_tables
      affected.count.should eq 1
      affected.should include @table1

      @layer.stubs(:options).returns(source: target_analysis_id)
      @layer.stubs(:affected_table_names).returns([]).once
      affected = @layer.affected_tables
      affected.count.should eq 1
      affected.should include @table2
    end

    it 'ignores query/table_name if source is specified' do
      @layer.stubs(:options).returns(source: 'wadus', table_name: @table1.name)
      affected = @layer.affected_tables
      affected.should be_empty
    end

    it 'fallbacks to query/table_name if source is not specified' do
      @layer.stubs(:options).returns(table_name: @table1.name)
      affected = @layer.affected_tables
      affected.should eq [@table1]

      query = "SELECT * FROM #{@table2.name}"
      @layer.stubs(:options).returns(query: query)
      @layer.stubs(:affected_table_names).with(query).returns([@table2.name]).once
      affected = @layer.affected_tables
      affected.should eq [@table2]
    end

    it 'returns values only from query (overrides table_name) if both specified' do
      query = "SELECT * FROM #{@table2.name}"
      @layer.stubs(:options).returns(table_name: @table1.name, query: query)
      @layer.stubs(:affected_table_names).with(query).returns([@table2.name]).once
      affected = @layer.affected_tables
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

  describe '#parse_cdb_querytables_result' do
    def parse(result)
      Carto::Layer.new.send(:parse_cdb_querytables_result, result)
    end

    it 'correctly parses unquoted identifiers' do
      parse('{table,pepito}').should eq ['table', 'pepito']
    end

    it 'correctly parses qualified identifiers' do
      parse('{table,user.pepito}').should eq ['table', 'user.pepito']
    end

    it 'correctly parses quoted usernames' do
      parse('{table,"\"user-hyphen\".pepito"}').should eq ['table', '"user-hyphen".pepito']
    end

    it 'correctly parses quoted usernames and tablenames' do
      parse('{"\"my-name\".\"is-wadus\",table"}').should eq ['"my-name"."is-wadus"', 'table']
    end

    it 'does not return anything for empty results' do
      parse('{}').should eq []
      parse('').should eq []
    end
  end
end
