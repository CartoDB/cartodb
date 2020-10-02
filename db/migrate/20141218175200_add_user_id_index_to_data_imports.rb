Sequel.migration do
  up do
    SequelRails.connection.run(%{
      CREATE INDEX data_imports_users_id_idx ON data_imports (user_id)
    })
    SequelRails.connection.run(%{
      CREATE INDEX data_imports_users_id_state_idx ON data_imports (user_id, state)
    })
  end

  down do
    SequelRails.connection.run(%{
      DROP INDEX IF EXISTS data_imports_users_id_idx
    })

    SequelRails.connection.run(%{
      DROP INDEX IF EXISTS data_imports_users_id_state_idx
    })
  end
end
