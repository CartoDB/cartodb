# encoding: utf-8

require 'active_record'

module Carto
  class LayersMap < ActiveRecord::Base

    belongs_to :layer, class_name: Carto::Layer
    belongs_to :map, class_name: Carto::Map

  end
end
