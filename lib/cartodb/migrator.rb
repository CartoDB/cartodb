require_relative 'migrator/maps'
require_relative 'migrator/layers'

module Migrator
  include Migrator::Maps
  include Migrator::Layers
end
