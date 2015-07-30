class Carto::Ldap::Entry

  def initialize(ldap_entry, ldap_configuration)
    @entry = ldap_entry
    @configuration = ldap_configuration
  end

  def user_id
    extract_field(@configuration.user_id_field)
  end

  def username
    extract_field(@configuration.username_field)
  end

  def email
    extract_field(@configuration.email_field)
  end

  private

  def extract_field(field)
    value = @entry[field]
    value.nil? ? nil : value.first
  end

end
