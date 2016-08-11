# encoding: UTF-8

require 'json'
require_relative './carto_json_serializer'

class Carto::State < ActiveRecord::Base
  belongs_to :visualization, class_name: Carto::Visualization
  belongs_to :user, class_name: Carto::User

  default_scope order('created_at DESC')

  serialize :json, ::Carto::CartoJsonSymbolizerSerializer

  validates :json, carto_json_symbolizer: true
  validates :visualization, :user, presence: true

  after_initialize :ensure_json

  def repopulate_widget_ids(widgets)
    return if widgets.empty?

    new_widgets_json = {}
    widgets_json = json[:widgets]
    widgets.each_with_index do |widget, index|
      new_widgets_json[widget.id.to_sym] = widgets_json[widgets_json.keys[index]]
    end

    new_json = json
    new_json[:widgets] = new_widgets_json

    update_attribute(:json, new_json)
  end

  private

  def ensure_json
    self.json ||= Hash.new
  end
end
