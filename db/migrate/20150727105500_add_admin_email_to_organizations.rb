Sequel.migration do

  up do
    alter_table :organizations do
      add_column :admin_email, :text
    end

    Rails::Sequel.connection.run(%Q{
      update organizations o set admin_email = (select email from users u where o.owner_id = u.id);
    })
  end

  down do
    alter_table :organizations do
      drop_column :admin_email
    end
  end

end
