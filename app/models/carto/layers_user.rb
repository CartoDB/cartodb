module Carto
  class LayersUser < ActiveRecord::Base
    belongs_to :layer
    belongs_to :user
  end
end
