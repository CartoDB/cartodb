# encoding: UTF-8

require 'json'
require_relative './carto_json_serializer'

class Carto::State < ActiveRecord::Base
  serialize :json, ::Carto::CartoJsonSymbolizerSerializer
  validates :json, carto_json_symbolizer: true

  belongs_to :visualization, class_name: Carto::Visualization
  belongs_to :user, class_name: Carto::User

end
