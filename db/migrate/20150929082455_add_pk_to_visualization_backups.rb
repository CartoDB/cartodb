Sequel.migration do
  up do
    Rails::Sequel.connection.run("ALTER TABLE visualization_backups ADD PRIMARY KEY (visualization)")
  end

  down do
    Rails::Sequel.connection.run("ALTER TABLE visualization_backups DROP CONSTRAINT visualization_backups_pkey")
  end
end
