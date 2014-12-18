Sequel.migration do
  up do

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX data_imports_users_id_idx ON data_imports (user_id)
    })
    Rails::Sequel.connection.run(%Q{
      CREATE INDEX data_imports_users_id_state_idx ON data_imports (user_id, state)
    })

  end

  down do

    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS data_imports_users_id_idx
    })
    
    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS data_imports_users_id_state_idx
    })

  end

end
