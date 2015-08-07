# Fake migration to avoid CI server issues, does nothing
Sequel.migration do
  up do
  end
  down do
  end
end
