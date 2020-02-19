require 'spec_helper_min'

module Carto
  module Styles
    describe Polygon do
      describe '#default' do
        let(:production_default_polygon_cartocss) do
          "#layer {\n"\
          "  polygon-fill: #826DBA;\n"\
          "  polygon-opacity: 0.9;\n"\
          "  ::outline {\n"\
          "    line-color: #FFFFFF;\n"\
          "    line-width: 1;\n"\
          "    line-opacity: 0.5;\n"\
          "  }\n"\
          "}"
        end

        it 'has stayed the same' do
          current_default_polygon_cartocss = Carto::Styles::Polygon.new.to_cartocss

          current_default_polygon_cartocss.should eq production_default_polygon_cartocss
        end
      end
    end
  end
end
