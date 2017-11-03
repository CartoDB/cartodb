Sequel.migration do
  up do
    SequelRails::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'
    add_column :visualizations, :prev_id, :uuid, :null => true
    add_column :visualizations, :next_id, :uuid, :null => true
  end

  down do
    drop_column :visualizations, :prev_id
    drop_column :visualizations, :next_id
  end
end
