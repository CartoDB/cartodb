# encoding utf-8

require 'spec_helper_min'

module Carto
  describe Form do
    it 'return point form if inexisting type is specified' do
      form = Carto::Form.new('patata')

      form.to_hash.should eq Carto::Form.new('st_point').to_hash
    end
  end
end
