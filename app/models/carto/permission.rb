require 'active_record'

class Carto::Permission < ActiveRecord::Base
  DEFAULT_ACL_VALUE = []

  TYPE_USER         = 'user'
  TYPE_ORGANIZATION = 'org'

  belongs_to :owner, class_name: User, select: Carto::User::DEFAULT_SELECT

  def acl
    @acl ||= self.access_control_list.nil? ? DEFAULT_ACL_VALUE : JSON.parse(self.access_control_list, symbolize_names: true)
  end

  def user_has_read_permission?(user)
    is_owner_user?(user) || !acl_entries_for_user(user).empty?
  end

  private

  def is_owner_user?(user)
    self.owner_id == user.id
  end

  def acl_entries_for_user(user)
    acl.select { |entry|
      acl_entry_is_for_user_id?(entry, user.id) || acl_entry_is_for_organization_id(entry, user.organization_id)
    }
  end

  def acl_entry_is_for_user_id?(entry, user_id)
    entry[:type] == TYPE_USER && entry[:id] == user_id
  end

  def acl_entry_is_for_organization_id(entry, organization_id)
    entry[:type] == TYPE_ORGANIZATION && entry[:id] == organization_id
  end

end
