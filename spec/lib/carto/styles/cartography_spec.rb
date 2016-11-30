# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe 'Default cartography' do
    let(:production_default_cartography) do
      {
        "simple" => {
          "point" => {
            "fill" => {
              "size" => {
                "fixed" => 7
              },
              "color" => {
                "fixed" => "#FFB927",
                "opacity" => 0.9
              }
            },
            "stroke" => {
              "size" => {
                "fixed" => 1
              },
              "color" => {
                "fixed" => "#FFF",
                "opacity" => 1
              }
            }
          },

          "line" => {
            "fill" => {},
            "stroke" => {
              "size" => {
                "fixed" => 1.5
              },
              "color" => {
                "fixed" => "#3EBCAE",
                "opacity" => 1
              }
            }
          },

          "polygon" => {
            "fill" => {
              "color" => {
                "fixed" => "#374C70",
                "opacity" => 0.9
              }
            },
            "stroke" => {
              "size" => {
                "fixed" => 1
              },
              "color" => {
                "fixed" => "#FFF",
                "opacity" => 0.5
              }
            }
          }
        }
      }
    end

    it 'has stayed the same' do
      cartography_file_path = Carto::Styles::Style::CARTOGRAPHY_DEFINITION_LOCATION
      cartography = Carto::Definition.instance.load_from_file(cartography_file_path)

      cartography.should eq production_default_cartography
    end
  end
end
