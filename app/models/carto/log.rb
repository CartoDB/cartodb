# encoding: utf-8

class Carto::Log < ActiveRecord::Base

  MAX_ENTRY_LENGTH = 256

  ENTRY_POSTFIX = "\n"
  ENTRY_FORMAT = "%s: %s#{ENTRY_POSTFIX}"

  TYPE_USER_CREATION   = 'user_creation'

  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  def self.new_user_creation
    log = Carto::Log.new
    log.entries = 'New user creation'
    log.type = TYPE_USER_CREATION
    log
  end

  def append(line, timestamp = Time.now.utc)
    entry = ENTRY_FORMAT % [ timestamp, line.slice(0..MAX_ENTRY_LENGTH) ]
    self.entries = "#{self.entries}#{entry}"
    self.save
  end

end
