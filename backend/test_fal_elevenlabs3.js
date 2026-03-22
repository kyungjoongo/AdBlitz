require('dotenv').config();
const axios = require('axios');
const config = require('./src/config');

async function test() {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://fal.run/fal-ai/elevenlabs`,
      headers: {
        'Authorization': `Key ${config.falKey}`,
        'Content-Type': 'application/json',
      },
      data: { text: "테스트", voice: "pNInz6obpgDQGcFmaJgB" }
    });
    console.log('SUCCESS:', response.data);
  } catch(err) {
    console.log('FAILED:', err.response?.data?.detail || err.message);
  }
}
test();
