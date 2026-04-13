const url = 'https://photo.yupoo.com/hsquan996/d32ee6b4/small.jpeg';

async function test() {
  const fetchRes = await fetch(url, {
    headers: {
      'Referer': 'https://yupoo.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log(fetchRes.status);
}
test();
