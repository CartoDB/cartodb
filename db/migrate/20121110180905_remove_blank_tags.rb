Sequel.migration do
  up do
    Tag.db.run("DELETE FROM tags where name = ''")
  end
  
  down do
  end
end
