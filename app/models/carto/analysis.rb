# encoding: UTF-8

class Carto::Analysis < ActiveRecord::Base
  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  belongs_to :visualization, class_name: Carto::Visualization

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

  def natural_id
    pj = analysis_definition_json
    return nil unless pj
    pj[:id]
  end
end
