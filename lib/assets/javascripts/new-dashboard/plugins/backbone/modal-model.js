export default function createModalModel (handlers) {
  return {
    create: handlers.create,
    destroy: handlers.destroy
  };
}
