# encoding: utf-8

require 'json'
require_relative './carto_json_serializer'

class Carto::State < ActiveRecord::Base
  serialize :json, ::Carto::CartoJsonSymbolizerSerializer
  validates :json, carto_json_symbolizer: true

  after_initialize :ensure_json

  def self.columns
    super.reject { |c| ['user_id', 'visualization_id'].include?(c.name) }
  end

  private

  def ensure_json
    self.json ||= Hash.new
  end
end
