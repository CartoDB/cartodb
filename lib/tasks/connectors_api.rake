namespace :cartodb do
  namespace :connectors do
    desc 'Adapt connector synchronizations to the new API'
    task adapt_api: :environment do

      def get_ignoring_case(hash, key)
        _k, v = hash.find { |k, _v| k.to_s.casecmp(key.to_s) == 0 }
        v
      end

      # This is meant to be run before deploying the new API (#9674).
      # Some syncs may fail before deployment is done (because they expect the newer API),
      # but deployment will be hopefully done before they're retried, so they should succeed then.
      # No attempt is done to avoid changing 'dead' syncs (left 'created' or retried too many times).
      # This is idempotent and will do no harm to connectors that use the new API.
      Carto::Synchronization.where(service_name: 'connector').find_each do |sync|
        parameters = JSON.load(sync.service_item_id) rescue nil
        if parameters
          provider = get_ignoring_case(parameters, 'provider')
          if !provider
            puts "Adapting #{sync.id}"
            parameters['provider'] = 'odbc'
            sync.service_item_id = parameters.to_json
            sync.save!
          end
        end
      end
    end
  end
end
