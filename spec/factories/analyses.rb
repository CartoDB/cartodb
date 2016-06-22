require_relative '../../app/models/carto/analysis'
require_dependency 'carto/uuidhelper'
require 'helpers/unique_names_helper'

include UniqueNamesHelper

module AnalysisFactoryHelper
  def self.source_analysis_for_table(table_name)
    {
      id:      unique_string,
      type:    'source',
      params:  { query: "select * from #{table_name}" },
      options: { table_name: table_name }
    }
  end
end

FactoryGirl.define do
  factory :source_analysis, class: Carto::Analysis do
    ignore do
      source_table 'subway_stops'
    end

    analysis_definition { AnalysisFactoryHelper.source_analysis_for_table(source_table) }

    factory :analysis, class: Carto::Analysis do
      created_at { Time.now }
      updated_at { Time.now }
    end
  end

  factory :analysis_with_source, class: Carto::Analysis do
    ignore do
      source_table 'subway_stops'
    end

    analysis_definition do
      {
        id: unique_string,
        type: "buffer",
        params: {
          source: AnalysisFactoryHelper.source_analysis_for_table(source_table)
        }
      }
    end
  end
end
