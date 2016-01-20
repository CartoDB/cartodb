require_relative '../../app/models/carto/widget'

FactoryGirl.define do
  factory :widget, class: Carto::Widget do
    order 1
    widget_json {
      %Q(
            {
              "type": "formula",
              "title": "Min population",
              "dataview": {
                "layer_id": "#{layer.id}",
                "type": "formula",
                "column": "pop_max",
                "operation": "min"
              }
            }
      )
    }

    factory :widget_with_layer do
      association :layer, factory: :carto_layer
    end
  end
end
