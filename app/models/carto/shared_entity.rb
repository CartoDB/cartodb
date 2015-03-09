require 'active_record'
require_relative '../shared_entity'

module Carto

  class SharedEntity < ActiveRecord::Base
    ENTITY_TYPE_VISUALIZATION = CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION

    scope :shared_visualizations, where(:entity_type => ENTITY_TYPE_VISUALIZATION)

  end

end
