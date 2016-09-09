# encoding utf-8

require 'spec_helper_min'

module Carto
  module CartoCSS
    describe Cartography do
      describe '#default' do
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
          Carto::CartoCSS::Cartography.new.to_hash.should eq production_default_cartography
        end
      end
    end
  end
end
