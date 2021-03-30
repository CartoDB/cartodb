require_relative '../../app/models/carto/analysis'
require_dependency 'carto/uuidhelper'
require 'helpers/unique_names_helper'

include UniqueNamesHelper

module AnalysisFactoryHelper
  def self.source_analysis_for_table(table_name, query)
    query ||= "select * from #{table_name}"
    {
      id:      unique_string,
      type:    'source',
      params:  { query: query },
      options: { table_name: table_name }
    }
  end
end

FactoryBot.define do
  factory :source_analysis, class: 'Carto::Analysis' do
    transient do
      source_table { 'subway_stops' }
      query { nil }
    end

    analysis_definition { AnalysisFactoryHelper.source_analysis_for_table(source_table, query) }

    factory :analysis, class: 'Carto::Analysis' do
      created_at { Time.now }
      updated_at { Time.now }
    end
  end

  factory :analysis_with_source, class: 'Carto::Analysis' do
    transient do
      source_table { 'subway_stops' }
      query { nil }
    end

    analysis_definition do
      {
        id: unique_string,
        type: "buffer",
        params: {
          source: AnalysisFactoryHelper.source_analysis_for_table(source_table, query)
        }
      }
    end
  end

  factory :analysis_point_in_polygon, class: 'Carto::Analysis' do
    transient do
      source_table { 'subway_stops' }
      source_query { nil }
      target_table { 'districts' }
      target_query { nil }
    end

    analysis_definition do
      {
        id: unique_string,
        type: "intersection",
        params: {
          source: AnalysisFactoryHelper.source_analysis_for_table(source_table, source_query),
          target: AnalysisFactoryHelper.source_analysis_for_table(target_table, target_query)
        }
      }
    end
  end
end
