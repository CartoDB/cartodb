# coding: UTF-8
require_relative '../../../spec_helper'

require 'fake_net_ldap'

describe Carto::Ldap::Configuration do
  include_context 'organization with users helper'


  it 'tests basic authentication' do
    domain_bases = [ "dc=cartodb" ]

    ldap_admin_username = 'user'
    ldap_admin_cn = "cn=#{ldap_admin_username},#{domain_bases[0]}"
    ldap_admin_password =  '666'

    auth_username = 'admin'
    auth_cn = "cn=#{auth_username},#{domain_bases[0]}"
    auth_password = '123456'

    ldap_configuration = Carto::Ldap::Configuration.create({
        organization_id: @organization.id,
        host: "0.0.0.0",
        port: 389,
        domain_bases: domain_bases,
        connection_user: ldap_admin_cn,
        connection_password: ldap_admin_password,
        email_field: '.',
        user_object_class: '.',
        group_object_class: '.',
        user_id_field: 'cn'
      })

    FakeNetLdap.register_user(:username => ldap_admin_cn, :password => ldap_admin_password)

    # This uses ldap_admin credentials
    ldap_configuration.test_connection.should eq true

    FakeNetLdap.register_user(:username => auth_cn, :password => auth_password)

    filter = Net::LDAP::Filter.eq('cn', auth_username)
    FakeNetLdap.register_query(filter, 
      # Data to return as an LDAP result, that will be loaded into Carto::Ldap::Entry
      { 
        ldap_configuration.user_id_field => [auth_username]
      })

    result = ldap_configuration.authenticate(auth_username, auth_password)

    result.should_not eq false
    result.class.should eq Carto::Ldap::Entry
    result.user_id.should eq auth_username

    ldap_configuration.delete
  end

end
