require_relative '../../app/models/carto/analysis'
require_dependency 'carto/uuidhelper'
require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do
  SOURCE_ANALYSIS_DEFINITION = {
                                  "id": "#{unique_string}",
                                  "type": "source",
                                  "params": {
                                    "query": "select * from subway_stops"
                                  }
                                }.freeze

  factory :source_analysis, class: Carto::Analysis do

    analysis_definition { SOURCE_ANALYSIS_DEFINITION }

    factory :analysis, class: Carto::Analysis do
      created_at { Time.now }
      updated_at { Time.now }
    end
  end

  factory :analysis_with_source, class: Carto::Analysis do
    analysis_definition do
      {
        "id": "#{unique_string}",
        "type": "buffer",
        "params": {
          "source": SOURCE_ANALYSIS_DEFINITION
        }
      }
    end
  end
end
