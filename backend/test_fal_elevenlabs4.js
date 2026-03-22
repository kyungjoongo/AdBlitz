require('dotenv').config();
const axios = require('axios');
const config = require('./src/config');

async function test() {
  const paths = ['elevenlabs/tts', 'elevenlabs/generate', 'elevenlabs/speech', 'eleven-labs/tts', 'eleven-labs/text-to-speech'];
  
  for (const p of paths) {
    try {
      console.log('Testing', p);
      const tempPath = `fal-ai/${p}`;
      const response = await axios({
        method: 'POST',
        url: `https://fal.run/${tempPath}`,
        headers: {
          'Authorization': `Key ${config.falKey}`,
          'Content-Type': 'application/json',
        },
        data: { text: "테스트" }
      });
      console.log('SUCCESS:', tempPath, response.data);
      return;
    } catch(err) {
      console.log('FAILED:', p, err.response?.data?.detail || err.response?.status || err.message);
    }
  }
}
test();
