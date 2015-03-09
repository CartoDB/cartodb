require 'active_record'

module Carto

  class Visualization < ActiveRecord::Base
    self.inheritance_column = :_type

    belongs_to :user, inverse_of: :visualizations
    # INFO: we can't map SharedEntity because visualizations.id and shared_entities.entity_id have different types
  end

end
