# encoding: utf-8

require 'spec_helper_min'

module Carto
  module Styles
    describe Point do
      describe '#default' do
        let(:production_default_point_cartocss) do
          "#layer {\n"\
          "  marker-width: 7;\n"\
          "  marker-fill: #EE4D5A;\n"\
          "  marker-fill-opacity: 0.9;\n"\
          "  marker-line-color: #FFFFFF;\n"\
          "  marker-line-width: 1;\n"\
          "  marker-line-opacity: 1;\n"\
          "  marker-placement: point;\n"\
          "  marker-type: ellipse;\n"\
          "  marker-allow-overlap: true;\n"\
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
