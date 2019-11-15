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

    describe('#with templates') do
      let(:old_legend_with_template) do
        {
          "show_title" => false,
          "title" => "",
          "template" => "<h1>Manolo Escobar</h1>",
          "visible" => true,
          "items" => []
        }
      end

      it 'should migrate to custom for type custom' do
        @old_legend = old_legend_with_template.merge(type: 'custom')
      end

      it 'should migrate to custom for type category' do
        @old_legend = old_legend_with_template.merge(type: 'category')
      end

      it 'should migrate to custom for type bubble' do
        @old_legend = old_legend_with_template.merge(type: 'bubble')
      end

      it 'should migrate to custom for type choropleth' do
        @old_legend = old_legend_with_template.merge(type: 'choropleth')
      end

      it 'should migrate to custom for type intensity' do
        @old_legend = old_legend_with_template.merge(type: 'intensity')
      end

      it 'should migrate to custom for type density' do
        @old_legend = old_legend_with_template.merge(type: 'density')
      end

      after(:each) do
        new_legend = Carto::LegendMigrator.new(@layer.id, @old_legend).build

        new_legend.definition[:html].should include('<h1>Manolo Escobar</h1>')
        new_legend.type.should eq 'custom'
      end
    end

    describe('#custom types') do
      describe('#with categories') do
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
                "value" => "super.png"
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
                "value" => "duper.png"
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
                "value" => "url(http://com.cartodb.users-assets.production.s3.amazonaws.com/superduper.png)",
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

          category_keys = new_legend.definition[:categories]
                                    .map(&:keys)
                                    .flatten
                                    .uniq

          category_keys.should include(:title)
          category_keys.should include(:color)
          category_keys.should include(:icon)

          if @old_legend['type'] == 'custom'
            new_legend.definition[:categories].map { |category| category[:icon] }.each do |icon|
              unless icon.blank?
                icon.should include("https://s3.amazonaws.com/com.cartodb.users-assets.production/superduper.png")
                icon.should_not include("url(")
              end
            end
          end
        end
      end

      describe('#with html') do
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

        it 'migrates old bubble with custom labels to new custom' do
          @old_legend = old_bubble_with_custom_labels
        end

        it 'migrates old custom with template to new custom' do
          @old_legend = old_custom
        end

        it 'migrates old bubble to new custom' do
          @old_legend = old_bubble
        end

        it 'migrates old choropleth to new custom' do
          @old_legend = old_choropleth
        end

        it 'migrates old density to new custom' do
          @old_legend = old_density
        end

        it 'migrates old density without labels to new custom' do
          truncated = old_density.dup
          truncated['items'].delete_at(0)
          truncated['items'].delete_at(0)

          @old_legend = truncated
        end

        it 'migrates old intensity to new custom' do
          @old_legend = old_intensity
        end

        it 'migrates old intensity without labels to new custom' do
          truncated = old_intensity.dup
          truncated['items'].delete_at(0)
          truncated['items'].delete_at(0)

          @old_legend = truncated
        end

        after(:each) do
          new_legend = Carto::LegendMigrator.new(@layer.id, @old_legend).build

          new_legend.type.should eq 'custom'
          new_legend.valid?.should be_true

          unless @old_legend['type'] == 'bubble' || @old_legend['type'] == 'custom'
            html = new_legend.definition[:html]

            # Result should have labels, colors, and icons somewhere in generated
            # html
            @old_legend['items'].map { |item| item['value'] }.each do |value|
              html.downcase.should include(value.to_s.downcase)
            end

            # No incomplete gradients allowed
            html.scan(/#(?:[0-9a-fA-F]{3}){1,2}/).size.should be >= 2
          end

          @old_legend = nil
        end
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
