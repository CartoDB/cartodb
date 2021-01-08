module RuboCop
  module Cop
    module MochaToRSpec
      class StubsWithNoReturn < Cop
        MSG = "Use `allow(...).to receive(...)` (rspec-mocks) instead of `stubs` (Mocha)".freeze

        def_node_matcher :candidate?, <<-NODE_PATTERN
          $(send $(...) {:stubs :expects} sym_type?)
        NODE_PATTERN

        def on_send(node)
          candidate?(node) do |_match, stubs_receiver|
            _receiver, method_name, _args = *stubs_receiver
            return if method_name == :any_instance
            return if node.parent&.parent&.source&.include?(".returns")

            add_offense(node)
          end
        end

        def autocorrect(node)
          lambda do |corrector|
            receiver, stubs_or_expects, args = *node
            message, _, _ = *args
            object = receiver.source
            variant = case stubs_or_expects
                      when :stubs
                        "allow"
                      when :expects
                        "expect"
                      else
                        raise "Got #{stubs_or_expects}"
                      end
            corrector.replace(node.source_range, "#{variant}(#{object}).to receive(:#{message})")
          end
        end
      end
    end
  end
end
