require_relative '../../app/models/carto/analysis'
require_dependency 'carto/uuidhelper'
require 'helpers/random_names_helper'

include RandomNamesHelper

FactoryGirl.define do
  factory :source_analysis, class: Carto::Analysis do

    analysis_definition do
      %(
        {
          "id": "#{random_string}",
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
