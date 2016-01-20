require_relative '../../app/models/carto/widget'

FactoryGirl.define do
  json = %q(
            {
              "type": "formula",
              "title": "Min population",
              "dataview": {
                "layer_id": "4d82e8df-f21b-4225-b776-61b1bdffde6c",
                "type": "formula",
                "column": "pop_max",
                "operation": "min"
              }
            }
  )
  factory :widget, class: Carto::Widget do
    association :layer, factory: :carto_layer
    order 1
    widget_json json
  end
end
