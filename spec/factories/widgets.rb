require_relative '../../app/models/carto/widget'

FactoryGirl.define do
  factory :widget, class: Carto::Widget do
    order 1
    type 'formula'
    title 'The Title'
    options {
      {
        type: "formula",
        column: "pop_max",
        operation: "min"
      }
    }
    created_at { Time.now }
    updated_at { Time.now }

    factory :widget_with_layer do
      association :layer, factory: :carto_layer
    end
  end
end
