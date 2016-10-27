# encoding utf-8

require 'spec_helper_min'
require 'carto/legend_migrator'

module Carto
  describe LegendMigrator do
    before(:all) do
      @layer = Carto::Layer.create(kind: 'carto')
    end

    after(:all) do
      @layer.destroy
    end

    describe('#custom types') do
      let(:old_category) do
        {
          "type" => "category",
          "show_title" => false,
          "title" => "",
          "template" => "",
          "visible" => true,
          "items" => [
            {
              "name" => 0,
              "visible" => true,
              "value" => "#A6CEE3"
            },
            {
              "name" => 1350,
              "visible" => true,
              "value" => "#1F78B4"
            },
            {
              "name" => 1440,
              "visible" => true,
              "value" => "#B2DF8A"
            },
            {
              "name" => 1800,
              "visible" => true,
              "value" => "#33A02C"
            },
            {
              "name" => 2250,
              "visible" => true,
              "value" => "#FB9A99"
            },
            {
              "name" => 2700,
              "visible" => true,
              "value" => "#E31A1C"
            },
            {
              "name" => 4500,
              "visible" => true,
              "value" => "#FDBF6F"
            },
            {
              "name" => 450000,
              "visible" => true,
              "value" => "#FF7F00"
            },
            {
              "name" => 900,
              "visible" => true,
              "value" => "#CAB2D6"
            },
            {
              "name" => 90000,
              "visible" => true,
              "value" => "#6A3D9A"
            },
            {
              "name" => "Others",
              "visible" => true,
              "value" => "#DDDDDD"
            }
          ]
        }
      end

      let(:old_custom) do
        {
          "type" => "custom",
          "show_title" => true,
          "title" => "",
          "template" => "",
          "visible" => true,
          "items" => [
            {
              "name" => "preta",
              "visible" => true,
              "value" => "#41006D",
              "sync" => true
            },
            {
              "name" => "Untitled",
              "visible" => true,
              "value" => "#3E7BB6",
              "sync" => true
            },
            {
              "name" => "patata",
              "visible" => true,
              "value" => "#cccccc",
              "sync" => true
            },
            {
              "name" => "Untitled",
              "visible" => true,
              "value" => "#cccccc",
              "sync" => true
            }
          ]
        }
      end

      it 'omits badly formatted colors' do
        truncated = old_category.dup
        truncated['items'].first['value'] = '#fatal#fatal#fatal'

        @old_legend = truncated
      end

      it 'migrates old category to new custom' do
        @old_legend = old_category
      end

      it 'migrates old custom to new custom with no template' do
        @old_legend = old_custom
      end

      after(:each) do
        new_legend = Carto::LegendMigrator.new(@layer.id, @old_legend).build

        new_legend.type.should eq 'custom'
        new_legend.valid?.should be_true
      end
    end

    describe('#html types') do
      let(:old_custom) do
        {
          "type" => "custom",
          "show_title" => true,
          "title" => "",
          "template" => "<h1>Manolo Escobar</h1>",
          "visible" => true,
          "items" => []
        }
      end

      let(:old_bubble) do
        {
          "type" => "bubble",
          "show_title" => false,
          "title" => "",
          "template" => "",
          "visible" => true,
          "items" => [
            {
              "name" => "Left label",
              "visible" => true,
              "value" => 787.5,
              "legend_type" => "bubble",
              "type" => "text",
              "sync" => false
            },
            {
              "name" => "Right Label",
              "visible" => true,
              "value" => 6273765,
              "legend_type" => "bubble",
              "type" => "text",
              "sync" => false
            },
            {
              "name" => "Color",
              "visible" => true,
              "value" => "#FF5C00",
              "type" => "color"
            }
          ]
        }
      end

      let(:old_bubble_with_custom_labels) do
        {
          "type" => "bubble",
          "show_title" => false,
          "title" => "",
          "template" => "",
          "visible" => true,
          "items" => [
            {
              "name" => "Left label",
              "visible" => true,
              "value" => "few",
              "legend_type" => "bubble",
              "type" => "text",
              "sync" => false
            },
            {
              "name" => "Right Label",
              "visible" => true,
              "value" => "many",
              "legend_type" => "bubble",
              "type" => "text",
              "sync" => false
            },
            {
              "name" => "Color",
              "visible" => true,
              "value" => "#FF5C00",
              "type" => "color"
            }
          ]
        }
      end

      let(:old_choropleth) do
        {
          "type" => "choropleth",
          "show_title" => false,
          "title" => "",
          "template" => "",
          "visible" => true,
          "items" => [
            {
              "name" => "Left label",
              "visible" => true, "value" => "1350.00",
              "type" => "text"
            },
            {
              "name" => "Right label",
              "visible" => true,
              "value" => "6273765.00",
              "type" => "text"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#FFFFB2",
              "type" => "color"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#FED976",
              "type" => "color"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#FEB24C",
              "type" => "color"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#FD8D3C",
              "type" => "color"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#FC4E2A",
              "type" => "color"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#E31A1C",
              "type" => "color"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#B10026",
              "type" => "color"
            }
          ]
        }
      end

      let(:old_density) do
        {
          "type" => "density",
          "show_title" => false,
          "title" => "",
          "template" => "",
          "visible" => true,
          "items" => [
            {
              "name" => "Less",
              "visible" => true,
              "value" => "less",
              "legend_type" => "density",
              "type" => "text",
              "sync" => true
            },
            {
              "name" => "More",
              "visible" => true,
              "value" => "more",
              "legend_type" => "density",
              "type" => "text",
              "sync" => true
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#FFFFB2",
              "type" => "color"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#FECC5C",
              "type" => "color"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#FD8D3C",
              "type" => "color"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#F03B20",
              "type" => "color"
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#BD0026",
              "type" => "color"
            }
          ]
        }
      end

      let(:old_intensity) do
        {
          "type" => "intensity",
          "show_title" => false,
          "title" => "",
          "template" => "",
          "visible" => true,
          "items" => [
            {
              "name" => "Left label",
              "visible" => true,
              "value" => "Less",
              "legend_type" => "intensity",
              "type" => "text",
              "sync" => true
            },
            {
              "name" => "Right label",
              "visible" => true,
              "value" => "More",
              "legend_type" => "intensity",
              "type" => "text",
              "sync" => true
            },
            {
              "name" => "Color",
              "visible" => true, "value" => "#FFCC00",
              "type" => "color"
            }
          ]
        }
      end

      it 'omits badly formatted colors' do
        truncated = old_intensity.dup
        truncated['items'].last['value'] = '#fatal#fatal#fatal'

        @old_legend = truncated
      end

      it 'migrates old custom with template to new html' do
        @old_legend = old_custom
      end

      it 'migrates old bubble to new html' do
        @old_legend = old_bubble
      end

      it 'migrates old bubble with custom labels to new html' do
        @old_legend = old_bubble_with_custom_labels
      end

      it 'migrates old choropleth to new html' do
        @old_legend = old_choropleth
      end

      it 'migrates old density to new html' do
        @old_legend = old_density
      end

      it 'migrates old density without labels to new html' do
        truncated = old_density.dup
        truncated['items'].delete_at(0)
        truncated['items'].delete_at(0)

        @old_legend = truncated
      end

      it 'migrates old intensity to new html' do
        @old_legend = old_intensity
      end

      it 'migrates old intensity without labels to new html' do
        truncated = old_intensity.dup
        truncated['items'].delete_at(0)
        truncated['items'].delete_at(0)

        @old_legend = truncated
      end

      after(:each) do
        new_legend = Carto::LegendMigrator.new(@layer.id, @old_legend).build
        @old_legend = nil

        new_legend.type.should eq 'html'
        new_legend.valid?.should be_true
      end
    end

    describe('#bad legends') do
      let(:bad_legend) do
        {
          patata_pochada: 'buena',
          pero: 'mejor que pochada',
          frita: 'a que si!'
        }
      end

      it 'returns invalid legends for invalid definitions' do
        migrator = Carto::LegendMigrator.new(@layer.id, bad_legend)

        migrator.build.should_not be_valid
      end
    end
  end
end
