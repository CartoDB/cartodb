require 'active_record'

module Carto
  class Overlay < ActiveRecord::Base
    # INFO: disable ActiveRecord inheritance column
    self.inheritance_column = :_type

    after_initialize do |overlay|
      self.options = ::JSON.parse(self.options)
    end

  end
end
