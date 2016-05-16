Sequel.migration do
  up do
    Rails::Sequel.connection.run(%{
      ALTER TABLE visualization_exports alter column user_id drop not null;
    })
  end

  down do
    Rails::Sequel.connection.run(%{
      ALTER TABLE visualization_exports alter column user_id set not null;
    })
  end
end
