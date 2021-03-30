require 'spec_helper_unit'
require 'fake_net_ldap'
require_relative '../../../lib/fake_net_ldap_bind_as'

describe Carto::Ldap::Configuration do
  before do
    @organization = create(:organization_with_users)
    @domain_bases = [ "dc=cartodb" ]

    @ldap_admin_username = 'user'
    @ldap_admin_cn = "cn=#{@ldap_admin_username},#{@domain_bases[0]}"
    @ldap_admin_password =  '666'

    @user_id_field = 'cn'
    FakeNetLdap.register_user(:username => @ldap_admin_cn, :password => @ldap_admin_password)
  end

  it 'returns right away if empty user' do
    ldap = Carto::Ldap::Configuration.new
    ldap.authenticate('', 'something').should eq false
  end

  it 'returns right away if empty password' do
    ldap = Carto::Ldap::Configuration.new
    ldap.authenticate('some@one.es', '').should eq false
  end

  it 'tests basic authentication' do
    auth_username = 'admin'
    auth_cn = "cn=#{auth_username},#{@domain_bases[0]}"
    auth_password = '000123456'

    other_user_username = 'nobody2'
    other_user_cn = "cn=#{other_user_username},#{@domain_bases[0]}"
    other_user_password = 'nobodypass'

    ldap_configuration = Carto::Ldap::Configuration.create({
        organization_id: @organization.id,
        host: "0.0.0.0",
        port: 389,
        domain_bases_list: @domain_bases,
        connection_user: @ldap_admin_cn,
        connection_password: @ldap_admin_password,
        email_field: '.',
        user_object_class: '.',
        group_object_class: '.',
        user_id_field: @user_id_field,
        username_field: @user_id_field
      })

    # This uses ldap_admin credentials
    ldap_configuration.test_connection[:success].should eq true

    ldap_configuration.connection_user = 'wrong1'
    ldap_configuration.test_connection[:success].should eq false

    ldap_configuration.reload
    ldap_configuration.connection_user = "cn=wrong2,#{@domain_bases[0]}"
    ldap_configuration.test_connection[:success].should eq false

    ldap_configuration.reload
    ldap_configuration.connection_password = 'wrong'
    ldap_configuration.test_connection[:success].should eq false

    register_ldap_user(auth_cn, auth_username, auth_password)

    result = ldap_configuration.authenticate(auth_username, auth_password)

    result.should_not eq false
    result.class.should eq Carto::Ldap::Entry
    result.user_id.should eq auth_username

    # Add other user
    register_ldap_user(other_user_cn, other_user_username, other_user_password)

    result = ldap_configuration.authenticate(auth_username, auth_password)
    result.should_not eq false
    result.user_id.should eq auth_username

    result = ldap_configuration.authenticate(other_user_username, other_user_password)
    result.should_not eq false
    result.user_id.should eq other_user_username

    # Test connection error
    Net::LDAP.any_instance.stubs(:bind_as).raises(Net::LDAP::Error.new)
    result = ldap_configuration.authenticate(auth_username, auth_password)
    result.should be_false

    ldap_configuration.delete
  end

  it 'Checks user search' do
    user_a_username = 'user-A'
    user_a_cn = "cn=#{user_a_username},#{@domain_bases[0]}"
    user_a_password = '000123456'

    user_b_username = 'user-B'
    user_b_cn = "cn=#{user_b_username},#{@domain_bases[0]}"
    user_b_password = '789012'

    ldap_configuration = Carto::Ldap::Configuration.create({
        organization_id: @organization.id,
        host: "0.0.0.0",
        port: 389,
        domain_bases_list: @domain_bases,
        connection_user: @ldap_admin_cn,
        connection_password: @ldap_admin_password,
        email_field: '.',
        user_object_class: 'organizationalRole',
        group_object_class: '.',
        user_id_field: @user_id_field,
        username_field: @user_id_field
      })

    register_ldap_user(user_a_cn, user_a_username, user_a_password)
    register_ldap_user(user_b_cn, user_b_username, user_b_password)

    ldap_search_user_entries = [
      { @user_id_field => [user_a_username] },
      { @user_id_field => [user_b_username] }
    ]
    FakeNetLdap.register_query(Net::LDAP::Filter.eq('objectClass', ldap_configuration.user_object_class),
      ldap_search_user_entries)

    ldap_configuration.users.should_not eq false
    ldap_configuration.users.count.should eq 2
    search_results = ldap_configuration.users.map { |user_data|
      user_data['cn'].first
    }
    search_results.should eq [ user_a_username, user_b_username ]

    ldap_configuration.delete
  end

  it "Doens't allows to change user_id_field once set" do
    # Dumb spec, but to make sure if this gets changed we notice
    ldap_configuration = Carto::Ldap::Configuration.create({
        organization_id: @organization.id,
        host: "0.0.0.0",
        port: 389,
        domain_bases_list: @domain_bases,
        connection_user: @ldap_admin_cn,
        connection_password: @ldap_admin_password,
        email_field: '.',
        user_object_class: 'organizationalRole',
        group_object_class: '.',
        user_id_field: @user_id_field,
        username_field: @user_id_field
      })

    ldap_configuration.user_id_field = "modified"
    ldap_configuration.save
    ldap_configuration.reload
    ldap_configuration.user_id_field.should eq @user_id_field

    ldap_configuration.delete
  end

private

def register_ldap_user(cn, username, password)
  ldap_entry_data = {
    dn: cn,
    @user_id_field => [username]
  }
  # Data to return as an LDAP result, that will be loaded into Carto::Ldap::Entry
  FakeNetLdap.register_user(:username => cn, :password => password)
  FakeNetLdap.register_query(Net::LDAP::Filter.eq('cn', username), [ldap_entry_data])
end

end
