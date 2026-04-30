const url = "http://193.112.141.69:8082/en/trackIndex.htm";
fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }})
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 500)))
  .catch(err => console.error(err));
