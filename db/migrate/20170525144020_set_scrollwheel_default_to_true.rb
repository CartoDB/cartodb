Sequel.migration do
  up do
    set_column_default :maps, :scrollwheel, true
  end

  down do
    set_column_default :maps, :scrollwheel, false
  end
end
