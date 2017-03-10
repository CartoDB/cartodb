module CartoGearsApi
  class Config
    def get_config(*config_chain)
      Cartodb.get_config(*config_chain)
    end
  end
end