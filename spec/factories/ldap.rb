FactoryBot.define do

  factory :ldap_configuration, :class => Carto::Ldap::Configuration do
    host { '0.0.0.0' }
    port { 389 }
    domain_bases_list { ['dc=cartodb'] }
    connection_user { 'ldap_conn_user' }
    connection_password { 'ldap_conn_pass' }
    email_field { '.' }
    user_object_class { '.' }
    group_object_class { '.' }
    user_id_field { 'user_id_field' }
    username_field { 'user_id_field' }
  end

end
