# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::Analysis do
  let(:definition_with_options) do
    {
      id: "a1",
      type: "buffer",
      params: {
        distance: 100
      },
      options: {
        unit: "m"
      }
    }
  end

  let(:nested_definition_with_options) do
    {
      id: "a1",
      type: "buffer",
      params: {
        source: definition_with_options
      }
    }
  end

  let(:point_in_polygon_definition_with_options) do
    {
      id: "a2",
      type: "point-in-polygon",
      options: { primary_source_name: "polygons_source" },
      params: {
        polygon_source: definition_with_options,
        points_source: {
          id: "table",
          type: "source",
          params: { query: "SELECT * FROM table" },
          options: { table_name: "table" }
        }
      }
    }
  end

  describe '#natural_id' do
    it 'returns nil if analysis definition has no id at the first level' do
      Carto::Analysis.new(analysis_definition: nil).natural_id.should eq nil
      Carto::Analysis.new(analysis_definition: {}).natural_id.should eq nil
      Carto::Analysis.new(analysis_definition: { "wadus" => 1 }).natural_id.should eq nil
      Carto::Analysis.new(analysis_definition: { wadus: 1 }).natural_id.should eq nil
    end

    it 'returns id if analysis definition has id at the first level' do
      Carto::Analysis.new(analysis_definition: { id: "a1" }).natural_id.should eq 'a1'
    end
  end

  describe '#analysis_definition' do
    it 'removes options from analysis definition' do
      analysis = Carto::Analysis.new(analysis_definition: definition_with_options)
      analysis.analysis_definition.include?(:options).should be_true
      analysis.analysis_definition_for_api.include?(:options).should be_false
    end

    it 'removes options from nested source analysis' do
      analysis = Carto::Analysis.new(analysis_definition: nested_definition_with_options)

      nested_analysis = analysis.analysis_definition_for_api[:params][:source]
      nested_analysis.include?(:options).should be_false
    end

    it 'removes options from nested source analysis with multiple sources' do
      analysis = Carto::Analysis.new(analysis_definition: point_in_polygon_definition_with_options)

      polygon_analysis = analysis.analysis_definition_for_api[:params][:polygon_source]
      polygon_analysis.include?(:options).should be_false

      points_analysis = analysis.analysis_definition_for_api[:params][:points_source]
      points_analysis.include?(:options).should be_false
    end
  end

  describe '#analysis_node' do
    it 'returns an analysis node with the definition of the analysis' do
      analysis = Carto::Analysis.new(analysis_definition: definition_with_options)
      node = analysis.analysis_node
      node.definition.should eq analysis.analysis_definition
      node.children.should be_empty
    end

    it 'returns an analysis tree' do
      analysis = Carto::Analysis.new(analysis_definition: nested_definition_with_options)
      root = analysis.analysis_node
      root.definition.should eq analysis.analysis_definition

      children = root.children
      children.should_not be_empty
      children[0].children.should be_empty
      children[0].definition.should eq definition_with_options
    end
  end

  describe '#save' do
    include Carto::Factories::Visualizations
    include HelperMethods

    before(:all) do
      bypass_named_maps
      @user = FactoryGirl.create(:carto_user)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
      @analysis = FactoryGirl.create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
    end

    after(:all) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      # This avoids connection leaking.
      ::User[@user.id].destroy
      @analysis.destroy
    end

    it 'triggers notify_map_change on related map(s)' do
      map = mock
      map.stubs(:id).returns(@map.id)
      map.expects(:notify_map_change).once
      Map.stubs(:where).with(id: map.id).returns([map])
      @analysis.stubs(:map).returns(map)

      @analysis.analysis_definition = definition_with_options
      @analysis.save
    end
  end

end
