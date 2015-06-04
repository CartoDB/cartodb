namespace :cartodb do
  namespace :vizs do

    desc "Purges broken visualizations due to bug during deletion."
    task :delete_inconsistent, [:username] => :environment do |t, args|
      username = args[:username]
      raise "You should pass a username param" unless username
      user = User[username: username]
      collection = CartoDB::Visualization::Collection.new.fetch(user_id: user.id)

      collection.each do |viz|
        if is_inconsistent?(viz)
          delete_with_confirmation(viz)
        end
      end
    end

    desc "Create named maps for all eligible existing visualizations"
    task :create_named_maps, [:dry_run] => :environment do |t, args|
      dry_run = args[:dry_run] == 'true'

      puts "Dry run of create_named_maps rake" if dry_run

      collection = CartoDB::Visualization::Collection.new.fetch({
        'types' => [CartoDB::Visualization::Member::TYPE_CANONICAL, CartoDB::Visualization::Member::TYPE_DERIVED],
        per_page: CartoDB::Visualization::Collection::ALL_RECORDS
        })

      puts "Fetched ##{collection.count} items"

      collection.each do |viz|
        begin
          viz.store unless dry_run
          puts "OK:  #{CartoDB::NamedMapsWrapper::NamedMap::normalize_name(viz.id)}"
        rescue ex
          puts "ERR: #{viz.id}"
          puts ex.inspect
        end
      end

      puts "\nFinished"
    end

    private

    def is_inconsistent?(viz)
      (viz.table? && viz.related_tables.empty?) || (viz.derived? && viz.map.nil?)
    end

    def delete_with_confirmation(viz)
      display_info(viz)
      if ok_to_delete?
        viz.delete
        STDOUT.puts "deleted!"
      end
    end

    def display_info(viz)
      STDOUT.puts "\nviz.name = #{viz.name}"
      STDOUT.puts "viz.type = #{viz.type}"
      STDOUT.puts "viz.related_tables = #{viz.related_tables.map {|t| t.name}}"
      STDOUT.puts "viz.map_id = #{viz.map_id}"
    end

    def ok_to_delete?
      STDOUT.puts "About to delete. Are you sure? (y/n)"
      input = STDIN.gets.strip
      return input == 'y'
    end
    
  end
end
