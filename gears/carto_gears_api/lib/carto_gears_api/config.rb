module CartoGearsApi
  class Config
    # @param config_chain [Array] Array with symbols.
    # @return [String] Configuration value, or `nil` if it's not set.
    def get_config(*config_chain)
      chain = stringify_all_but_first(config_chain)
      Cartodb.get_config(*chain)
    end

    private

    def stringify_all_but_first(chain)
      [chain[0]] + chain[1..-1].map(&:to_s)
    end
  end
end

