# encoding: utf-8

class Carto::Log < ActiveRecord::Base

  has_one :data_import, class_name: Carto::DataImport

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

  def append(line, truncate = true, timestamp = Time.now.utc)
    line.slice!(MAX_ENTRY_LENGTH..-1) if truncate

    entry = ENTRY_FORMAT % [ timestamp, line.slice(0..MAX_ENTRY_LENGTH) ]
    self.entries = "#{self.entries}#{entry}"
    self.save
  end

  def store
    self.save
  end

end
