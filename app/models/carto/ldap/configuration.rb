# encoding: UTF-8

# See http://www.rubydoc.info/gems/net-ldap/0.11
require 'net/ldap'

class Carto::Ldap::Configuration < ActiveRecord::Base

  # Not encrypted
  ENCRYPTION_NONE = nil
  # Encrypted from start
  ENCRYPTION_SIMPLE_TLS = 'simple_tls'
  # Upgrade to encrypted once connected
  ENCRYPTION_START_TLS = 'start_tls'

  ENCRYPTION_SSL_VERSION_DEFAULT = nil
  ENCRYPTION_SSL_VERSION_TLSV1_1 = 'TLSv1_1'

  DOMAIN_BASES_SEPARATOR = '||'

  self.table_name = 'ldap_configurations'

  belongs_to :organization, class_name: Carto::Organization

  # @param Uuid id  (Self-generated)
  # @param Uuid organization_id
  # @param String host LDAP host or ip address
  # @param Int port LDAP port e.g. 389, 636 (LDAPS)
  # @param String encryption (Optional) Encryption type to use. Empty means standard/simple Auth
  # @param String ca_file UNUSED FOR NOW -  (Optional) Certificate file path for start_tls encryption.
  #                       Example: "/etc/cafile.pem"
  # @param String ssl_version For start_tls_encryption. Example: "TLSv1_1"
  # @param String connection_user Full CN for "search connections" to LDAP: `CN=admin, DC=cartodb, DC=COM`
  # @param String connection_password Password for "search connections" to LDAP
  # @param String user_id_field Which LDAP entry field represents the user id. e.g. `sAMAccountName`, `uid`
  # @param String username_field Which LDAP entry field represents the username that will be mapped to cartodb.
  #                              For now, same as user_id_field
  # @param String email_field Which LDAP entry field represents the email
  # @param String domain_bases List of DCs conforming the path.
  #                            Serialized, e.g. "['a','b']", due to Rails 3 or PG gem issue handling `PG text[]` fields
  # @param String user_object_class Name of the attribute where the sers are maped in LDAP
  # @param String group_object_class Name of the attribute where the groups are maped in LDAP
  # @param DateTime created_at (Self-generated)
  # @param DateTime updated_at (Self-generated)

  attr_readonly :user_id_field

  validates :organization, :host, :port, :connection_user, :connection_password, :user_id_field, :username_field,
            :email_field, :user_object_class, :group_object_class, presence: true

  validates :ca_file, length: { minimum: 0, allow_nil: true }

  validates :encryption,  inclusion: { in: [ENCRYPTION_SIMPLE_TLS, ENCRYPTION_START_TLS], allow_nil: true }
  validates :ssl_version, inclusion: { in: [ENCRYPTION_SSL_VERSION_TLSV1_1], allow_nil: true }
  validate :domain_bases_not_empty

  def domain_bases_list
    domain_bases.split(DOMAIN_BASES_SEPARATOR) if domain_bases
  end

  def domain_bases_list=(list)
    self.domain_bases = list.join(DOMAIN_BASES_SEPARATOR)
  end

  # Returns matching Carto::Ldap::Entry or false if credentials are wrong
  # @param String username. No full CN, just the username, e.g. 'administrator1'
  # @param String password
  def authenticate(username, password)
    ldap_connection = Net::LDAP.new
    ldap_connection.host = self.host
    ldap_connection.port = self.port
    configure_encryption(ldap_connection)

    ldap_connection.auth self.connection_user, self.connection_password

    valid_ldap_entry = nil
    domain_bases_list.find do |domain|
      valid_ldap_entry = ldap_connection.bind_as(
        :base => domain,
        :filter => "(#{self.user_id_field}=#{username})",
        :password => password
      )
    end
    @last_authentication_result = ldap_connection.get_operation_result
    return false unless valid_ldap_entry

    Carto::Ldap::Entry.new(valid_ldap_entry.first, self)
  end

  # INFO: Resets connection if already made
  def test_connection
    result = ldap_connection(true).bind
    if result
      { success: true, connection: result }
    else
      { success: false, error: last_operation_result.to_hash }
    end
  rescue => exception
    { success: false, error: { message: exception.message } }
  end

  def users(objectClass = self.user_object_class)
    search_in_domain_bases(Net::LDAP::Filter.eq('objectClass', objectClass))
  end

  def groups(objectClass = self.group_object_class)
    search_in_domain_bases(Net::LDAP::Filter.eq('objectClass', objectClass))
  end

  def last_authentication_result
    @last_authentication_result.nil? ? nil : Carto::Ldap::OperationResult.new(
      @last_authentication_result.code, @last_authentication_result.error_message,
      @last_authentication_result.matched_dn, @last_authentication_result.message)
  end

  def last_operation_result
    ldap_result = ldap_connection.get_operation_result
    Carto::Ldap::OperationResult.new(ldap_result.code, ldap_result.error_message, ldap_result.matched_dn,
      ldap_result.message)
  end

  private

  def domain_bases_not_empty
    errors.add(:domain_bases, "No domain bases set") unless domain_bases.present?
    errors.add(:domain_bases_list, "Domain bases list empty") unless domain_bases_list.present?
  end

  def search_in_domain_bases(filter)
    domain_bases_list.map { |domain|
      search(domain, filter)
    }.flatten.compact
  end

  # @param String base DC to search at
  # @Param Net::LDAP::Filter filter (Optional)
  def search(base, filter = nil)
    if filter
      ldap_connection.search(base: base, filter: filter)
    else
      ldap_connection.search(base: base)
    end
  end

  # Performs connection always with the search connection user
  def ldap_connection(reset = false)
    @conn = nil if reset
    @conn ||= connect
  end

  # Connect, by default with the search connection user
  # @param String user full CN, like `CN=test_user, CN=developers, DC=cartodb, DC=COM`
  # @param String password Connection password
  # @throws InvalidConfigurationEncryptionError
  def connect(user = self.connection_user, password = self.connection_password)
    ldap = Net::LDAP.new
    ldap.host = self.host
    ldap.port = self.port
    configure_encryption(ldap)
    # implicity this does basic/simple auth if no encryption added above
    ldap.auth(user, password)
    ldap
  end

  def configure_encryption(ldap)
    tls_options = OpenSSL::SSL::SSLContext::DEFAULT_PARAMS

    case self.encryption
    when ENCRYPTION_NONE
      return
    when ENCRYPTION_START_TLS
      tls_options.merge!(:ca_file => self.ca_file) if self.ca_file
    when ENCRYPTION_SIMPLE_TLS
      # No special value needed
    else
      raise InvalidConfigurationEncryptionError.new(self.encryption)
    end

    tls_options.merge!(:verify_mode => OpenSSL::SSL::VERIFY_NONE)

    # Default value is "SSLv23" at the gem
    tls_options.merge!(:ssl_version => self.ssl_version) if self.ssl_version

    ldap.encryption(method: self.encryption.to_sym, tls_options: tls_options)
  end

end

class InvalidConfigurationEncryptionError < StandardError
  def initialize(incorrect_encryption_value)
    super("Invalid encryption value supplied: #{incorrect_encryption_value}. Valid values: [nil, '', '']")
  end
end
