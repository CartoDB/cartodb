Sequel.migration do
  up do
    drop_column :ldap_configurations, :domain_bases
    add_column :ldap_configurations, :domain_bases, :text, null: false
  end
  
  down do
    drop_column :ldap_configurations, :domain_bases
    add_column :ldap_configurations, :domain_bases, 'text[]', null: false
  end
end
