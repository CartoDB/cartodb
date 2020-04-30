export function getCurrentIPAddress () {
  return fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(response => response.ip);
}
