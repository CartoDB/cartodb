require 'active_record'
require_dependency 'cartodb/errors'

class Carto::Permission < ActiveRecord::Base

  class Error < StandardError; end

  DEFAULT_ACL_VALUE = [].freeze

  ACCESS_READONLY   = 'r'.freeze
  ACCESS_READWRITE  = 'rw'.freeze
  ACCESS_NONE       = 'n'.freeze
  SORTED_ACCESSES   = [ACCESS_READWRITE, ACCESS_READONLY, ACCESS_NONE].freeze

  TYPE_USER         = 'user'.freeze
  TYPE_ORGANIZATION = 'org'.freeze
  TYPE_GROUP        = 'group'.freeze

  belongs_to :owner, -> { select(Carto::User::DEFAULT_SELECT) }, class_name: Carto::User
  has_one :visualization, inverse_of: :permission, class_name: Carto::Visualization, foreign_key: :permission_id

  validate :not_w_permission_to_viewers

  after_update :update_changes
  after_destroy :update_changes_deletion

  def self.compare_new_acl(old_acl, new_acl)
    temp_old_acl = {}
    # Convert the old and new acls to a better format for searching
    old_acl.each do |i|
      temp_old_acl[i[:type]] = {} unless temp_old_acl.key?(i[:type])
      temp_old_acl[i[:type]][i[:id]] = i
    end
    temp_new_acl = {}
    new_acl.each do |i|
      temp_new_acl[i[:type]] = {} unless temp_new_acl.key?(i[:type])
      temp_new_acl[i[:type]][i[:id]] = i
    end

    changed_permissions = build_changed_permissions(temp_new_acl, temp_old_acl)

    # Iterate through the old acl. All the permissions in this structure are
    # supposed so be revokes
    temp_old_acl.each do |pt, pv|
      changed_permissions[pt] = {} if changed_permissions[pt].nil?

      pv.each do |oi, _iacl|
        changed_permissions[pt][oi] = [{ 'action' => 'revoke', 'type' => temp_old_acl[pt][oi][:access] }]
      end
    end

    changed_permissions
  end

  def self.build_changed_permissions(temp_new_acl, temp_old_acl)
    changed_permissions = {}

    temp_new_acl.each do |pt, pv|
      changed_permissions[pt] = {}
      pv.each do |oi, _iacl|
        # See if a specific permission exists in the old acl
        # If the new acl is greater than the old we suppose that write
        # permissions were granted. Otherwise they were revoked
        # If the permissions doesn't exist in the old acl it has been granted
        # After the comparisson both old and new acl are removed from the
        # temporal structure
        if !temp_old_acl[pt].nil? && !temp_old_acl[pt][oi].nil?
          case temp_new_acl[pt][oi][:access] <=> temp_old_acl[pt][oi][:access]
          when 1
            changed_permissions[pt][oi] = [{ 'action' => 'grant', 'type' => 'w' }]
          when -1
            changed_permissions[pt][oi] = [{ 'action' => 'revoke', 'type' => 'w' }]
          end
          temp_old_acl[pt].delete(oi)
        else
          changed_permissions[pt][oi] = [{ 'action' => 'grant', 'type' => temp_new_acl[pt][oi][:access] }]
        end
        temp_new_acl[pt].delete(oi)
      end
    end

    changed_permissions
  end
  private_class_method :build_changed_permissions

  def acl
    JSON.parse(access_control_list, symbolize_names: true)
  end

  def user_has_read_permission?(user)
    owner?(user) || permitted?(user, ACCESS_READONLY)
  end

  def user_has_write_permission?(user)
    owner?(user) || permitted?(user, ACCESS_READWRITE)
  end

  # Explicitly remove columns from AR schema
  DELETED_COLUMNS = ['entity_id', 'entity_type'].freeze
  def self.columns
    super.reject { |c| DELETED_COLUMNS.include?(c.name) }
  end

  def entities_with_read_permission
    entities = acl.map do |entry|
      entity_id = entry[:id]
      case entry[:type]
      when TYPE_USER
        Carto::User.where(id: entity_id).first
      when TYPE_ORGANIZATION
        Carto::Organization.where(id: entity_id).first
      when TYPE_GROUP
        Carto::Group.where(id: entity_id).first
      end
    end
    entities.compact.uniq
  end

  def entity_type
    ENTITY_TYPE_VISUALIZATION
  end

  def entity_id
    visualization&.id
  end

  def is_owner?(subject)
    owner_id == subject.id
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
  # @throws Carto::Permission::Error
  def acl=(value)
    incoming_acl = value.nil? ? DEFAULT_ACL_VALUE : value
    raise Carto::Permission::Error, 'ACL is not an array' unless incoming_acl.is_a? Array

    incoming_acl.map do |item|
      unless item.is_a?(Hash) && acl_has_required_fields?(item) && acl_has_valid_access?(item)
        raise Carto::Permission::Error, 'Wrong ACL entry format'
      end
    end

    acl_items = incoming_acl.map do |item|
      { type: item[:type], id: item[:entity][:id], access: item[:access] }
    end

    cleaned_acl = acl_items.select { |i| i[:id] } # Cleaning, see #5668
    @old_acl ||= acl

    self.access_control_list = ::JSON.dump(cleaned_acl)
  end

  def owner=(value)
    self.owner_id = value.id
    self.owner_username = value.username
  end

  def permission_for_user(user)
    return ACCESS_READWRITE if owner?(user)

    accesses = acl_entries_for_user(user).map do |entry|
      entry[:access]
    end

    higher_access(accesses)
  end

  def permitted?(user, permission_type)
    SORTED_ACCESSES.index(permission_for_user(user)) <= SORTED_ACCESSES.index(permission_type)
  end

  def entity
    visualization
  end

  def notify_permissions_change(permissions_changes)
    permissions_changes.each do |c, v|
      # At the moment we just check users permissions
      if c == TYPE_USER
        v.each do |affected_id, perm|
          # Perm is an array. For the moment just one type of permission can
          # be applied to a type of object. But with an array this is open
          # to more than one permission change at a time
          perm.each do |p|
            if visualization.derived? || visualization.kuviz? || visualization.app?
              if p['action'] == 'grant'
                # At this moment just inform as read grant
                if p['type'].include?('r')
                  ::Resque.enqueue(::Resque::UserJobs::Mail::ShareVisualization, entity.id, affected_id)
                end
              elsif p['action'] == 'revoke'
                if p['type'].include?('r')
                  ::Resque.enqueue(::Resque::UserJobs::Mail::UnshareVisualization,
                                   entity.name, owner_username, affected_id)
                end
              end
            elsif visualization.canonical?
              if p['action'] == 'grant'
                # At this moment just inform as read grant
                if p['type'].include?('r')
                  ::Resque.enqueue(::Resque::UserJobs::Mail::ShareTable, entity.id, affected_id)
                end
              elsif p['action'] == 'revoke'
                if p['type'].include?('r')
                  ::Resque.enqueue(::Resque::UserJobs::Mail::UnshareTable, entity.name, owner_username, affected_id)
                end
              end
            end
          end
        end
      end
    end
  rescue StandardError => e
    log_error(message: "Problem sending notification mail", exception: e)
  end

  def set_user_permission(subject, access)
    set_subject_permission(subject.id, access, TYPE_USER)
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
      new_acl = inputable_acl.reject { |entry| entry[:entity][:id] == group.id }

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

  # acl write method expects entries to have entity, although they're not
  # stored.
  # TODO: fix this, since this is coupled to representation.
  def inputable_acl
    acl.map do |entry|
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
    end
  end

  def permission_for_org
    permission = nil
    acl.map do |entry|
      permission = entry[:access] if entry[:type] == TYPE_ORGANIZATION
    end
    ACCESS_NONE if permission.nil?
  end

  def to_poro
    CartoDB::PermissionPresenter.new(self).to_poro
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

  def clear
    self.acl = []
    revoke_previous_permissions(entity)
    save
  end

  private

  def real_entity_type
    entity.type
  end

  def not_w_permission_to_viewers
    viewer_writers = users_with_permissions(ACCESS_READWRITE).select(&:viewer)
    unless viewer_writers.empty?
      errors.add(:access_control_list, "grants write to viewers: #{viewer_writers.map(&:username).join(',')}")
    end
  end

  def users_with_permissions(access)
    user_ids = relevant_user_acl_entries(acl).select { |e| access == e[:access] }.map { |e| e[:id] }
    Carto::User.where(id: user_ids)
  end

  ENTITY_TYPE_VISUALIZATION = 'vis'.freeze

  ALLOWED_ENTITY_KEYS = [:id, :username, :name, :avatar_url].freeze

  def owner?(user)
    owner_id == user.id
  end

  def higher_access(accesses)
    return ACCESS_NONE if accesses.empty?
    index = SORTED_ACCESSES.index do |access|
      accesses.include?(access)
    end
    SORTED_ACCESSES[index]
  end

  def acl_entries_for_user(user)
    acl.select do |entry|
      (
        acl_entry_is_for_user_id?(entry, user.id) ||
        acl_entry_is_for_organization_id(entry, user.organization_id) ||
        (!user.groups.nil? && acl_entry_is_for_a_user_group(entry, user.groups.map(&:id)))
      )
    end
  end

  def acl_entry_is_for_user_id?(entry, user_id)
    entry[:type] == TYPE_USER && entry[:id] == user_id
  end

  def acl_entry_is_for_organization_id(entry, organization_id)
    entry[:type] == TYPE_ORGANIZATION && entry[:id] == organization_id
  end

  def acl_entry_is_for_a_user_group(entry, group_ids)
    entry[:type] == TYPE_GROUP && group_ids.include?(entry[:id])
  end

  def acl_has_required_fields?(acl_item)
    acl_item[:entity].present? && acl_item[:type].present? && acl_item[:access].present? &&
      acl_has_valid_entity_field?(acl_item)
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

  def update_changes
    if !@old_acl.nil?
      notify_permissions_change(Carto::Permission.compare_new_acl(@old_acl, acl))
      Carto::DbPermissionService.shared_entities_revokes(@old_acl, acl, entity.table) if entity.table?
    end
    update_shared_entities
    # Notify change, caches should be invalidated
    entity.table.update_cdb_tablemetadata if entity && entity.table
  end

  def update_changes_deletion
    # Hack. I need to set the new acl as empty so all the old acls are
    # considered revokes
    # We need to pass the current acl as old_acl and the new_acl as something
    # empty to recreate a revoke by deletion
    notify_permissions_change(Carto::Permission.compare_new_acl(acl, []))
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
      shared_entity = Carto::SharedEntity.create(
        recipient_id:   user[:id],
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
        entity_id:      entity.id,
        entity_type:    Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )

      if e.table?
        grant_db_permission(e, user[:access], shared_entity)
      end
    end

    org = relevant_org_acl_entry(acl)
    if org
      shared_entity = Carto::SharedEntity.create(
        recipient_id:   org[:id],
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_ORGANIZATION,
        entity_id:      entity.id,
        entity_type:    Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )

      if e.table?
        grant_db_permission(e, org[:access], shared_entity)
      end
    end

    groups = relevant_groups_acl_entries(acl)
    groups.each do |group|
      Carto::SharedEntity.create(
        recipient_id:   group[:id],
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_GROUP,
        entity_id:      entity.id,
        entity_type:    Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )

      # You only want to switch it off when request is a permission request coming from database
      if e.table? && @update_db_group_permission != false
        Carto::Group.find(group[:id]).grant_db_permission(e.table, group[:access])
      end
    end

    e.invalidate_after_commit
  end

  def destroy_shared_entities
    Carto::SharedEntity.where(entity_id: entity.id).destroy_all
  end

  def revoke_previous_permissions(entity)
    users = relevant_user_acl_entries(@old_acl.nil? ? [] : @old_acl)
    org = relevant_org_acl_entry(@old_acl.nil? ? [] : @old_acl)
    groups = relevant_groups_acl_entries(@old_acl.nil? ? [] : @old_acl)
    case entity.class.name
    when Carto::Visualization.to_s
      if entity.table
        if org
          entity.table.remove_organization_access
        end
        users.each do |user|
          # Cleaning, see #5668
          u = Carto::User.find(user[:id])
          entity.table.remove_access(u) if u
        end
        # update_db_group_permission check is needed to avoid updating db requests
        if @update_db_group_permission != false
          groups.each do |group|
            Carto::Group.find(group[:id]).grant_db_permission(entity.table, ACCESS_NONE)
          end
        end
        check_related_visualizations(entity.table)
      end
    else
      raise Carto::Permission::Error.new("Unsupported entity type trying to grant permission: #{entity.class.name}")
    end
  end

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
    acl_list.select { |entry| entry[:type] == type && entry[:access] != ACCESS_NONE }.map do |entry|
      { id: entry[:id], access: entry[:access] }
    end
  end

  def check_related_visualizations(table)
    fully_dependent_visualizations = table.fully_dependent_visualizations.to_a
    partially_dependent_visualizations = table.partially_dependent_visualizations.to_a
    table_visualization = table.table_visualization
    partially_dependent_visualizations.each do |visualization|
      # check permissions, if the owner does not have permissions
      # to see the table the layers using this table are removed
      perm = visualization.permission
      unless table_visualization.has_permission?(perm.owner, ACCESS_READONLY)
        visualization.unlink_from(table)
      end
    end

    fully_dependent_visualizations.each do |visualization|
      # check permissions, if the owner does not have permissions
      # to see the table the visualization is removed
      perm = visualization.permission
      unless table_visualization.has_permission?(perm.owner, ACCESS_READONLY)
        visualization.delete
      end
    end
  end

  def grant_db_permission(entity, access, shared_entity)
    if shared_entity.recipient_type == Carto::SharedEntity::RECIPIENT_TYPE_ORGANIZATION
      permission_strategy = Carto::OrganizationPermission.new
    else
      u = Carto::User.find(shared_entity[:recipient_id])
      permission_strategy = Carto::UserPermission.new(u)
    end

    case entity.class.name
    when Carto::Visualization.to_s
      # assert database permissions for non canonical tables are assigned
      # its canonical vis
      if not entity.table
        raise Carto::Permission::Error, 'Trying to change permissions to a table without ownership'
      end
      table = entity.table

      # check ownership
      if not owner_id == entity.permission.owner_id
        raise Carto::Permission::Error, 'Trying to change permissions to a table without ownership'
      end
      # give permission
      if access == ACCESS_READONLY
        permission_strategy.add_read_permission(table)
      elsif access == ACCESS_READWRITE
        permission_strategy.add_read_write_permission(table)
      end
    else
      raise Carto::Permission::Error, 'Unsupported entity type trying to grant permission'
    end
  end

  def granted_access_for_user(user)
    granted_access_for_entry_type(TYPE_USER, user)
  end

  def granted_access_for_group(group)
    granted_access_for_entry_type(TYPE_GROUP, group)
  end

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

end
