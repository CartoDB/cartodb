# encoding utf-8

module Carto
  describe LegendMigrator do
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
            "visible" => true, "value" => "#41006D",
            "sync" => true
          },
          {
            "name" => "Untitled",
            "visible" => true, "value" => "#3E7BB6",
            "sync" => true
          },
          {
            "name" => "patata",
            "visible" => true, "value" => "#cccccc",
            "sync" => true
          },
          {
            "name" => "Untitled",
            "visible" => true, "value" => "#cccccc",
            "sync" => true
          }
        ]
      }
    end

    let(:old_intensity) do
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
  end
end
