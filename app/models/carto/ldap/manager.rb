# encoding: UTF-8

# See http://www.rubydoc.info/gems/net-ldap/0.11
require 'net/ldap'

module Carto
  module Ldap

    class Manager

      # @throws LDAPUserNotPresentAtCartoDBError
      def authenticate(username, password)
        @last_authentication_result = nil
        user = nil
        ldap_entry = nil

        Carto::Ldap::Configuration.all.each { |ldap|
          ldap_entry ||= ldap.authenticate(username, password)
          @last_authentication_result = ldap.last_authentication_result
        }

        if ldap_entry
          user = ::User.where({
              username: ldap_entry.cartodb_user_id,
              organization_id: ldap_entry.configuration.organization_id
            }).first

          if user.nil?
            raise LDAPUserNotPresentAtCartoDBError.new(ldap_entry.cartodb_user_id,
              ldap_entry.configuration.organization_id, username, ldap_entry.email)
          end
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


    class LDAPUserNotPresentAtCartoDBError < StandardError

      def initialize(cartodb_username, cartodb_organization_id, ldap_username, ldap_email='')
        @ldap_username = ldap_username
        @ldap_email = ldap_email
        @cartodb_username = cartodb_username
        @organization_id = cartodb_organization_id
        super("'#{ldap_username}' not found at CARTO (username:'#{cartodb_username}', organization id:'#{cartodb_organization_id}')")
      end

      attr_reader :ldap_email, :ldap_username, :cartodb_username, :organization_id

    end

  end
end
