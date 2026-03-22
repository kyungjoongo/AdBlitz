require('dotenv').config();
const axios = require('axios');
const config = require('./src/config');

async function test() {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://fal.run/fal-ai/eleven-labs/text-to-speech',
      headers: {
        'Authorization': `Key ${config.falKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        text: '안녕하세요 테스트입니다.',
        voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam
      }
    });
    console.log('SUCCESS:', response.data);
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}
test();
