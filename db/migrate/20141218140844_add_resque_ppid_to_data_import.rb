Sequel.migration do
  up do
    add_column :data_imports, :resque_ppid, :integer 
  end

  down do
    drop_column :data_imports, :resque_ppid    
  end
end
