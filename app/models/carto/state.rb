# encoding: UTF-8

require 'json'
require_relative './carto_json_serializer'

class Carto::State < ActiveRecord::Base
  serialize :json, ::Carto::CartoJsonSymbolizerSerializer
  validates :json, carto_json_symbolizer: true

  after_initialize :ensure_json

  private

  def ensure_json
    self.json ||= Hash.new
  end
end
