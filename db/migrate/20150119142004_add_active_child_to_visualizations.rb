Sequel.migration do
  up do
    Rails::Sequel::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    add_column :visualizations, :active_child, :uuid, null: true
  end
  down do
    drop_column :visualizations, :active_child
  end
end
