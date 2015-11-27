require_relative '../../app/models/carto/bi_visualization'

FactoryGirl.define do
  factory :bi_visualization, class: Carto::BiVisualization do
    viz_json '{ "a_key": "a_value" }'
    association :bi_dataset, factory: :bi_dataset
  end
end
