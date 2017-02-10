module Carto
  module SequelCompatibleModel
    # Implements Sequel function by calling its ActiveRecord counterparts
    def new?
      new_record?
    end
  end
end
