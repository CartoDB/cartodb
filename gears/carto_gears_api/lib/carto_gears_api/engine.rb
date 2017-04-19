module CartoGearsApi
  class Engine < ::Rails::Engine
    isolate_namespace CartoGearsApi

    config.autoload_paths << config.root.join('lib').to_s
    config.eager_load_paths << config.root.join('lib').to_s
  end
end
