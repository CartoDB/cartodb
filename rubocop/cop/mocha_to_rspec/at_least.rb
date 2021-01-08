module RuboCop
  module Cop
    module MochaToRSpec
      class Mock < Cop
        MSG = "Use `double` (rspec-mocks) instead of `mock` (Mocha)".freeze

        def on_send(node)
          _receiver, method_name, args = *node
          if method_name == :mock
            add_offense(node)
          end
        end

        def autocorrect(node)
          lambda do |corrector|
            corrector.replace(node.loc.selector, "double")
          end
        end
      end
    end
  end
end
