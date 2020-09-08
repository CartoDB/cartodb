module Carto::ActiveRecordCompatibility
  # This module is meant to contain methods present in ActiveRecord
  # models but not in Sequel, in order to provide a light
  # compatibiltiy layer

  def new_record?
    return new?
  end
end
