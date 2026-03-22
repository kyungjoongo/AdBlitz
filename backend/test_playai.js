require('dotenv').config();
const axios = require('axios');
const config = require('./src/config');

async function test() {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://fal.run/fal-ai/playai/play-dialog',
      headers: {
        'Authorization': `Key ${config.falKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        input: [
            { voice: "Cory", text: "여러분 안녕하세요, 이 제품 정말 대박입니다!" }
        ]
      }
    });
    console.log('SUCCESS:', response.data);
  } catch (err) {
    console.log('ERROR:', err.response?.data || err.message);
  }
}
test();
