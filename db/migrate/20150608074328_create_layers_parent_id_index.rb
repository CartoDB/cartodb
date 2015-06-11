Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      CREATE INDEX layers_parent_id_idx ON layers (parent_id)
    })
  end

  down do
    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS layers_parent_id_idx
    })
  end

end
