# encoding: UTF-8

require 'json'
require_relative './carto_json_serializer'

class Carto::State < ActiveRecord::Base
  belongs_to :visualization, class_name: Carto::Visualization
  belongs_to :user, class_name: Carto::User

  STATE_CHANNELS = ['public', 'private'].freeze

  serialize :json, ::Carto::CartoJsonSymbolizerSerializer

  validates :json, carto_json_symbolizer: true
  validates :channel, in: STATE_CHANNELS
end
