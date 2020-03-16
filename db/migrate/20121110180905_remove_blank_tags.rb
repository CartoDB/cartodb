Sequel.migration do
  up do
    run "DELETE FROM tags where name = ''"
  end

  down do
  end
end
