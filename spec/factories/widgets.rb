require_relative '../../app/models/carto/widget'

FactoryGirl.define do
  layer_id = "4d82e8df-f21b-4225-b776-61b1bdffde6c"
  json = %Q(
            {
              "type": "formula",
              "title": "Min population",
              "dataview": {
                "layer_id": "#{layer_id}",
                "type": "formula",
                "column": "pop_max",
                "operation": "min"
              }
            }
  )
  factory :widget, class: Carto::Widget do
    association :layer, factory: :carto_layer, id: layer_id
    order 1
    widget_json json
  end
end
