require_relative '../../app/models/carto/analysis'

FactoryGirl.define do
  factory :source_analysis, class: Carto::Analysis do
    params %Q(
      {
        "type": "source",
        "query": "select * from subway_stops"
      }
    )

    factory :analysis, class: Carto::Analysis do
      created_at { Time.now }
      updated_at { Time.now }
    end
  end
end
