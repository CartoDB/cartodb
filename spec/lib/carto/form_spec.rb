# encoding utf-8

require 'spec_helper_min'

module Carto
  describe Form do
    it 'handles inexistent geometry types' do
      expect { Carto::Form.new('patata') }.to raise_error('Carto::Forms: No form for geometry type: \'patata\'')
    end
  end
end
