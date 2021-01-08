module RuboCop
  module Cop
    module MochaToRSpec
      class AtLeast < Cop
        MSG = "Use `at_least(:once)` (rspec-mocks) instead of `at_least_once` (Mocha)".freeze

        def on_send(node)
          _receiver, method_name, _args = *node
          if method_name == :at_least_once
            add_offense(node)
          end
        end

        def autocorrect(node)
          lambda do |corrector|
            corrector.replace(node.loc.selector, "at_least(:once)")
          end
        end
      end
    end
  end
end
