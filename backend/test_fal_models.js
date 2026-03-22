require('dotenv').config();
const axios = require('axios');
const config = require('./src/config');

async function test() {
  const models = [
    'f5-tts',
    'fish-speech/text-to-speech',
    'playai/play-dialog',
    'coqui-tts',
    'gpt-sovits',
    'f5-tts/text-to-speech',
    'play-tts',
    'audio-ldm-2',
    'stable-audio'
  ];
  
  for (const m of models) {
    try {
      console.log('Testing', m);
      const url = `https://fal.run/fal-ai/${m}`;
      const response = await axios({
        method: 'POST',
        url: url,
        headers: {
          'Authorization': `Key ${config.falKey}`,
          'Content-Type': 'application/json',
        },
        data: { text: "테스트", input: "테스트" }
      });
      console.log('SUCCESS:', m);
    } catch(err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || err.message;
      if (!msg.includes('Application') && !msg.includes('not found')) {
         console.log('EXISTS BUT ERROR:', m, msg);
      }
    }
  }
}
test();
