# encoding: UTF-8

require 'net/ldap'

class Carto::LdapConfiguration < ActiveRecord::Base

  belongs_to :organization, class_name: Carto::Organization

  validates :organization, :host, :port, :connection_user, :connection_password, :user_id_field, :email_field, :presence => true
  validates :ca_file, :username_field, :user_groups, :length => { :minimum => 0, :allow_nil => true }
  validates :domain_bases, :length => { :minimum => 1, :allow_nil => false }
  validates :encryption, :inclusion => { :in => %w( start_tls simple_tls ), :allow_nil => true }
  validates :ssl_version, :inclusion => { :in => %w( TLSv1_1 ), :allow_nil => true }

  def test_connection
    connection.bind
  end

  def users(objectClass = 'organizationalRole')
    search_in_domain_bases(objectClass)
  end

  def groups(objectClass = 'organization')
    search_in_domain_bases(objectClass)
  end

  # TODO: make private?
  def search_in_domain_bases(filter)
    domain_bases.map { |d|
      search(d, "objectClass=#{objectClass}")
    }.flatten
  end

  # TODO: make private?
  def search(base, filter = nil)
    if filter
      connection.search(base: base, filter: filter)
    else
      connection.search(base: base)
    end
  end

  private

  def connection
    @conn ||= connect
  end

  def connect
    ldap = Net::LDAP.new
    ldap.host = self.host
    ldap.port = self.port
    configure_encryption(ldap)
    ldap.auth self.connection_user, self.connection_password
    ldap
  end

  def configure_encryption(ldap)
    return unless self.encryption

    encryption = self.encryption.to_sym

    tls_options = OpenSSL::SSL::SSLContext::DEFAULT_PARAMS
    case encryption
    when :start_tls
    when :simple_tls
      tls_options.merge!(:verify_mode => OpenSSL::SSL::VERIFY_NONE)
    end
    tls_options.merge!(:ca_file => self.ca_file) if self.ca_file
    tls_options.merge!(:ssl_version => self.ssl_version) if self.ssl_version
    ldap.encryption(method: encryption, tls_options: tls_options)
  end

end
