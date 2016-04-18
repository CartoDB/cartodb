# encoding: UTF-8
require 'json'

class Carto::Analysis < ActiveRecord::Base
  belongs_to :visualization, class_name: Carto::Visualization
  belongs_to :user, class_name: Carto::User

  def self.find_by_natural_id(visualization_id, natural_id)
    analysis = find_by_sql(
      [
        "select id from analyses where visualization_id = :visualization_id and analysis_definition ->> 'id' = :natural_id",
        { visualization_id: visualization_id, natural_id: natural_id }
      ]
    ).first
    # Load all data
    analysis.reload if analysis
    analysis
  end

  def analysis_definition_json
    return nil unless analysis_definition
    JSON.parse(analysis_definition).deep_symbolize_keys
  end

  def analysis_definition_for_api
    filter_valid_properties(analysis_definition_json)
  end

  def analysis_definition_json=(analysis_definition)
    self.analysis_definition = analysis_definition.to_json
  end

  def natural_id
    pj = analysis_definition_json
    return nil unless pj
    pj[:id]
  end

  private

  # Analysis definition contains attributes not needed by Analysis API (see #7128).
  # This methods extract the needed ones.
  VALID_ANALYSIS_PROPERTIES = [:id, :type, :params].freeze

  def filter_valid_properties(definition)
    valid = definition.select { |property, _| VALID_ANALYSIS_PROPERTIES.include?(property) }
    if valid[:params] && valid[:params][:source]
      valid[:params][:source] = filter_valid_properties(valid[:params][:source])
    end
    valid
  end
end
