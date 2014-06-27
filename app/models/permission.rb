# encoding: utf-8

require_relative './permission/presenter'
require_relative 'shared_entity'

module CartoDB
  class Permission < Sequel::Model

    # @param id String (uuid)
    # @param owner_id String (uuid)
    # @param owner_username String
    # @param entity_id String (uuid)
    # @param entity_type String

    @old_acl = nil

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

    ALLOWED_ENTITY_KEYS = [:id, :username, :name, :avatar_url]

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
          && (item[:entity].keys - ALLOWED_ENTITY_KEYS == []) \
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

      if @old_acl.nil?
        @old_acl = acl
      end

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

    # @return Mixed|nil
    def entity
      case self.entity_type
        when ENTITY_TYPE_VISUALIZATION
          CartoDB::Visualization::Member.new(id:self.entity_id).fetch
        else
          nil
      end
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
      errors.add(:entity_id, 'cannot be nil') if (self.entity_id.nil? || self.entity_id.empty?)
      errors.add(:entity_type, 'cannot be nil') if (self.entity_type.nil? || self.entity_type.empty?)
      errors.add(:entity_type, 'invalid type') unless self.entity_type == ENTITY_TYPE_VISUALIZATION
      unless new?
        validates_presence [:id]
      end
    end #validate

    def before_save
      super
      self.updated_at = Time.now
    end

    def after_save
      update_shared_entities unless new?
    end

    def before_destroy
      destroy_shared_entities
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

    def destroy_shared_entities
      CartoDB::SharedEntity.where(entity_id: self.entity_id).delete
    end

    def update_shared_entities
      # First clean previous sharings
      destroy_shared_entities
      revoke_previous_permissions(entity)

      # Create user entities for the new ACL
      users = relevant_user_acl_entries(acl)
      users.each { |user|
        CartoDB::SharedEntity.new(
            recipient_id:   user[:id],
            recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
            entity_id:      self.entity_id,
            entity_type:    type_for_shared_entity(self.entity_type)
        ).save

        grant_db_permission(entity, user[:id], user[:access])
      }
    end

    private

    # @param permission_type ENTITY_TYPE_xxxx
    # @throws PermissionError
    def type_for_shared_entity(permission_type)
      if permission_type == ENTITY_TYPE_VISUALIZATION
        return CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
      end
      PermissionError.new('Invalid permission type for shared entity')
    end

    def revoke_previous_permissions(entity)
      users = relevant_user_acl_entries(@old_acl.nil? ? [] : @old_acl)
      case entity.class.name
        when CartoDB::Visualization::Member.to_s
          if entity.table 
            users.each { |user|
              entity.table.remove_access(User.where(id: user[:id]).first)
            }
          end
        else
          raise PermissionError.new('Unsupported entity type trying to grant permission')
      end
    end

    def grant_db_permission(entity, user_id, access)
      case entity.class.name
        when CartoDB::Visualization::Member.to_s
          tables = []
          if (entity.table)
            tables << entity.table
          else
            tables = entity.related_tables
          end
          u = User.where(id: user_id).first
          # if it's not a canonical visualization give permission to the associated tables if the user is the owner
          # check ownership 
          tables.each { |t| 
            if not self.owner_id == t.table_visualization.permission.owner_id
              raise PermissionError.new('Trying to change permissions to a table wihtout ownership')
            end
          }
          # give permission
          if access == ACCESS_READONLY
            tables.each { |t| t.add_read_permission(u) }
          elsif access == ACCESS_READWRITE
            tables.each { |t| t.add_read_write_permission(u) }
          end
        else
          raise PermissionError.new('Unsupported entity type trying to grant permission')
      end
    end

    # Only user entries, and those with forbids also skipped
    def relevant_user_acl_entries(acl_list)
      acl_list.select { |entry|
        entry[:type] == TYPE_USER && entry[:access] != ACCESS_NONE
      }.map { |entry|
        {
          id:     entry[:id],
          access: entry[:access]
        }
      }
    end

  end

  class PermissionError < StandardError; end

end
