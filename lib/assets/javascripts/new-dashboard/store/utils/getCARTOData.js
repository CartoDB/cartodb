export default function getCARTOData () {
  if (window.CartoConfig) {
    return window.CartoConfig.data;
  }

  return {
    user_data: window.user_data
  };
}
