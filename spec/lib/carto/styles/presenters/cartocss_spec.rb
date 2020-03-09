require 'spec_helper_min'

module Carto
  module Styles
    module Presenters
      describe CartoCSS do
        before (:all) { @presenter_class = Carto::Styles::Presenters::CartoCSS }
        after  (:all) { @presenter_class = nil }

        let(:empty_cartocss) do
          "#layer {\n"\
          "\n"\
          "}"
        end

        let(:cartocss_array) do
          ["color-camisa: blanco;",
           "talla-zapatos: 46;",
           "altura: 186cm;"]
        end

        let(:cartocss) do
          "#layer {\n"\
          "  color-camisa: blanco;\n"\
          "  talla-zapatos: 46;\n"\
          "  altura: 186cm;\n"\
          "}"
        end

        it 'returns empty cartocss when no params specified' do
          @presenter_class.new.to_s.should eq empty_cartocss
        end

        it 'returns empty cartocss when empty cartocss array is provided' do
          @presenter_class.new(cartocss_array: []).to_s.should eq empty_cartocss
        end

        it 'respects provided class name' do
          @presenter_class.new(class_name: 'manolo').to_s.should include("#manolo {\n")
        end

        it 'returns properties formatted' do
          @presenter_class.new(cartocss_array: cartocss_array).to_s.should eq cartocss
        end
      end
    end
  end
end
