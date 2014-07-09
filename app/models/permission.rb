# encoding: utf-8

require_relative './permission/presenter'

module CartoDB
  class Permission < Sequel::Model

    # @param id String (uuid)
    # @param owner_id String (uuid)
    # @param owner_username String
    # @param entity_id String (uuid)
    # @param entity_type String

    ACCESS_READONLY   = 'r'
    ACCESS_READWRITE  = 'rw'
    ACCESS_NONE       = 'n'

    TYPE_USER         = 'user'
    TYPE_ORGANIZATION = 'org'

    ENTITY_TYPE_VISUALIZATION = 'vis'

    DEFAULT_ACL_VALUE = '[]'

    # Format: requested_permission => [ allowed_permissions_list ]
    PERMISSIONS_MATRIX = {
        ACCESS_READONLY    => [ ACCESS_READONLY, ACCESS_READWRITE ],
        ACCESS_READWRITE   => [ ACCESS_READWRITE ],
        ACCESS_NONE        => []
    }

    # @return Hash
    def acl
      ::JSON.parse((self.access_control_list.nil? ? DEFAULT_ACL_VALUE : self.access_control_list), symbolize_names: true)
    end

    # Format:
    # [
    #   {
    #     type:         string,
    #     entity:
    #     {
    #       id:         uuid,
    #       username:   string,
    #       avatar_url: string,   (optional)
    #     },
    #     access:       string
    #   }
    # ]
    #
    # type is from TYPE_xxxxx constants
    # access is from ACCESS_xxxxx constants
    #
    # @param value Array
    # @throws PermissionError
    def acl=(value)
      incoming_acl = value.nil? ? ::JSON.parse(DEFAULT_ACL_VALUE) : value
      raise PermissionError.new('ACL is not an array') unless incoming_acl.kind_of? Array
      incoming_acl.map { |item|
        unless item.kind_of?(Hash) && item[:entity].present? && item[:type].present? && item[:access].present? \
          && (item[:entity].keys - [:id, :username, :avatar_url] == []) \
          && [ACCESS_READONLY, ACCESS_READWRITE, ACCESS_NONE].include?(item[:access])
          raise PermissionError.new('Wrong ACL entry format')
        end
      }

      cleaned_acl = incoming_acl.map { |item|
        {
          type:   item[:type],
          id:     item[:entity][:id],
          access: item[:access]
        }
      }

      self.access_control_list = ::JSON.dump(cleaned_acl)
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

    # @param value Mixed
    def entity=(value)
      if value.kind_of? CartoDB::Visualization::Member
        self.entity_type = ENTITY_TYPE_VISUALIZATION
        self.entity_id = value.id
      else
        raise PermissionError.new('Unsupported entity type')
      end
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
    # @return String Permission::ACCESS_xxx
    def permission_for_user(subject)
      permission = nil

      # Common scenario
      return ACCESS_READWRITE if is_owner?(subject)

      acl.map { |entry|
        if entry[:type] == TYPE_USER && entry[:id] == subject.id
          permission = entry[:access]
        end
        # Organization has lower precedence than user, if set leave as it is
        if entry[:type] == TYPE_ORGANIZATION && permission == nil
          if !subject.organization.nil? && subject.organization.id == entry[:id]
            permission = entry[:access]
          end
        end
      }
      permission = ACCESS_NONE if permission.nil?
      permission
    end

    # Note: Does not check ownership
    # @param subject User
    # @param access String Permission::ACCESS_xxx
    def is_permitted?(subject, access)
      permission = permission_for_user(subject)
      Permission::PERMISSIONS_MATRIX[access].include? permission
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