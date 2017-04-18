module CartoGearsApi
  class Engine < ::Rails::Engine
    isolate_namespace CartoGearsApi

    config.autoload_paths << config.root.join('lib')
  end
end
