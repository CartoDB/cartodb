require 'active_record'
require_relative './user'

class Carto::Permission < ActiveRecord::Base
  DEFAULT_ACL_VALUE = []

  ACCESS_READONLY   = 'r'
  ACCESS_READWRITE  = 'rw'
  ACCESS_NONE       = 'n'
  SORTED_ACCESSES = [ ACCESS_READWRITE, ACCESS_READONLY, ACCESS_NONE ]

  TYPE_USER         = 'user'
  TYPE_ORGANIZATION = 'org'
  TYPE_GROUP = 'group'

  ENTITY_TYPE_VISUALIZATION = 'vis'

  belongs_to :owner, class_name: Carto::User, select: Carto::User::SELECT_WITH_DATABASE
  belongs_to :entity, class_name: Carto::Visualization
  # AR polymorphism does not allow for custom type mappings,
  # and it seems the only implemented type is 'viz' which translates to Visualization.
  # TODO: Add a migration to translate the type values to fully-qualified class types
  # so we can use AR polymorphism (once we intend to use entities of different types)

  def acl
    @acl ||= self.access_control_list.nil? ? DEFAULT_ACL_VALUE : JSON.parse(self.access_control_list, symbolize_names: true)
  end

  def user_has_read_permission?(user)
    is_owner_user?(user) || !acl_entries_for_user(user).empty?
  end

  def user_has_write_permission?(user)
    is_owner_user?(user) || is_permitted?(user, ACCESS_READWRITE)
  end

  # INFO: discouraged outside this class, since it forces using internal constants
  # Use explicit methods instead.
  # Needed for backwards compatibility
  def is_permitted?(user, permission_type)
    SORTED_ACCESSES.index(permission_for_user(user)) <= SORTED_ACCESSES.index(permission_type)
  end

  private

  def permission_for_user(user)
    return ACCESS_READWRITE if is_owner_user?(user)

    accesses = acl_entries_for_user(user).map { |entry|
      entry[:access]
    }

    higher_access(accesses)
  end

  def higher_access(accesses)
    return ACCESS_NONE if accesses.empty?
    index = SORTED_ACCESSES.index { |access|
      accesses.include?(access)
    }
    SORTED_ACCESSES[index]
  end

  def is_owner_user?(user)
    self.owner_id == user.id
  end

  def acl_entries_for_user(user)
    acl.select { |entry|
      acl_entry_is_for_user_id?(entry, user.id) || acl_entry_is_for_organization_id(entry, user.organization_id) || (!user.groups.nil? && acl_entry_is_for_a_user_group(entry, user.groups.collect(&:id)))
    }
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

end
