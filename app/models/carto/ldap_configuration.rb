# encoding: UTF-8

require 'net/ldap'

class Carto::LdapConfiguration < ActiveRecord::Base

  belongs_to :organization, class_name: Carto::Organization

  validates :organization, :host, :port, :encryption, :user, :password, :user_id_field, :email_field, :presence => true

  def test_connection
    ldap = Net::LDAP.new
    ldap.host = self.host
    ldap.port = self.port
    ldap.auth self.connection_user, self.connection_password
    ldap.bind
  end

end
