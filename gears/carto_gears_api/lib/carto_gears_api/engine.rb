module CartoGearsApi
  class Engine < ::Rails::Engine
    isolate_namespace CartoGearsApi

    lib_path = config.root.join('lib').to_s
    config.eager_load_paths << lib_path unless config.eager_load_paths.include?(lib_path)
  end
end
