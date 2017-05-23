Sequel.migration do
  up do
    add_column :organizations, :color, :text
    
    SequelRails.connection.run(%Q{
      update organizations set color = '#227dbd' where name = 'team';
    })
  end

  down do
    drop_column :organizations, :color
  end
end

