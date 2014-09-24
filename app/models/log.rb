# encoding: utf-8

module CartoDB
  class Log < Sequel::Model

    ENTRY_FORMAT = "%s: %s\n"

    TYPE_DATA_IMPORT     = 'import'
    TYPE_SYNCHRONIZATION = 'sync'

    # @param id Numeric
    # @param type String
    # @param user_id String (uuid)
    # @param created_at DateTime
    # @param updated_at DateTime
    # @param entries String

    def append(content, timestamp = Time.now.utc)
      self.entries = '' if self.entries.nil?
      self.entries << ENTRY_FORMAT % [ timestamp, content ]
      save
    end

    def validate
      super
      errors.add(:type, 'unsupported type') unless \
        self.type == TYPE_DATA_IMPORT || self.type == TYPE_SYNCHRONIZATION
    end

    def before_save
      super
      self.updated_at = Time.now
    end

  end
end