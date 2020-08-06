module Carto
  class DbPermissionService

    extend ::LoggerHelper

    TYPE_USER  = 'user'.freeze
    TYPE_ORG   = 'org'.freeze
    TYPE_GROUP = 'group'.freeze

    READ_PERMISSIONS = ['select'].freeze
    WRITE_PERMISSIONS = ['insert', 'update', 'delete'].freeze
    PERMISSIONS = {
      r: READ_PERMISSIONS,
      w: WRITE_PERMISSIONS,
      rw: READ_PERMISSIONS + WRITE_PERMISSIONS
    }.freeze

    def self.shared_entities_revokes(old_acl, new_acl, table)
      diff = revokes_by_user_diff(old_acl, new_acl, table.owner.id)
      unless diff.blank?
        shared_apikey_revokes(table, diff)
        shared_oauth_app_user_revokes(table, diff)
      end
    end

    def self.revokes_by_user_diff(old_acl, new_acl, table_owner_id)
      old_acl = more_permisive_by_user(old_acl)
      new_acl = more_permisive_by_user(new_acl)

      revokes_by_user(old_acl, new_acl, table_owner_id)
    end

    private_class_method def self.shared_apikey_revokes(table, revokes)
      Carto::ApiKey.where(user_id: revokes.keys, type: ['regular', 'oauth']).find_each do |apikey|
        apikey.revoke_permissions(table, PERMISSIONS[revokes[apikey.user_id].to_sym])
      end
    end

    private_class_method def self.shared_oauth_app_user_revokes(table, revokes)
      Carto::OauthAppUser.where(user_id: revokes.keys).find_each do |oau|
        oau.revoke_permissions(table, PERMISSIONS[revokes[oau.user_id].to_sym])
      end
    end

    private_class_method def self.more_permisive_by_user(acl)
      acl_hash = {}
      acl.each do |p|
        user_ids(p[:type], p[:id]).each { |uid| acl_hash[uid] = keep_more_permisive(acl_hash[uid], p[:access]) }
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
    rescue ActiveRecord::RecordNotFound => e
      log_error(exception: e, entity: { type: type, id: id })
      []
    end

    private_class_method def self.keep_more_permisive(current, new_one)
      current == 'rw' || new_one == 'rw' ? 'rw' : 'r'
    end

    private_class_method def self.revokes_by_user(old_acl, new_acl, table_owner_id)
      diff = {}
      old_acl.each do |id, access|
        next if id == table_owner_id

        if access == 'rw'
          if new_acl[id].nil?
            revoke = 'rw'
          elsif new_acl[id] == 'r'
            revoke = 'w'
          end
        elsif access == 'r' && new_acl[id].nil?
          revoke = 'r'
        end

        diff[id] = revoke if revoke.present?
      end
      diff
    end
  end
end
