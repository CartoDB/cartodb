module Carto

  module PermissionService
    def self.revokesByUser(old_acl, new_acl)
      old_acl = hashing_acl(old_acl)
      new_acl = hashing_acl(new_acl)

      diff_by_types = diff_by_types(old_acl, new_acl)
      diff = diff_by_types['user'] || {}

      # diff by org users
      if diff_by_types['org'].present?
        diff_by_types['org'].each do |org_id, revoke|
          org = Carto::Organization.find(org_id)
          org_users_diff = diff_by_org_users(org.users, revoke, new_acl)

          # add org users to diff
          unless org_users_diff.blank?
            org_users_diff['user'].each do |user_id, revoke|
              diff[user_id] = revoke if diff[user_id].nil?
            end
          end
        end
      end

      diff
    end

    private

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

    def self.diff_by_org_users(org_users, org_revoke, new_acl)
      diff = {}
      org_users.each do |user|
        if new_acl['user'].nil? || new_acl['user'][user.id].nil?
          diff['user'] ||= {}
          diff['user'][user.id] = org_revoke
        elsif (org_revoke == 'rw' || org_revoke == 'w') && new_acl['user'][user.id] == 'r'
          diff['user'] ||= {}
          diff['user'][user.id] = 'w'
        end
      end
      diff
    end

  end
end
