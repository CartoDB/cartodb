# encoding: utf-8

class Carto::Log < ActiveRecord::Base
  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  def self.new_user_creation
    log = Carto::Log.new
    log.entries = 'New user creation'
    log.type = 'user_creation'
    log
  end

  def append(line, timestamp = Time.now.utc)
    self.entries = "#{self.entries}\n#{timestamp} #{line}"
    self.save
  end

end
