require('dotenv').config();
const axios = require('axios');
const config = require('./src/config');

async function test() {
  const paths = ['playai/play-tts', 'playai/tts', 'play-ai/tts', 'fish-speech'];
  for (const p of paths) {
    try {
      console.log('Testing', p);
      const tempPath = `fal-ai/${p}`;
      const response = await axios({
        method: 'POST',
        url: `https://fal.run/${tempPath}`,
        headers: { 'Authorization': `Key ${config.falKey}`, 'Content-Type': 'application/json' },
        data: { input: "테스트" }
      });
      console.log('SUCCESS:', tempPath);
      return;
    } catch(err) {
      console.log('FAILED:', p, err.response?.data || err.message);
    }
  }
}
test();
