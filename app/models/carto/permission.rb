require 'active_record'

class Carto::Permission < ActiveRecord::Base
  DEFAULT_ACL_VALUE = [].freeze

  ACCESS_READONLY   = 'r'.freeze
  ACCESS_READWRITE  = 'rw'.freeze
  ACCESS_NONE       = 'n'.freeze
  SORTED_ACCESSES   = [ACCESS_READWRITE, ACCESS_READONLY, ACCESS_NONE].freeze

  TYPE_USER         = 'user'.freeze
  TYPE_ORGANIZATION = 'org'.freeze
  TYPE_GROUP        = 'group'.freeze

  belongs_to :owner, class_name: Carto::User, select: Carto::User::SELECT_WITH_DATABASE
  has_one :entity, inverse_of: :permission, class_name: Carto::Visualization, foreign_key: :permission_id

  def acl
    @acl ||= access_control_list.nil? ? DEFAULT_ACL_VALUE : JSON.parse(access_control_list, symbolize_names: true)
  end

  def user_has_read_permission?(user)
    owner_user?(user) || !acl_entries_for_user(user).empty?
  end

  def user_has_write_permission?(user)
    owner_user?(user) || permitted?(user, ACCESS_READWRITE)
  end

  private

  def permitted?(user, permission_type)
    SORTED_ACCESSES.index(permission_for_user(user)) <= SORTED_ACCESSES.index(permission_type)
  end

  def owner_user?(user)
    owner_id == user.id
  end

  def permission_for_user(user)
    return ACCESS_READWRITE if owner_user?(user)

    accesses = acl_entries_for_user(user).map do |entry|
      entry[:access]
    end

    higher_access(accesses)
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

end
