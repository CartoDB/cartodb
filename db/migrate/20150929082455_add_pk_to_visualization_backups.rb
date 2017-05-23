Sequel.migration do
  up do
    SequelRails.connection.run("ALTER TABLE visualization_backups ADD PRIMARY KEY (visualization)")
  end

  down do
    SequelRails.connection.run("ALTER TABLE visualization_backups DROP CONSTRAINT visualization_backups_pkey")
  end
end
