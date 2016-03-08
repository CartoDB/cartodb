# encoding: UTF-8

class Carto::Analysis < ActiveRecord::Base
  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  def self.find_by_natural_id(visualization_id, natural_id)
    analysis = find_by_sql(
      [
        "select id from analyses where visualization_id = :visualization_id and params ->> 'id' = :natural_id",
        { visualization_id: visualization_id, natural_id: natural_id }
      ]
    ).first
    # Load all data
    analysis.reload if analysis
    analysis
  end

  def params_json
    return nil unless params
    JSON.parse(params).symbolize_keys
  end

  def natural_id
    pj = params_json
    return nil unless pj
    pj[:id]
  end
end
