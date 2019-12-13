module Carto
  class LayersUser < ApplicationRecord
    belongs_to :layer
    belongs_to :user
  end
end
