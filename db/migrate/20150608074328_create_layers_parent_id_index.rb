Sequel.migration do
  up do
    SequelRails.connection.run(%Q{
      CREATE INDEX layers_parent_id_idx ON layers (parent_id)
    })
  end

  down do
    SequelRails.connection.run(%Q{
      DROP INDEX IF EXISTS layers_parent_id_idx
    })
  end

end
