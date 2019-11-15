require 'spec_helper_min'

module Carto
  describe 'Forms definition' do
    let(:production_forms_definition) do
      {
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
        },
        "blending" => "none",
        "aggregation" => {},
        "labels" => {
          "enabled" => false,
          "attribute" => nil,
          "font" => "DejaVu Sans Book",
          "fill" => {
            "size" => {
              "fixed" => 10
            },
            "color" => {
              "fixed" => "#FFFFFF",
              "opacity" => 1
            }
          },
          "halo" => {
            "size" => {
              "fixed" => 1
            },
            "color" => {
              "fixed" => "#6F808D",
              "opacity" => 1
            }
          },
          "offset" => -10,
          "overlap" => true,
          "placement" => "point"
        }
      }
    end

    it 'default has stayed the same' do
      file_path = Carto::Form::DEFAULT_FORMS_DEFINITION_LOCATION

      Carto::Definition.instance.load_from_file(file_path).should eq production_forms_definition
    end
  end
end
