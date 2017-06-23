Sequel.migration do
  up do

    SequelRails.connection.run(%Q{
      CREATE INDEX users_organization_id_idx ON users (organization_id)
    })

  end

  down do

    SequelRails.connection.run(%Q{
      DROP INDEX IF EXISTS users_organization_id_idx
    })

  end

end
