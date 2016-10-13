# encoding utf-8

require 'spec_helper_min'

module Carto
  module Styles
    describe Geometry do
      describe '#default' do
        let(:prod_default_geometry_cartocss) do
          "#layer['mapnik::geometry_type'=1] {\n"\
          "  marker-width: 7;\n"\
          "  marker-fill: #FFB927;\n"\
          "  marker-fill-opacity: 0.9;\n"\
          "  marker-line-width: 1;\n"\
          "  marker-line-color: #FFF;\n"\
          "  marker-line-opacity: 1;\n"\
          "  marker-placement: point;\n"\
          "  marker-type: ellipse;\n"\
          "  marker-allow-overlap: true;\n"\
          "}\n"\
          "#layer['mapnik::geometry_type'=2] {\n"\
          "  line-width: 1.5;\n"\
          "  line-color: #3EBCAE;\n"\
          "  line-opacity: 1;\n"\
          "}\n"\
          "#layer['mapnik::geometry_type'=3] {\n"\
          "  polygon-fill: #374C70;\n"\
          "  polygon-opacity: 0.9;\n"\
          "  polygon-gamma: 0.5;\n"\
          "  line-width: 1;\n"\
          "  line-color: #FFF;\n"\
          "  line-opacity: 0.5;\n"\
          "  line-comp-op: soft-light;\n"\
          "}"
        end

        it 'has stayed the same' do
          default_point_cartocss = Carto::Styles::Geometry.new.to_cartocss

          default_point_cartocss.should eq prod_default_geometry_cartocss
        end
      end
    end
  end
end
