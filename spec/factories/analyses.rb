require_relative '../../app/models/carto/analysis'
require_dependency 'carto/uuidhelper'

FactoryGirl.define do
  factory :source_analysis, class: Carto::Analysis do

    params do %(
      {
        "id": "#{String.random(5)}",
        "type": "source",
        "query": "select * from subway_stops"
      }
    )
    end

    factory :analysis, class: Carto::Analysis do
      created_at { Time.now }
      updated_at { Time.now }
    end
  end
end
