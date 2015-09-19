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
      if self.entity_type == ENTITY_TYPE_VISUALIZATION
        if self.entity.type == CartoDB::Visualization::Member::TYPE_CANONICAL
          return CartoDB::Visualization::Member::TYPE_CANONICAL
        else
          return CartoDB::Visualization::Member::TYPE_DERIVED
        end
      else
        return self.entity_type
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
              user = User.find(:id => affected_id)
              perm.each do |p|
                if self.real_entity_type == CartoDB::Visualization::Member::TYPE_DERIVED
                  if p['action'] == 'grant'
                    # At this moment just inform as read grant
                    if p['type'].include?('r') && user.is_subscribed_to?(Carto::Notification::SHARE_VISUALIZATION_NOTIFICATION)
                      ::Resque.enqueue(::Resque::UserJobs::Mail::ShareVisualization, self.entity.id, affected_id)
                    end
                  elsif p['action'] == 'revoke'
                    if p['type'].include?('r') && user.is_subscribed_to?(Carto::Notification::SHARE_VISUALIZATION_NOTIFICATION)
                      ::Resque.enqueue(::Resque::UserJobs::Mail::UnshareVisualization, self.entity.name, self.owner_username, affected_id)
                    end
                  end
                elsif self.real_entity_type == CartoDB::Visualization::Member::TYPE_CANONICAL
                  if p['action'] == 'grant'
                    # At this moment just inform as read grant
                    if p['type'].include?('r') && user.is_subscribed_to?(Carto::Notification::SHARE_TABLE_NOTIFICATION)
                      ::Resque.enqueue(::Resque::UserJobs::Mail::ShareTable, self.entity.id, affected_id)
                    end
                  elsif p['action'] == 'revoke'
                    if p['type'].include?('r') && user.is_subscribed_to?(Carto::Notification::SHARE_TABLE_NOTIFICATION)
                      ::Resque.enqueue(::Resque::UserJobs::Mail::UnshareTable, self.entity.name, self.owner_username, affected_id)
                    end
                  end
                end
              end
            end
          end
        end
      rescue => e
        CartoDB::Logger.info "Problem sending notification mail"
        CartoDB::Logger.info e
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

    def set_user_permission(subject, access)
      set_subject_permission(subject.id, access, TYPE_USER)
    end

    def set_subject_permission(subject_id, access, type)
      new_acl = self.acl.map { |entry|
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

    # @return User|nil
    def owner
      @owner ||= User[self.owner_id] # See http://sequel.jeremyevans.net/rdoc-plugins/classes/Sequel/Plugins/Caching.html
    end

    # @param value User
    def owner=(value)
      @owner = value
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

    def after_update
      if !@old_acl.nil?
        self.notify_permissions_change(CartoDB::Permission.compare_new_acl(@old_acl, self.acl))
      end
    end

    def after_save
      update_shared_entities unless new?
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

    def permission_for_org
      permission = nil
      acl.map { |entry|
        if entry[:type] == TYPE_ORGANIZATION
            permission = entry[:access]
        end
      }
      ACCESS_NONE if permission.nil?
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
      users.each { |user|
        shared_entity = CartoDB::SharedEntity.new(
            recipient_id:   user[:id],
            recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
            entity_id:      self.entity_id,
            entity_type:    type_for_shared_entity(self.entity_type)
        ).save

        if e.table?
          grant_db_permission(e, user[:access], shared_entity)
        end
      }

      org = relevant_org_acl_entry(acl)
      if org
        shared_entity = CartoDB::SharedEntity.new(
            recipient_id:   org[:id],
            recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_ORGANIZATION,
            entity_id:      self.entity_id,
            entity_type:    type_for_shared_entity(self.entity_type)
        ).save

        if e.table?
          grant_db_permission(e, org[:access], shared_entity)
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

      User.where(id: user_ids).all
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
      case entity.class.name
        when CartoDB::Visualization::Member.to_s
          if entity.table
            if org
              entity.table.remove_organization_access
            end
            users.each { |user|
              entity.table.remove_access(User.where(id: user[:id]).first)
            }
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
        u = User.where(id: shared_entity[:recipient_id]).first
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
