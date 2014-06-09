# encoding: utf-8

module CartoDB
  class Permission < Sequel::Model

    TYPE_READONLY   = 'r'
    TYPE_READWRITE  = 'rw'

    DEFAULT_ACL_VALUE = '[]'

    PUBLIC_ATTRIBUTES = [
        :id,
        :owner_id,
        :owner_username
    ]

    def public_values
      Hash[PUBLIC_ATTRIBUTES.map{ |k| [k, (self.send(k) rescue self[k].to_s)] }]
    end #public_values

    def acl
      ::JSON.parse((self.access_control_list.nil? ? DEFAULT_ACL_VALUE : self.access_control_list), symbolize_names: true)
    end

    # Populate it with items in format: [ { id :uuid, name :string, type :string} ]
    # id is user id, name is username (to avoid additional lookups), type is "r" or "rw"
    # @param value Object
    def acl=(value)
      self.access_control_list = (value.nil? ? DEFAULT_ACL_VALUE : ::JSON.dump(value))
    end

    # @return User|nil
    def owner
      User.where(id:self.owner_id).first
    end

    # @param value User
    def owner=(value)
      self.owner_id = value.id
      self.owner_username = value.username
    end

    def validate
      super
      errors.add(:owner_id, 'cannot be nil') if (self.owner_id.nil? || self.owner_id.empty?)
      errors.add(:owner_username, 'cannot be nil') if (self.owner_username.nil? || self.owner_username.empty?)
      unless new?
        validates_presence [:id]
      end
    end #validate

    def before_save
      super
      self.updated_at = Time.now
    end

    # @param subject User
    # @return nil|string Either Permission::TYPE_xxx or nil if no permission
    def permission_for_user(subject)
      return TYPE_READWRITE if is_owner(subject)
      acl.map { |entry|
        return entry[:type] if entry[:id] == subject.id
      }
      nil
    end

    def is_owner(subject)
      self.owner_id == subject.id
    end

  end
end