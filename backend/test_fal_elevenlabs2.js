require('dotenv').config();
const axios = require('axios');
const config = require('./src/config');

async function test() {
  const models = [
    'elevenlabs/text-to-speech',
    'fal-ai/elevenlabs',
    'fal-ai/elevenlabs/text-to-speech',
    'eleven-labs/text-to-speech'
  ];
  
  for (const m of models) {
    try {
      console.log('Testing', m);
      const response = await axios({
        method: 'POST',
        url: `https://fal.run/${m}`,
        headers: {
          'Authorization': `Key ${config.falKey}`,
          'Content-Type': 'application/json',
        },
        data: { text: "테스트" }
      });
      console.log('SUCCESS:', m, response.data);
    } catch(err) {
      console.log('FAILED:', m, err.response?.data?.detail || err.message);
    }
  }
}
test();
