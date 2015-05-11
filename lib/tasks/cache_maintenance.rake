namespace :cartodb do
  namespace :cache do
    desc "invalidate Varnish surrogate key"
    task :invalidate_surrogate_key, [:key] => :environment do |t, args|
      CartoDB::Varnish.new.purge_surrogate_key(args[:key])
    end
  end
end
