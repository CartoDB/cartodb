Sequel.migration do
  up do
    SequelRails.connection.run("CREATE INDEX geocodings_user_id_created_at ON geocodings(user_id, created_at)")
  end
  
  down do
    SequelRails.connection.run("DROP INDEX geocodings_user_id_created_at")
  end
end
