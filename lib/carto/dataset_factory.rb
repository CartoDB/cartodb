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
    def initialize(user:)
      @user = user
    end

    def with_name(name)
      visualization.name = name

      self
    end

    def with_description(description)
      visualization.description = description

      self
    end

    def with_attributions(attributions)
      visualization.attributions = attributions

      self
    end

    def with_tags(tags)
      visualization.tags = tags

      self
    end

    def with_privacy(privacy)
      visualization.privacy = privacy

      self
    end

    def visualization
      @visualization ||= Carto::Visualization.new(type: 'table', user: @user)
    end
  end
end
