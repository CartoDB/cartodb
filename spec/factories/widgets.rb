require_relative '../../app/models/carto/widget'

FactoryBot.define do
  factory :widget, class: Carto::Widget do
    transient do
      column_name { 'pop_max' }
    end
    order { 1 }
    type { 'formula' }
    title { 'The Title' }
    source_id { 'a0'}
    options do
      {
        type: "formula",
        column: column_name,
        operation: "min"
      }
    end
    style do
      {
        widget_style: {
          definition: {
            fill: { color: { fixed: '#FFF' } }
          }
        },
        auto_style: {
          definition: {
            fill: { color: { fixed: '#FFF' } }
          }
        }
      }
    end
    created_at { Time.now }
    updated_at { Time.now }

    factory :widget_with_layer do
      association :layer, factory: :carto_layer
    end
  end
end
