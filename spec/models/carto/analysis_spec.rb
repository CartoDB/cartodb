# encoding: utf-8

require 'spec_helper_min'

describe Carto::Analysis do

  describe '#natural_id' do
    it 'returns nil if analysis definition has no id at the first level' do
      Carto::Analysis.new(analysis_definition: nil).natural_id.should eq nil
      Carto::Analysis.new(analysis_definition: '{}').natural_id.should eq nil
      Carto::Analysis.new(analysis_definition: '{ "wadus": 1 }').natural_id.should eq nil
    end

    it 'returns id if analysis definition has id at the first level' do
      Carto::Analysis.new(analysis_definition: '{ "id": "a1" }').natural_id.should eq 'a1'
    end
  end

  describe '#analysis_definition_json' do
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
      }.to_json
    end

    let(:nested_definition_with_options) do
      {
        id: "a1",
        type: "buffer",
        params: {
          source: JSON.parse(definition_with_options)
        }
      }.to_json
    end

    it 'removes options from analysis definition' do
      analysis = Carto::Analysis.new(analysis_definition: definition_with_options)
      analysis.analysis_definition_json.include?(:options).should be_true
      analysis.analysis_definition_for_api.include?(:options).should be_false
    end

    it 'removes options from nested source analysis' do
      analysis = Carto::Analysis.new(analysis_definition: nested_definition_with_options)

      nested_analysis = analysis.analysis_definition_for_api[:params][:source]
      nested_analysis.include?(:options).should be_false
    end
  end

end
