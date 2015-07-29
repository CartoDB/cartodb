# encoding: UTF-8

# See http://www.rubydoc.info/gems/net-ldap/0.11
require 'net/ldap'

class Carto::LdapConfiguration < ActiveRecord::Base

  belongs_to :organization, class_name: Carto::Organization

  validates :organization, :host, :port, :connection_user, :connection_password, :user_id_field, :email_field, :presence => true
  validates :ca_file, :username_field, :user_groups, :length => { :minimum => 0, :allow_nil => true }
  validates :domain_bases, :length => { :minimum => 1, :allow_nil => false }
  validates :encryption, :inclusion => { :in => %w( start_tls simple_tls ), :allow_nil => true }
  validates :ssl_version, :inclusion => { :in => %w( TLSv1_1 ), :allow_nil => true }

  # Returns matching Net::LDAP::Entry or false if credentials are wrong
  def authenticate(username, password)
    username_filter = "cn=#{username}"

    domain_base = self.domain_bases.find { |d|
      connect("#{username_filter},#{d}", password).bind
    }

    domain_base.nil? ? false : search(domain_base, username_filter).first
  end

  def get_user_id(ldap_entry)
    extract_field(ldap_entry, self.user_id_field)
  end

  def get_username(ldap_entry)
    extract_field(ldap_entry, self.username_field)
  end

  def get_email(ldap_entry)
    extract_field(ldap_entry, self.email_field)
  end

  def test_connection
    connection.bind
  end

  def users(objectClass = 'organizationalRole')
    search_in_domain_bases("objectClass=#{objectClass}")
  end

  def groups(objectClass = 'organization')
    search_in_domain_bases("objectClass=#{objectClass}")
  end

  # TODO: make private?
  def extract_field(ldap_entry, field)
    value = ldap_entry[field]
    value.nil? ? nil : value.first
  end

  # TODO: make private?
  def search_in_domain_bases(filter)
    domain_bases.map { |d|
      search(d, filter)
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

  def connect(user = self.connection_user, password = self.connection_password)
    ldap = Net::LDAP.new
    ldap.host = self.host
    ldap.port = self.port
    configure_encryption(ldap)
    ldap.auth(user, password)
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
