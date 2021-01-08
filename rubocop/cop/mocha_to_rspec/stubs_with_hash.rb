module RuboCop
  module Cop
    module MochaToRSpec
      class StubsWithHash < Cop
        MSG = "Use `allow(...).to receive(...).and_return(...)` or `allow(...).to receive_messages` (rspec-mocks) instead of `stubs` (Mocha)".freeze

        def_node_matcher :candidate?, '(send _ {:stubs :expects} hash_type?)'

        def single_pair_hash?(node)
          return false unless node.class == RuboCop::AST::HashNode
          node.pairs.count == 1
        end

        def my_single?(*args)
          args.first.children.first.children.size == 1
        end

        def on_send(node)
          candidate?(node) do
            return false if node.source.include?("any_instance")
            add_offense(node, location: :selector)
          end
        end

        def autocorrect(node)
          lambda do |corrector|
            receiver, stubs_or_expects, args = *node
            message, _, _ = *args
            multi = args.hash_type? && args.pairs.count > 1
            k, v = message.children
            # The parser seems to handle 1.9 hashes differently... must be a better way though.
            key = if k.type == :sym  && k.source[0] != ':'
                    ":#{k.source}"
                  else
                    k.source
                  end
            value = v.source

            object = receiver.source
            allow_or_expect = if stubs_or_expects == :expects
                                "expect"
                              elsif stubs_or_expects == :stubs
                                "allow"
                              else
                                raise
                              end
            if multi
              corrector.replace(node.source_range, "#{allow_or_expect}(#{object}).to receive_messages(#{args.source})")
            else
              corrector.replace(node.source_range, "#{allow_or_expect}(#{object}).to receive(#{key}).and_return(#{value})")
            end
          end
        end
      end
    end
  end
end
