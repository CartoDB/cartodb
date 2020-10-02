namespace :cartodb do
  namespace :tables do
    desc 'Set the bounding box for the canonical tables of the user'
    task :set_bounding_box, [:user_id] => :environment do |_t, args|
      user_id = args[:user_id]
      raise Exception.new('User id is a mandatory parameter') if user_id.nil?

      puts "Setting bounding boxes for canonical of the user #{user_id}..."
      user = Carto::User.find(user_id)
      table_names = SequelRails.connection.fetch(
        %{SELECT name FROM user_tables WHERE user_tables.user_id = ?}, user_id
      )
      updated = 0
      table_names.each do |table_name|
        table = Helpers::TableLocator.new.get_by_id_or_name(table_name[:name], user)
        table.update_bounding_box
        updated += 1
      end
      puts "Updated #{updated} tables"
    end
  end
end # namespace :cartodb
