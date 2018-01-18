# encoding: utf-8

module CartoDB
  # A shared entity is just a relating model that joins entities (currently only visualizations)
  # shared but not owned by users.
  # Initially there's no need to include full objects and is kept as ids only on purpose
  class SharedEntity < Sequel::Model

    # @param recipient_id String (uuid)
    # @param recipient_type String From RECIPIENT_TYPE_xxxx constants
    # @param entity_id String (uuid)
    # @param entity_type String From ENTITY_TYPE_xxxx constants

    # Allow mass-assignment of fields that compose the PK when using .new()
    unrestrict_primary_key

    ENTITY_TYPE_VISUALIZATION = 'vis'

    RECIPIENT_TYPE_USER         = 'user'
    RECIPIENT_TYPE_ORGANIZATION = 'org'
    RECIPIENT_TYPE_GROUP = 'group'

    def validate
      super
      validates_presence([:recipient_id, :recipient_type, :entity_id, :entity_type])
      validates_unique([:recipient_id, :entity_id])
      errors.add(:entity_type, 'unsupported type') unless self.entity_type == ENTITY_TYPE_VISUALIZATION
    end #validate

    def before_save
      super
      self.updated_at = Time.now
    end

    def entity
      @entity ||= CartoDB::Visualization::Member.new(id: entity_id).fetch
    end

  end

end
