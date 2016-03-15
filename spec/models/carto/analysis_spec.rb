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

end
