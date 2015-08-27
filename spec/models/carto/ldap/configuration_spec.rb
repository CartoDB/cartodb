# coding: UTF-8
require_relative '../../../spec_helper'

require 'fake_net_ldap'

describe Carto::Ldap::Configuration do
  include_context 'organization with users helper'

  before(:all) do
    @domain_bases = [ "dc=cartodb" ]

    @ldap_admin_username = 'user'
    @ldap_admin_cn = "cn=#{@ldap_admin_username},#{@domain_bases[0]}"
    @ldap_admin_password =  '666'

    @user_id_field = 'cn'
  end

  before(:each) do 
    FakeNetLdap.register_user(:username => @ldap_admin_cn, :password => @ldap_admin_password)
  end

  after(:each) do
    FakeNetLdap.clear_user_registrations
    FakeNetLdap.clear_query_registrations
  end

  it 'tests basic authentication' do
    auth_username = 'admin'
    auth_cn = "cn=#{auth_username},#{@domain_bases[0]}"
    auth_password = '123456'

    other_user_username = 'nobody2'
    other_user_cn = "cn=#{other_user_username},#{@domain_bases[0]}"
    other_user_password = 'nobodypass'

    ldap_configuration = Carto::Ldap::Configuration.create({
        organization_id: @organization.id,
        host: "0.0.0.0",
        port: 389,
        domain_bases: @domain_bases,
        connection_user: @ldap_admin_cn,
        connection_password: @ldap_admin_password,
        email_field: '.',
        user_object_class: '.',
        group_object_class: '.',
        user_id_field: @user_id_field
      })

    # This uses ldap_admin credentials
    ldap_configuration.test_connection.should eq true

    ldap_configuration.connection_user = 'wrong1'
    ldap_configuration.test_connection.should eq false

    ldap_configuration.reload
    ldap_configuration.connection_user = "cn=wrong2,#{@domain_bases[0]}"
    ldap_configuration.test_connection.should eq false

    ldap_configuration.reload
    ldap_configuration.connection_password = 'wrong'
    ldap_configuration.test_connection.should eq false

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

    # TODO: Test multiple accounts, that auths with first one (might not work well with the gem)

    ldap_configuration.delete
  end

  it 'Checks user search' do
    user_a_username = 'user-A'
    user_a_cn = "cn=#{user_a_username},#{@domain_bases[0]}"
    user_a_password = '123456'

    user_b_username = 'user-B'
    user_b_cn = "cn=#{user_b_username},#{@domain_bases[0]}"
    user_b_password = '789012'

    ldap_configuration = Carto::Ldap::Configuration.create({
        organization_id: @organization.id,
        host: "0.0.0.0",
        port: 389,
        domain_bases: @domain_bases,
        connection_user: @ldap_admin_cn,
        connection_password: @ldap_admin_password,
        email_field: '.',
        user_object_class: 'organizationalRole',
        group_object_class: '.',
        user_id_field: @user_id_field
      })

    register_ldap_user(user_a_cn, user_a_username, user_a_password, ldap_configuration.user_object_class)
    register_ldap_user(user_b_cn, user_b_username, user_b_password, ldap_configuration.user_object_class)

    pending 'not yet finished, this will only return one user'
    ldap_configuration.users.should_not eq false
    #ldap_configuration.users.count.should eq 2
  end

private

def register_ldap_user(cn, username, password, objectClass=nil)
  # Data to return as an LDAP result, that will be loaded into Carto::Ldap::Entry
  ldap_entry_data = { 
      @user_id_field => [username]
    }

  FakeNetLdap.register_user(:username => cn, :password => password)
  FakeNetLdap.register_query(Net::LDAP::Filter.eq('cn', username), ldap_entry_data)
  # For searches
  if objectClass
    FakeNetLdap.register_query(Net::LDAP::Filter.eq('objectClass', objectClass), ldap_entry_data)
  end
end

end
