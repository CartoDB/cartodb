# encoding: utf-8

require 'spec_helper_min'

module Carto
  module Styles
    describe Line do
      describe '#default' do
        let(:production_default_line_cartocss) do
          "#layer {\n"\
          "  line-color: #4CC8A3;\n"\
          "  line-width: 1.5;\n"\
          "  line-opacity: 1;\n"\
          "}"
        end

        it 'has stayed the same' do
          current_default_line_cartocss = Carto::Styles::Line.new.to_cartocss

          current_default_line_cartocss.should eq production_default_line_cartocss
        end
      end
    end
  end
end
