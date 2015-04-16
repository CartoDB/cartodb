require 'active_record'

class Carto::Overlay < ActiveRecord::Base
  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type
end
