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
        image_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...", // obviously invalid, let me use a tiny valid base64 jpeg
      },
    });
  } catch(e) {}
}
