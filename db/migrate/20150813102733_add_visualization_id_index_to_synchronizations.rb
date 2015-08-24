Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      CREATE INDEX synchronizations_visualization_id_idx ON synchronizations (visualization_id)
    })
  end

  down do
    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS synchronizations_visualization_id_idx
    })
  end
end
