Sequel.migration do
  up do
    SequelRails.connection.run("UPDATE layers SET updated_at = NOW() WHERE updated_at IS NULL")
  end
  
  down do
  end
end
