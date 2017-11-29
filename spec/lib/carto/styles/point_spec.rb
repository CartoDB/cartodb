# encoding: utf-8

require 'spec_helper_min'

module Carto
  module Styles
    describe Point do
      describe '#default' do
        let(:production_default_point_cartocss) do
          "#layer {\n"\
          "  ::outline {\n"\
          "    dot-fill: #FFFFFF;\n"\
          "    dot-width: 8;\n"\
          "    dot-opacity: 1;\n"\
          "  }\n"\
          "  dot-width: 7;\n"\
          "  dot-fill: #EE4D5A;\n"\
          "  dot-opacity: 0.9;\n"\
          "}"
        end

        it 'has stayed the same' do
          current_default_point_cartocss = Carto::Styles::Point.new.to_cartocss

          current_default_point_cartocss.should eq production_default_point_cartocss
        end
      end
    end
  end
end
