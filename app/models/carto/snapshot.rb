# encoding utf-8

require 'json'
require_relative './carto_json_serializer'

module Carto
  class Snapshot
    default_scope order('created_at DESC')

    serialize :state, ::Carto::CartoJsonSymbolizerSerializer
    validates :state, carto_json_symbolizer: true
  end
end
