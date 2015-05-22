# coding: UTF-8
require_relative '../../spec_helper'

describe Carto::Visualization do

  describe '#tags=' do

    it 'should not set blank tags' do
      vis = Carto::Visualization.new
      vis.tags = ["tag1", " ", ""]

      vis.tags.should eq ["tag1"]
    end
  end
end
