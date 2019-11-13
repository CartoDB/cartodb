require 'json'
require_relative './carto_json_serializer'

module Carto
  class Snapshot < ActiveRecord::Base
    belongs_to :visualization, class_name: Carto::Visualization
    belongs_to :user, class_name: Carto::User

    default_scope { order('created_at DESC') }

    serialize :state, ::Carto::CartoJsonSymbolizerSerializer
    validates :state, carto_json_symbolizer: true
    validates :visualization, :user, presence: true
  end
end
