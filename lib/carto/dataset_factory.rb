# encoding: utf-8

module Carto
  # This class is in lib/carto because there's no 'Dataset' model in CARTO. The
  # idea here is to provide an abstract interface that allows the programmer to
  # take distance with the underlying 'table type visualization' and focus on
  # the product concept of 'Dataset'. This should NOT be an entry point to
  # solving problems with the visualization model. There is no such thing as a
  # 'Dataset' outside of the product scope, which may very well disappear or
  # change in the future
  class DatasetFactory
    def initialize(user:, metadata:)
      @user = user
      @metadata = metadata
    end

    def dataset_visualization
      @visualization ||= Carto::Visualization.new(
        type: 'table',
        user: @user,
        name: name,
        description: description,
        attributions: attributions,
        source: source,
        privacy: privacy,
        tags: tags
      )
    end

    private

    def info
      @info ||= @metadata[:info]
    end

    def name
      @name ||= (info && info[:name])
    end

    def description
      @description ||= (info && info[:description])
    end

    def attributions
      @attributions ||= (info && info[:attributions])
    end

    def source
      @source ||= (info && info[:source])
    end

    def classification
      info && info[:classification]
    end

    def tags
      classification && classification[:tags]
    end

    def publishing
      @publishing ||= @metadata[:publishing]
    end

    def privacy
      @privacy ||= publishing && publishing[:privacy]
    end
  end
end
