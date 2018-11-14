module Carto
  module PermissionService
    TYPE_USER  = 'user'.freeze
    TYPE_ORG   = 'org'.freeze
    TYPE_GROUP = 'group'.freeze

    def self.revokes_by_user(old_acl, new_acl, table_owner_id)
      old_acl = hashing_acl(old_acl)
      new_acl = hashing_acl(new_acl)

      diff_by_types = diff_by_types(old_acl, new_acl)
      diff = diff_by_types[TYPE_USER] || {}

      # diff by org users
      diff_by_org_or_group(TYPE_ORG, diff, diff_by_types, table_owner_id)

      # diff by group users
      diff_by_org_or_group(TYPE_GROUP, diff, diff_by_types, table_owner_id)

      diff
    end

    def self.hashing_acl(acl)
      acl_hash = {}
      acl.each do |p|
        acl_hash[p[:type]] ||= {}
        acl_hash[p[:type]][p[:id]] ||= p[:access]
      end
      acl_hash
    end

    def self.diff_by_types(old_acl, new_acl)
      diff = {}
      old_acl.each do |type, id_access|
        id_access.each do |id, access|
          if access == 'rw'
            if new_acl[type].nil? || new_acl[type][id].nil?
              diff[type] ||= {}
              diff[type][id] ||= 'rw'
            elsif new_acl[type][id] == 'r'
              diff[type] ||= {}
              diff[type][id] ||= 'w'
            end
          elsif access == 'r' && (new_acl[type].nil? || new_acl[type][id].nil?)
            diff[type] ||= {}
            diff[type][id] ||= 'r'
          end
        end
      end
      diff
    end

    # Set the revoked permissions by user
    # Returns a hash with user ids as hash keys and revokes as values
    # users param is an array with the users from an organization or group
    def self.diff_by_users(users, revoke, new_acl)
      diff = {}
      users.each do |user|
        if new_acl[TYPE_USER].nil? || new_acl[TYPE_USER][user.id].nil?
          diff[TYPE_USER] ||= {}
          diff[TYPE_USER][user.id] = revoke
        elsif (revoke == 'rw' || revoke == 'w') && new_acl[TYPE_USER][user.id] == 'r'
          diff[TYPE_USER] ||= {}
          diff[TYPE_USER][user.id] = 'w'
        end
      end
      diff
    end

    def self.diff_by_org_or_group(type, diff, diff_by_types, table_owner_id)
      if diff_by_types[type].present?
        diff_by_types[type].each do |id, revoke|
          users = type == TYPE_ORG ? Carto::Organization.find(id).users : Carto::Group.find(id).users
          users_diff = diff_by_users(users, revoke, new_acl)

          # add users to diff
          add_users_to_diff(diff, users_diff, table_owner_id)
        end
      end
    end

    def self.add_users_to_diff(diff, users_diff, table_owner_id)
      unless users_diff.blank?
        users_diff[TYPE_USER].each do |user_id, revoke|
          diff[user_id] = revoke if diff[user_id].nil? && user_id != table_owner_id
        end
      end
    end
  end
end
