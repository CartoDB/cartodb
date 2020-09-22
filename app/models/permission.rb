require_relative './permission/presenter'
require_relative './visualization/member'
require_relative 'shared_entity'

module CartoDB
  class Permission < Sequel::Model

    # @param id String (uuid)
    # @param owner_id String (uuid)
    # @param owner_username String
    # @param entity_id String (uuid)
    # @param entity_type String

    # Another hack to resolve the problem with Sequel new? method
    @new_object = false

    @old_acl = nil

    ACCESS_READONLY   = 'r'.freeze
    ACCESS_READWRITE  = 'rw'.freeze
    ACCESS_NONE       = 'n'.freeze

    TYPE_USER         = 'user'
    TYPE_ORGANIZATION = 'org'
    TYPE_GROUP = 'group'

    ENTITY_TYPE_VISUALIZATION = 'vis'

    DEFAULT_ACL_VALUE = '[]'

    # Format: requested_permission => [ allowed_permissions_list ]
    PERMISSIONS_MATRIX = {
        ACCESS_READONLY    => [ ACCESS_READONLY, ACCESS_READWRITE ],
        ACCESS_READWRITE   => [ ACCESS_READWRITE ],
        ACCESS_NONE        => []
    }

    delegate(
      :acl,
      :acl_has_required_fields?,
      :acl_has_valid_entity_field?,
      :acl_has_valid_access?,
      :destroy,
      :destroy_shared_entities,
      :entity_id,
      :entity_type,
      :granted_access_for_entry_type,
      :granted_access_for_user,
      :granted_access_for_group,
      :inputable_acl,
      :is_owner?,
      :notify_permissions_change,
      :owner,
      :permission_for_org,
      :permission_for_user,
      :real_entity_type,
      :relevant_user_acl_entries,
      :relevant_org_acl_entry,
      :relevant_groups_acl_entries,
      :relevant_acl_entries,
      :remove_group_permission,
      :remove_user_permission,
      :set_subject_permission,
      :set_user_permission,
      :to_poro,
      :users_with_permissions,
      to: :carto_permission
    )

    def acl=(value)
      incoming_acl = value.nil? ? ::JSON.parse(DEFAULT_ACL_VALUE) : value
      raise Carto::Permission::Error.new('ACL is not an array') unless incoming_acl.kind_of? Array
      incoming_acl.map { |item|
        unless item.kind_of?(Hash) && acl_has_required_fields?(item) && acl_has_valid_access?(item)
          raise Carto::Permission::Error.new('Wrong ACL entry format')
        end
      }

      acl_items = incoming_acl.map do |item|
        {
          type:   item[:type],
          id:     item[:entity][:id],
          access: item[:access]
        }
      end

      cleaned_acl = acl_items.select { |i| i[:id] } # Cleaning, see #5668

      if @old_acl.nil?
        @old_acl = acl
      end

      self.access_control_list = ::JSON.dump(cleaned_acl)
    end

    def set_group_permission(group, access)
      # You only want to switch it off when request is a permission request coming from database
      @update_db_group_permission = false

      granted_access = granted_access_for_group(group)
      if granted_access == access
        raise ModelAlreadyExistsError.new("Group #{group.name} already has #{access} access")
      elsif granted_access == ACCESS_NONE
        set_subject_permission(group.id, access, TYPE_GROUP)
      else
        # Remove group entry from acl in order to add new (or none if ACCESS_NONE)
        new_acl = self.inputable_acl.select { |entry| entry[:entity][:id] != group.id }

        unless access == ACCESS_NONE
          acl_entry = {
            type: TYPE_GROUP,
            entity: {
              id: group.id,
              name: group.name
            },
            access: access
          }
          new_acl << acl_entry
        end

        self.acl = new_acl
      end
    end

    # @param value ::User
    def owner=(value)
      @owner = value
      self.owner_id = value.id
      self.owner_username = value.username
    end

    # @return Mixed|nil
    def entity
      @visualization ||= CartoDB::Visualization::Collection.new.fetch(permission_id: id).first
    end

    def validate
      super
      errors.add(:owner_id, 'cannot be nil') if owner_id.nil? || owner_id.empty?
      errors.add(:owner_username, 'cannot be nil') if owner_username.nil? || owner_username.empty?
      viewer_writers = users_with_permissions(ACCESS_READWRITE).select(&:viewer)
      unless viewer_writers.empty?
        errors.add(:access_control_list, "grants write to viewers: #{viewer_writers.map(&:username).join(',')}")
      end

      if new?
        errors.add(:acl, 'must be empty on initial creation') if acl.present?
      else
        validates_presence [:id]
      end
    end

    def before_save
      super
      self.updated_at = Time.now
    end

    def after_update
      if !@old_acl.nil?
        notify_permissions_change(Carto::Permission.compare_new_acl(@old_acl, self.acl))
      end
      update_shared_entities
      # Notify change, caches should be invalidated
      entity.table.update_cdb_tablemetadata if entity && entity.table
    end

    # Note: Does not check ownership
    # @param subject ::User
    # @param access String Permission::ACCESS_xxx
    def permitted?(subject, access)
      permission = permission_for_user(subject)
      Permission::PERMISSIONS_MATRIX[access].include? permission
    end

    def clear
      self.acl = []
      revoke_previous_permissions(entity)
      save
    end

    def update_shared_entities
      e = entity
      # First clean previous sharings
      destroy_shared_entities
      revoke_previous_permissions(e)

      # Create user entities for the new ACL
      users = relevant_user_acl_entries(acl)
      # Avoid entries without recipient id. See #5668.
      users.select { |u| u[:id] }.each do |user|
        shared_entity = CartoDB::SharedEntity.new(
            recipient_id:   user[:id],
            recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
            entity_id:      entity.id,
            entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
        ).save

        if e.table?
          grant_db_permission(e, user[:access], shared_entity)
        end
      end

      org = relevant_org_acl_entry(acl)
      if org
        shared_entity = CartoDB::SharedEntity.new(
            recipient_id:   org[:id],
            recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_ORGANIZATION,
            entity_id:      entity.id,
            entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
        ).save

        if e.table?
          grant_db_permission(e, org[:access], shared_entity)
        end
      end

      groups = relevant_groups_acl_entries(acl)
      groups.each do |group|
        CartoDB::SharedEntity.new(
            recipient_id:   group[:id],
            recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_GROUP,
            entity_id:      entity.id,
            entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
        ).save

        # You only want to switch it off when request is a permission request coming from database
        if e.table? && @update_db_group_permission != false
          Carto::Group.find(group[:id]).grant_db_permission(e.table, group[:access])
        end
      end

      e.invalidate_for_permissions_change
    end

    def carto_permission
      Carto::Permission.find(id)
    end

    private

    # when removing permission form a table related visualizations should
    # be checked. The policy is the following:
    #  - if the table is used in one layer of the visualization, it's removed
    #  - if the table is used in the only one visualization layer, the vis is removed
    # TODO: send a notification to the visualizations owner
    def check_related_visualizations(table)
      fully_dependent_visualizations = table.fully_dependent_visualizations.to_a
      partially_dependent_visualizations = table.partially_dependent_visualizations.to_a
      table_visualization = table.table_visualization
      partially_dependent_visualizations.each do |visualization|
        # check permissions, if the owner does not have permissions
        # to see the table the layers using this table are removed
        perm = visualization.permission
        unless table_visualization.has_permission?(perm.owner, CartoDB::Visualization::Member::PERMISSION_READONLY)
          visualization.unlink_from(table)
        end
      end

      fully_dependent_visualizations.each do |visualization|
        # check permissions, if the owner does not have permissions
        # to see the table the visualization is removed
        perm = visualization.permission
        unless table_visualization.has_permission?(perm.owner, CartoDB::Visualization::Member::PERMISSION_READONLY)
          visualization.delete
        end
      end
    end

    def revoke_previous_permissions(entity)
      users = relevant_user_acl_entries(@old_acl.nil? ? [] : @old_acl)
      org = relevant_org_acl_entry(@old_acl.nil? ? [] : @old_acl)
      groups = relevant_groups_acl_entries(@old_acl.nil? ? [] : @old_acl)
      case entity.class.name
        when CartoDB::Visualization::Member.to_s
          if entity.table
            if org
              entity.table.remove_organization_access
            end
            users.each { |user|
              # Cleaning, see #5668
              u = ::User[user[:id]]
              entity.table.remove_access(u) if u
            }
            # update_db_group_permission check is needed to avoid updating db requests
            if @update_db_group_permission != false
              groups.each { |group|
                Carto::Group.find(group[:id]).grant_db_permission(entity.table, ACCESS_NONE)
              }
            end
            check_related_visualizations(entity.table)
          end
        else
          raise Carto::Permission::Error.new("Unsupported entity type trying to grant permission: #{entity.class.name}")
      end
    end

    def grant_db_permission(entity, access, shared_entity)
      if shared_entity.recipient_type == CartoDB::SharedEntity::RECIPIENT_TYPE_ORGANIZATION
        permission_strategy = Carto::OrganizationPermission.new
      else
        u = ::User.where(id: shared_entity[:recipient_id]).first
        permission_strategy = Carto::UserPermission.new(u)
      end

      case entity.class.name
        when CartoDB::Visualization::Member.to_s
          # assert database permissions for non canonical tables are assigned
          # its canonical vis
          if not entity.table
              raise Carto::Permission::Error.new('Trying to change permissions to a table without ownership')
          end
          table = entity.table

          # check ownership
          if not self.owner_id == entity.permission.owner_id
            raise Carto::Permission::Error.new('Trying to change permissions to a table without ownership')
          end
          # give permission
          if access == ACCESS_READONLY
            permission_strategy.add_read_permission(table)
          elsif access == ACCESS_READWRITE
            permission_strategy.add_read_write_permission(table)
          end
        else
          raise Carto::Permission::Error.new('Unsupported entity type trying to grant permission')
      end
    end

  end
end
