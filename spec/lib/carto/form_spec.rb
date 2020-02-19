require 'spec_helper_min'

module Carto
  describe Form do
    let(:point_form) do
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

    let(:polygon_form) do
      {
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

    let(:line_form) do
      {
        "fill" => {},
        "stroke" => {
          "size" => {
            "fixed" => 1.5
          },
          "color" => {
            "fixed" => "#4CC8A3",
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

    it 'return point form if inexisting type is specified' do
      form = Carto::Form.new('geometry')

      form.to_hash.should eq point_form
    end

    it 'returns a correct line form' do
      form = Carto::Form.new('line')

      form.to_hash.should eq line_form
    end

    it 'returns a correct polygon form' do
      form = Carto::Form.new('polygon')

      form.to_hash.should eq polygon_form
    end

    it 'returns a correct point form' do
      form = Carto::Form.new('point')

      form.to_hash.should eq point_form
    end
  end
end
