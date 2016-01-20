# encoding: UTF-8

class Carto::Widget < ActiveRecord::Base
  belongs_to :layer, class_name: Carto::Layer

  def widget_json_json
    JSON.parse(widget_json).symbolize_keys
  end
end
