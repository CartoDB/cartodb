Sequel.migration do
  up do
    SequelRails.connection.run(%{
      CREATE INDEX synchronizations_visualization_id_idx ON synchronizations (visualization_id)
    })
  end

  down do
    SequelRails.connection.run(%{
      DROP INDEX IF EXISTS synchronizations_visualization_id_idx
    })
  end
end
