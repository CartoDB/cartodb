Sequel.migration do
  up do
    SequelRails::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    # INFO: On purpose without indexes, constraints, etc.
    create_table :visualization_backups do
      String    :username,        null: false
      Uuid      :visualization,   null: false
      String    :export_vizjson,  null: false
      DateTime  :created_at,      default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :visualization_backups
  end
end
