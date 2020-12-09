Sequel.migration do
  up do
    add_column :organizations, :owner_id, :uuid
    # Organization.send(:get_db_schema, true)
    ::User.filter(:organization_owner => true).all.each do |user|
      org = user.organization
      if org
        org.set(owner_id: user.id)
        org.save(:owner_id)
      end
    end
    drop_column :users, :organization_owner
  end

  down do
    add_column :users, :organization_owner, :boolean
    ::User.send(:get_db_schema, true)
    # Organization.all.each do |org|
    #   user = User[org.owner_id]
    #   if user
    #     user.set(organization_owner: true)
    #     user.save(:organization_owner)
    #   end
    # end
    drop_column :organizations, :owner_id
  end
end
