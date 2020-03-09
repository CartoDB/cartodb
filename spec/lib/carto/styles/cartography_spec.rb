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
                "fixed" => "#EE4D5A",
                "opacity" => 0.9
              }
            },
            "stroke" => {
              "size" => {
                "fixed" => 1
              },
              "color" => {
                "fixed" => "#FFFFFF",
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
                "fixed" => "#4CC8A3",
                "opacity" => 1
              }
            }
          },

          "polygon" => {
            "fill" => {
              "color" => {
                "fixed" => "#826DBA",
                "opacity" => 0.9
              }
            },
            "stroke" => {
              "size" => {
                "fixed" => 1
              },
              "color" => {
                "fixed" => "#FFFFFF",
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
