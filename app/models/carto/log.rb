# encoding: utf-8

class Carto::Log < ActiveRecord::Base

  has_one :data_import, class_name: Carto::DataImport, foreign_key: :logger

  MAX_ENTRY_LENGTH = 256

  ENTRY_POSTFIX = "\n"
  ENTRY_FORMAT = "%s: %s#{ENTRY_POSTFIX}"

  TYPE_USER_CREATION = 'user_creation'.freeze

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

  def append_exception(line, exception:, truncate: true, timestamp: Time.now.utc)
    append("#{line}: #{exception_to_string(exception)}", truncate, timestamp)
  end

  def store
    self.save
  end

  def logger
    @logger ||= LogWriter.new(self)
  end

  private

  def exception_to_string(error)
    error.inspect + "\n" + error.backtrace.join("\n") + "\n"
  end

  # A logger implementation that logs to this Carto::Log
  class LogWriter < ::Logger
    SAVE_BLOCK = 10 # Save the changes to DB every X lines

    def initialize(log)
      @log = log
      @stored_entries = 0
    end

    def add(_severity, _progname = nil, message = nil)
      if message.present?
        @log.entries += message.to_s + "\n"
        @stored_entries += 1
        if @stored_entries >= SAVE_BLOCK
          @stored_entries = 0
          @log.save
        end
      end
    end

    def close
      @log.save
    end
  end
end
