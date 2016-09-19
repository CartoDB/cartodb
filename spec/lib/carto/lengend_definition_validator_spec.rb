# encoding utf-8

require 'spec_helper_min'

module Carto
  describe LegendDefinitionValidator do
    before (:all) { @validator = Carto::LegendDefinitionValidator }
    after  (:all) { @validator = nil }

    it 'handles non defined schemas' do
      @validator.errors(:foo, '').should eq ['could not be validated']
    end
  end
end
