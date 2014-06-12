# encoding: utf-8

require_relative './permission/presenter'

module CartoDB
  class Permission < Sequel::Model

    # @param id String (uuid)
    # @param owner_id String (uuid)
    # @param owner_username String

    TYPE_READONLY   = 'r'
    TYPE_READWRITE  = 'rw'

    DEFAULT_ACL_VALUE = '[]'

    # Format: requested_permission => [ allowed_permissions_list ]
    PERMISSIONS_MATRIX = {
        TYPE_READONLY    => [ TYPE_READONLY, TYPE_READWRITE ],
        TYPE_READWRITE   => [ TYPE_READWRITE ]
    }

    def acl
      ::JSON.parse((self.access_control_list.nil? ? DEFAULT_ACL_VALUE : self.access_control_list), symbolize_names: true)
    end

    # Populate it with items in format: [ { :user { id :uuid, username :string}, type :string} ]
    # id is user id, username is to avoid additional lookups, type is "r" or "rw"
    # @param value Object
    # @throws PermissionError
    def acl=(value)
      incoming_acl = value.nil? ? ::JSON.parse(DEFAULT_ACL_VALUE) : value
      raise PermissionError.new('ACL is not an array') unless incoming_acl.kind_of? Array
      incoming_acl.map { |item|
        raise PermissionError.new('Wrong ACL entry format') unless item.kind_of? Hash
        raise PermissionError.new('Wrong ACL entry format') unless item.keys == [:user, :type]
        raise PermissionError.new('Wrong ACL entry format') unless item[:user].keys == [:id, :username]
        raise PermissionError.new('Wrong ACL entry format') unless [TYPE_READONLY, TYPE_READWRITE].include? item[:type]
      }

      self.access_control_list = ::JSON.dump(incoming_acl)
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
      return TYPE_READWRITE if is_owner?(subject)
      acl.map { |entry|
        return entry[:type] if entry[:user][:id] == subject.id
      }
      nil
    end

    # Note: Does not check ownership
    # @param subject User
    # @param permission_type String Permission::TYPE_xxx
    def is_permitted?(subject, permission_type)
      acl.each { |acl_user|
        if acl_user[:user][:id] == subject.id
          if Permission::PERMISSIONS_MATRIX[permission_type].include? acl_user[:type]
            return true
          end
        end
      }
      false
    end

    def is_owner?(subject)
      self.owner_id == subject.id
    end

    def to_poro
      CartoDB::PermissionPresenter.new(self).to_poro
    end

  end

  class PermissionError < StandardError; end

end