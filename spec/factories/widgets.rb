require_relative '../../app/models/carto/widget'

FactoryGirl.define do
  factory :widget, class: Carto::Widget do
    ignore do
      column_name 'pop_max'
    end
    order 1
    type 'formula'
    title 'The Title'
    options do
      {
        type: "formula",
        column: column_name,
        operation: "min"
      }
    end
    created_at { Time.now }
    updated_at { Time.now }

    factory :widget_with_layer do
      association :layer, factory: :carto_layer
    end
  end
end
