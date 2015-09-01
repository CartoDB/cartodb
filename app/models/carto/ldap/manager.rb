# encoding: UTF-8

module Carto
  module Ldap

    class Manager

      def authenticate(username, password)
        @last_authentication_result = nil
        user = nil
        ldap_entry = nil

        Carto::Ldap::Configuration.all.each { |ldap|
          ldap_entry ||= ldap.authenticate(username, password)
          @last_authentication_result = ldap.last_authentication_result
        }

        if ldap_entry
          user = User.where({
              username: ldap_entry.cartodb_user_id,
              organization_id: ldap_entry.configuration.organization_id
            }).first
        end

        user
      end

      def configuration_present?
        Carto::Ldap::Configuration.first != nil
      end

      def last_authentication_result
        @last_authentication_result
      end

      def self.sanitize_for_cartodb(ldap_value)
        ldap_value.to_s.downcase.gsub(/[^a-z0-9\-]/,'')
      end

    end

  end
end
