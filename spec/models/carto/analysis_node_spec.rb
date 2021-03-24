require 'spec_helper_unit'

describe Carto::AnalysisNode do
  let(:analysis_definition) do
    {
      id: "a2",
      type: "point-in-polygon",
      options: { primary_source_name: "polygons_source" },
      params: {
        points_source: {
          id: "paradas_metro_madrid",
          type: "source",
          params: { query: "SELECT * FROM paradas_metro_madrid" },
          options: { table_name: "paradas_metro_madrid" }
        },
        polygons_source: {
          id: "a1",
          type: "buffer",
          options: { kind: "car", time: "100", distance: "kilometers" },
          params: {
            source: {
              id: "a0",
              type: "source",
              params: { query: "SELECT * FROM paradas_metro_madrid" },
              options: { table_name: "paradas_metro_madrid" }
            },
            radius: 2000,
            isolines: 1,
            dissolved: false
          }
        }
      }
    }
  end

  before do
    @node = Carto::AnalysisNode.new(analysis_definition)
  end

  it 'returns definition values from accessors' do
    @node.id.should eq analysis_definition[:id]
    @node.type.should eq analysis_definition[:type]
    @node.params.should eq analysis_definition[:params]
    @node.options.should eq analysis_definition[:options]
  end

  describe '#children' do
    it 'returns all children of a node' do
      @node.children.count.should eq 2
      @node.children[0].id.should eq 'paradas_metro_madrid'
      @node.children[1].id.should eq 'a1'
    end

    it 'returns an empty list when no childrens are found' do
      @node.definition.delete(:params)
      @node.children.should eq []
    end
  end

  describe '#find_by_id' do
    it 'finds root element' do
      @node.find_by_id('a2').should eq @node
    end

    it 'finds direct children' do
      found = @node.find_by_id('a1')
      found.should be
    end

    it 'finds indirect descendants' do
      found = @node.find_by_id('a0')
      found.should be
    end

    it 'returns nil if not found' do
      @node.find_by_id('404').should be_nil
    end
  end

  describe '#source_descendants' do
    it 'find all descendant of a node of type source' do
      sources = @node.source_descendants
      sources.count.should eq 2
      sources.all?(&:source?).should be_true
    end
  end
end
