# encoding: utf-8

require 'spec_helper_min'

describe Carto::Analysis do

  describe '#natural_id' do
    it 'returns nil if params has no id at the first level' do
      Carto::Analysis.new(params: nil).natural_id.should eq nil
      Carto::Analysis.new(params: '{}').natural_id.should eq nil
      Carto::Analysis.new(params: '{ "wadus": 1 }').natural_id.should eq nil
    end

    it 'returns id if params has id at the first level' do
      Carto::Analysis.new(params: '{ "id": "a1" }').natural_id.should eq 'a1'
    end
  end

end
