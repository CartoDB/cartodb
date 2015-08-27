# encoding: UTF-8

module Carto
  module Ldap

    class Manager

      def authenticate(username, password)
        user = nil
        ldap_entry = nil

        Carto::Ldap::Configuration.all.each { |ldap|
          ldap_entry ||= ldap.authenticate(username, password)
        }

        if ldap_entry
          user = User.where({
              username: ldap_entry.cartodb_user_id,
              organization_id: ldap_entry.configuration.organization_id
            }).first
        end

        user
      end

      def domains_present?
        Carto::Ldap::Configuration.first != nil
      end

      def self.sanitize_for_cartodb(ldap_value)
        ldap_value.downcase.gsub(/[^a-z0-9\-]/,'')
      end

    end

  end
end
