module Carto
  class PermissionService
    TYPE_USER  = 'user'.freeze
    TYPE_ORG   = 'org'.freeze
    TYPE_GROUP = 'group'.freeze

    def self.revokes_by_user(old_acl, new_acl, table_owner_id)
      old_acl = hashing_acl(old_acl)
      new_acl = hashing_acl(new_acl)

      diff_by_types = diff_by_types(old_acl, new_acl, table_owner_id)
      diff_prioritize_by_user(diff_by_types, new_acl)
    end

    private_class_method def self.diff_by_types(old_acl, new_acl, table_owner_id)
      diff_by_types = {}
      old_acl.each do |type, id_access|
        id_access.each do |id, access|
          if access == 'rw'
            if new_acl[type].nil? || new_acl[type][id].nil?
              revoke = 'rw'
            elsif new_acl[type][id] == 'r'
              revoke = 'w'
            end
          elsif access == 'r' && (new_acl[type].nil? || new_acl[type][id].nil?)
            revoke = 'r'
          end

          if revoke.present?
            user_ids(type, id).each do |uid|
              if table_owner_id != uid
                diff_by_types[uid] ||= {}
                diff_by_types[uid][type] = revoke
              end
            end
          end
        end
      end
      diff_by_types
    end

    private_class_method def self.hashing_acl(acl)
      acl_hash = {}
      acl.each do |p|
        acl_hash[p[:type]] ||= {}
        acl_hash[p[:type]][p[:id]] ||= p[:access]
      end
      acl_hash
    end

    private_class_method def self.user_ids(type, id)
      if type == TYPE_USER
        [id]
      elsif type == TYPE_ORG
        Carto::Organization.find(id).users.map(&:id)
      else
        Carto::Group.find(id).users.map(&:id)
      end
    end

    private_class_method def self.diff_prioritize_by_user(diff_by_types, new_acl)
      diff = {}
      diff_by_types.each do |uid, revoke_by_type|
        revoke =
        if revoke_by_type[TYPE_USER].present?
          revoke_by_type[TYPE_USER]
        elsif revoke_by_type.length == 1
          revoke_by_type[TYPE_ORG] || revoke_by_type[TYPE_GROUP]
        elsif revoke_by_type[TYPE_ORG] == 'w' || revoke_by_type[TYPE_GROUP] == 'w'
          'w'
        elsif revoke_by_type[TYPE_ORG] == 'r' || revoke_by_type[TYPE_GROUP] == 'r'
          'r'
        else
          'rw'
        end

        if new_acl[TYPE_USER].nil? || new_acl[TYPE_USER][uid].nil?
          diff[uid] = revoke
        elsif new_acl[TYPE_USER][uid] == 'r' && (revoke == 'w' && revoke_by_type[TYPE_USER].present?)
          diff[uid] = 'w'
        end
      end
      diff
    end
  end
end
