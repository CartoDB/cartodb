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
    JSON.parse(analysis_definition).symbolize_keys
  end

  def analysis_definition_json=(analysis_definition)
    self.analysis_definition = analysis_definition.to_json
  end

  def natural_id
    pj = analysis_definition_json
    return nil unless pj
    pj[:id]
  end
end
