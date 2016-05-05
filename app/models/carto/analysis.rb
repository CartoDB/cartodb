# encoding: UTF-8
require 'json'

class Carto::Analysis < ActiveRecord::Base
  serialize :analysis_definition, ::Carto::CartoJsonSerializer

  belongs_to :visualization, class_name: Carto::Visualization
  belongs_to :user, class_name: Carto::User

  validate :analysis_definition_must_be_json

  after_save :notify_map_change
  after_destroy :notify_map_change

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

  def analysis_definition_for_api
    filter_valid_properties(analysis_definition)
  end

  def natural_id
    pj = analysis_definition
    return nil unless pj
    pj[:id]
  end

  def map
    return nil unless visualization
    visualization.map
  end

  private

  def analysis_definition_must_be_json
    unless analysis_definition.nil? || analysis_definition.is_a?(Hash)
      errors.add(:analysis_definition, 'wrongly formatted (not a Hash or invalid JSON)')
    end
  end

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

  def notify_map_change
    map.notify_map_change if map
  end
end
