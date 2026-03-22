require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const config = require('./src/config');

async function test() {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://fal.run/fal-ai/flux/dev/image-to-image',
      headers: {
        'Authorization': `Key ${config.falKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        image_url: "https://letsenhance.io/static/8f5e523ee6b2479e26629befae31699f/115ae/MagicSmatch_after.jpg", 
        prompt: "A beautiful scenery",
        strength: 0.85
      },
    });
    console.log('SUCCESS:', response.data);
  } catch (err) {
    console.log('ERROR:', err.response?.data || err.message);
  }
}
test();
