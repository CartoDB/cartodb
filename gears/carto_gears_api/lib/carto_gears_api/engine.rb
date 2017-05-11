module CartoGearsApi
  class Engine < ::Rails::Engine
    isolate_namespace CartoGearsApi

    lib_path = config.root.join('lib').to_s
    if Rails.env.test?
      # In test environment, only load the required files to avoid including stuff with dependencies to CARTO
      config.autoload_paths << lib_path
    else
      config.eager_load_paths << lib_path unless config.eager_load_paths.include?(lib_path)
    end
  end
end
