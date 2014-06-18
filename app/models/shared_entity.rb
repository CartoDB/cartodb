# encoding: utf-8

module CartoDB
  # A shared entity is just a relating model that joins entities (currently only visualizations)
  # shared but not owned by users.
  # Initially there's no need to include full objects and is kept as ids only on purpose
  class SharedEntity < Sequel::Model

    # @param user_id String (uuid)
    # @param entity_id String (uuid)
    # @param type String From TYPE_xxxx constants

    TYPE_VISUALIZATION = 'vis'

    def validate
      super
      validates_presence([:user_id, :entity_id, :type])
      validates_unique([:user_id, :entity_id])
      errors.add(:type, 'unsupported type') unless self.type == TYPE_VISUALIZATION
    end #validate

    def before_save
      super
      self.updated_at = Time.now
    end

  end

end