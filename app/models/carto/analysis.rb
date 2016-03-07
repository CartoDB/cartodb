# encoding: UTF-8

class Carto::Analysis < ActiveRecord::Base
  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  def params_json
    JSON.parse(params).symbolize_keys
  end
end
