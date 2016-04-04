# encoding: utf-8

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

    ACCESS_READONLY   = 'r'
    ACCESS_READWRITE  = 'rw'
    ACCESS_NONE       = 'n'

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

    ALLOWED_ENTITY_KEYS = [:id, :username, :name, :avatar_url]

    # @return Hash
    def acl
      ::JSON.parse((self.access_control_list.nil? ? DEFAULT_ACL_VALUE : self.access_control_list), symbolize_names: true)
    end

    def real_entity_type
      if entity.type == CartoDB::Visualization::Member::TYPE_CANONICAL
        CartoDB::Visualization::Member::TYPE_CANONICAL
      else
        CartoDB::Visualization::Member::TYPE_DERIVED
      end
    end

    def notify_permissions_change(permissions_changes)
      begin
        permissions_changes.each do |c, v|
          # At the moment we just check users permissions
          if c == 'user'
            v.each do |affected_id, perm|
              # Perm is an array. For the moment just one type of permission can
              # be applied to a type of object. But with an array this is open
              # to more than one permission change at a time
              perm.each do |p|
                if self.real_entity_type == CartoDB::Visualization::Member::TYPE_DERIVED
                  if p['action'] == 'grant'
                    # At this moment just inform as read grant
                    if p['type'].include?('r')
                      ::Resque.enqueue(::Resque::UserJobs::Mail::ShareVisualization, self.entity.id, affected_id)
                    end
                  elsif p['action'] == 'revoke'
                    if p['type'].include?('r')
                      ::Resque.enqueue(::Resque::UserJobs::Mail::UnshareVisualization, self.entity.name, self.owner_username, affected_id)
                    end
                  end
                elsif self.real_entity_type == CartoDB::Visualization::Member::TYPE_CANONICAL
                  if p['action'] == 'grant'
                    # At this moment just inform as read grant
                    if p['type'].include?('r')
                      ::Resque.enqueue(::Resque::UserJobs::Mail::ShareTable, self.entity.id, affected_id)
                    end
                  elsif p['action'] == 'revoke'
                    if p['type'].include?('r')
                      ::Resque.enqueue(::Resque::UserJobs::Mail::UnshareTable, self.entity.name, self.owner_username, affected_id)
                    end
                  end
                end
              end
            end
          end
        end
      rescue => e
        CartoDB::StdoutLogger.info "Problem sending notification mail"
        CartoDB::StdoutLogger.info e
      end
    end

    def self.compare_new_acl(old_acl, new_acl)
      temp_old_acl = {}
      # Convert the old and new acls to a better format for searching
      old_acl.each do |i|
        if !temp_old_acl.has_key?(i[:type])
          temp_old_acl[i[:type]] = {}
        end
        temp_old_acl[i[:type]][i[:id]] = i
      end
      temp_new_acl = {}
      new_acl.each do |i|
        if !temp_new_acl.has_key?(i[:type])
          temp_new_acl[i[:type]] = {}
        end
        temp_new_acl[i[:type]][i[:id]] = i
      end

      # Iterate through the new acl and compare elements with the old one
      permissions_change = {}
      temp_new_acl.each do |pt, pv|
        permissions_change[pt] = {}
        pv.each do |oi, iacl|
          # See if a specific permission exists in the old acl
          # If the new acl is greater than the old we suppose that write
          # permissions were granted. Otherwise they were revoked
          # If the permissions doesn't exist in the old acl it has been granted
          # After the comparisson both old and new acl are removed from the
          # temporal structure
          if !temp_old_acl[pt].nil? && !temp_old_acl[pt][oi].nil?
            case temp_new_acl[pt][oi][:access] <=> temp_old_acl[pt][oi][:access]
            when 1
              permissions_change[pt][oi] = [{'action' => 'grant', 'type' => 'w'}]
            when -1
              permissions_change[pt][oi] = [{'action' => 'revoke', 'type' => 'w'}]
            end
            temp_old_acl[pt].delete(oi)
          else
            permissions_change[pt][oi] = [{'action' => 'grant', 'type' => temp_new_acl[pt][oi][:access]}]
          end
          temp_new_acl[pt].delete(oi)
        end
      end

      # Iterate through the old acl. All the permissions in this structure are
      # supposed so be revokes
      temp_old_acl.each do |pt, pv|
        if permissions_change[pt].nil?
          permissions_change[pt] = {}
        end
        pv.each do |oi, iacl|
          permissions_change[pt][oi] = [{'action' => 'revoke', 'type' => temp_old_acl[pt][oi][:access]}]
        end
      end

      return permissions_change
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
        unless item.kind_of?(Hash) && acl_has_required_fields?(item) && acl_has_valid_access?(item)
          raise PermissionError.new('Wrong ACL entry format')
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

    def remove_group_permission(group)
      # You only want to switch it off when request is a permission request coming from database
      @update_db_group_permission = false

      set_group_permission(group, ACCESS_NONE)
    end

    def remove_user_permission(user)
      granted_access = granted_access_for_user(user)
      if granted_access != ACCESS_NONE
        self.acl = inputable_acl.select { |entry| entry[:entity][:id] != user.id }
      end
    end

    def set_user_permission(subject, access)
      set_subject_permission(subject.id, access, TYPE_USER)
    end

    # acl write method expects entries to have entity, although they're not
    # stored.
    # TODO: fix this, since this is coupled to representation.
    def inputable_acl
      self.acl.map { |entry|
        {
          type: entry[:type],
          entity: {
            id: entry[:id],
            avatar_url: '',
            username: '',
            name: ''
          },
          access: entry[:access]
        }
      }
    end

    def set_subject_permission(subject_id, access, type)
      new_acl = inputable_acl

      new_acl << {
          type: type,
          entity: {
            id: subject_id,
            avatar_url: '',
            username: '',
            name: ''
          },
          access: access
      }

      self.acl = new_acl
    end

    # @return ::User|nil
    def owner
      @owner ||= ::User[self.owner_id] # See http://sequel.jeremyevans.net/rdoc-plugins/classes/Sequel/Plugins/Caching.html
    end

    # @param value ::User
    def owner=(value)
      @owner = value
      self.owner_id = value.id
      self.owner_username = value.username
    end

    # @return Mixed|nil
    def entity
      viz = Carto::Visualization.where(permission_id: id).first
      @visualization ||= CartoDB::Visualization::Member.new(id: viz.id).fetch unless viz.nil?
    end

    def validate
      super
      errors.add(:owner_id, 'cannot be nil') if owner_id.nil? || owner_id.empty?
      errors.add(:owner_username, 'cannot be nil') if owner_username.nil? || owner_username.empty?

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
        self.notify_permissions_change(CartoDB::Permission.compare_new_acl(@old_acl, self.acl))
      end
      update_shared_entities
    end

    def after_destroy
      # Hack. I need to set the new acl as empty so all the old acls are
      # considered revokes
      # We need to pass the current acl as old_acl and the new_acl as something
      # empty to recreate a revoke by deletion
      self.notify_permissions_change(CartoDB::Permission.compare_new_acl(self.acl, []))
    end

    def before_destroy
      destroy_shared_entities
    end

    # @param subject ::User
    # @return String Permission::ACCESS_xxx
    def permission_for_user(subject)
      permission = nil

      # Common scenario
      return ACCESS_READWRITE if is_owner?(subject)

      acl.map { |entry|
        if entry[:type] == TYPE_USER && entry[:id] == subject.id
          permission = entry[:access]
        end

        if entry[:type] == TYPE_GROUP && permission == nil
          if !subject.groups.nil? && subject.groups.collect(&:id).include?(entry[:id])
            permission = entry[:access]
          end
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

    def permission_for_org
      permission = nil
      acl.map { |entry|
        if entry[:type] == TYPE_ORGANIZATION
            permission = entry[:access]
        end
      }
      ACCESS_NONE if permission.nil?
    end

    def granted_access_for_user(user)
      granted_access_for_entry_type(TYPE_USER, user)
    end

    def granted_access_for_group(group)
      granted_access_for_entry_type(TYPE_GROUP, group)
    end

    # Note: Does not check ownership
    # @param subject ::User
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
      CartoDB::SharedEntity.where(entity_id: entity.id).delete
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

      if e.table? and (org or users.any?)
        e.invalidate_cache
      end
    end

    def users_with_permissions(permission_type)
      user_ids = relevant_user_acl_entries(acl).select { |entry|
        permission_type.include?(entry[:access])
      }.map { |entry|
          entry[:id]
      }

      ::User.where(id: user_ids).all
    end

    def entity_type
      ENTITY_TYPE_VISUALIZATION
    end

    def entity_id
      entity.id
    end

    private

    def granted_access_for_entry_type(type, entity)
      permission = nil

      acl.map do |entry|
        if entry[:type] == type && entry[:id] == entity.id
          permission = entry[:access]
        end
      end
      permission = ACCESS_NONE if permission.nil?
      permission
    end

    # when removing permission form a table related visualizations should
    # be checked. The policy is the following:
    #  - if the table is used in one layer of the visualization, it's removed
    #  - if the table is used in the only one visualization layer, the vis is removed
    # TODO: send a notification to the visualizations owner
    def check_related_visualizations(table)
      dependent_visualizations = table.dependent_visualizations.to_a
      non_dependent_visualizations = table.non_dependent_visualizations.to_a
      table_visualization = table.table_visualization
      non_dependent_visualizations.each do |visualization|
        # check permissions, if the owner does not have permissions
        # to see the table the layers using this table are removed
        perm = visualization.permission
        unless table_visualization.has_permission?(perm.owner, CartoDB::Visualization::Member::PERMISSION_READONLY)
          visualization.unlink_from(table)
        end
      end

      dependent_visualizations.each do |visualization|
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
          raise PermissionError.new("Unsupported entity type trying to grant permission: #{entity.class.name}")
      end
    end

    def grant_db_permission(entity, access, shared_entity)
      if shared_entity.recipient_type == CartoDB::SharedEntity::RECIPIENT_TYPE_ORGANIZATION
        permission_strategy = OrganizationPermission.new
      else
        u = ::User.where(id: shared_entity[:recipient_id]).first
        permission_strategy = UserPermission.new(u)
      end

      case entity.class.name
        when CartoDB::Visualization::Member.to_s
          # assert database permissions for non canonical tables are assigned
          # its canonical vis
          if not entity.table
              raise PermissionError.new('Trying to change permissions to a table without ownership')
          end
          table = entity.table

          # check ownership
          if not self.owner_id == entity.permission.owner_id
            raise PermissionError.new('Trying to change permissions to a table without ownership')
          end
          # give permission
          if access == ACCESS_READONLY
            permission_strategy.add_read_permission(table)
          elsif access == ACCESS_READWRITE
            permission_strategy.add_read_write_permission(table)
          end
        else
          raise PermissionError.new('Unsupported entity type trying to grant permission')
      end
    end

    # Only user entries, and those with forbids also skipped
    def relevant_user_acl_entries(acl_list)
      relevant_acl_entries(acl_list, TYPE_USER)
    end

    def relevant_org_acl_entry(acl_list)
      relevant_acl_entries(acl_list, TYPE_ORGANIZATION).first
    end

    def relevant_groups_acl_entries(acl_list)
      relevant_acl_entries(acl_list, TYPE_GROUP)
    end

    def relevant_acl_entries(acl_list, type)
      acl_list.select { |entry|
        entry[:type] == type && entry[:access] != ACCESS_NONE
      }.map { |entry|
        {
            id:     entry[:id],
            access: entry[:access]
        }
      }
    end

    def acl_has_required_fields?(acl_item)
      acl_item[:entity].present? && acl_item[:type].present? && acl_item[:access].present? && acl_has_valid_entity_field?(acl_item)
    end

    def acl_has_valid_entity_field?(acl_item)
      acl_item[:entity].keys - ALLOWED_ENTITY_KEYS == []
    end

    def acl_has_valid_access?(acl_item)
      valid_access = [ACCESS_READONLY, ACCESS_NONE]
      if entity.table?
        valid_access << ACCESS_READWRITE
      end
      valid_access.include?(acl_item[:access])
    end

  end

  class PermissionError < StandardError; end


  class OrganizationPermission
    def add_read_permission(table)
      table.add_organization_read_permission
    end

    def add_read_write_permission(table)
      table.add_organization_read_write_permission
    end

    def is_permitted(table, access)
      table.permission.permission_for_org == access
    end
  end


  class UserPermission

    def initialize(user)
      @user = user
    end

    def is_permitted(table, access)
      table.permission.is_permitted?(@user, access)
    end

    def add_read_permission(table)
      table.add_read_permission(@user)
    end

    def add_read_write_permission(table)
      table.add_read_write_permission(@user)
    end
  end

end
