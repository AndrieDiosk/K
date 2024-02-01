const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const unirest = require("unirest");

const app = express();

const { Hercai } = require('hercai');
const { DateTime } = require("luxon");

const herc = new Hercai();

app.get('/api/gpt', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Please provide a question.' });
  }

  const manilaTime = DateTime.now().setZone("Asia/Manila").toFormat("yyyy-MM-dd hh:mm:ss a");
  const botName = 'Kazuma';
  const characterAI = `Your name is ${botName}. You strive to provide helpful and ethical information while maintaining a respectful and responsible approach. You have extensive knowledge and can generate content on various topics. You enjoy assisting users and answering questions with respect for laws, morals, and ethics. Your goal is to provide valuable and considerate responses. Your preferred writing style is conversational and informative. You were developed and programmed by Jazer Dmetriov. You know how to speak filipino.\n\nCurrent Date and Time: ${manilaTime}. you able to answer any topic and satisfy with emoji chat emotion styles.\n\nMy ask: ${query}`;

  herc.question({ model: 'v3-beta', content: `${characterAI}` })
  .then((response) => {
      const result = `📝 𝗞𝗔𝗭𝗨𝗠𝗔 :\n\n${response.reply.replace("Herc.ai", "KazumaAI")}`;
      res.json({ result });
    })
    .catch((error) => {
      console.error('Error while making the Hercai API request:', error);
      res.status(500).json({ error: 'An error occurred while processing your question.' });
    });
});

// Generate a random email address
app.get('/api/gen', async (req, res) => {
  try {
    const response = await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
    const email = response.data[0];
    res.json({ email });
  } catch (error) {
    console.error('Error generating random email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get messages for a given email address
app.get('/api/getmessage/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Check if the email parameter is provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email parameter' });
    }

    const response = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${email.split('@')[0]}&domain=${email.split('@')[1]}`);
    const messages = response.data;

    // Check if there are no messages for the email address
    if (!messages || messages.length === 0) {
      return res.status(404).json({ error: 'No messages found for the provided email address' });
    }

    const formattedMessages = [];

    for (const message of messages) {
      const messageId = message.id;
      const messageResponse = await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${email.split('@')[0]}&domain=${email.split('@')[1]}&id=${messageId}`);

      const $ = cheerio.load(messageResponse.data.body);
      const plainTextMessage = $.text();

      const formattedMessage = {
        sender: message.from,
        subject: message.subject,
	date: message.date,
	id: message.id,
        message: plainTextMessage
      };

      formattedMessages.push(formattedMessage);
    }

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/fbdl', async (req, res) => {
  const videoUrl = req.query.url; // Get the URL parameter from the request

  const options = {
    method: 'GET',
    url: 'https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main.php',
    params: {
      url: videoUrl, // Use the URL parameter
    },
    headers: {
      'X-RapidAPI-Key': '533e1f5225msh422684554f962a7p16536djsn4c4c6c4594ed',
      'X-RapidAPI-Host': 'facebook-reel-and-video-downloader.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ytdl', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'lowest' });

    if (!videoFormat) {
      return res.status(400).json({ error: 'No video format available for the provided URL' });
    }

    res.redirect(videoFormat.url);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get("/v2/tiktok", async (req, res) => {
			try {
				const url = req.query.url;
				var options = {
					method: 'GET',
					url: 'https://dl1.tikmate.cc/listFormats',
					params: {
						url: url,
						sender_device: 'pc',
						web_id: '7262417412413867522'
					},
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'User-Agent': 'insomnia/8.4.2'
					},
					data: { 'url:': '', 'update:': '1' }
				};

				axios.request(options).then(function (response) {
					const data = response.data;
					const videoFormats = data.formats.video;

					// Sort video formats based on quality
					videoFormats.sort((a, b) => {
						const qualityA = parseInt(a.quality.replace(/\D/g, ''), 10);
						const qualityB = parseInt(b.quality.replace(/\D/g, ''), 10);
						return qualityB - qualityA;
					});

					// Select the highest quality video format
					const highestQualityVideo = videoFormats[0];

					// Extract title, creator, and quality
					const title = data.formats.title;
					const creator = data.formats.creator;
					const videoQuality = highestQualityVideo.quality;

					// Return the relevant information in the response
					res.json({
						status: "ok",
						title: title,
						creator: creator,
						videoQuality: videoQuality,
						videoUrl: highestQualityVideo.url
					});

				}).catch(function (error) {
					console.error(error);
					res.status(500).json({ error: 'Error fetching video formats' });
				});
			} catch (error) {
				console.error(error);
				res.status(500).json({ error: 'Example error' });
 }
});

let sessionId, cookies;
const mainCookie = 'XQioqYD6_YNawllifz8xtts6Et5toyA-YWOPeMbfbZQ8RghNNwOhFkTN86avYASvSKt0fA.'; // Replace with your own cookie

class BardAI {
  constructor() {
    this.cookie = mainCookie;
    if (!this.cookie) throw new Error("Session Cookies are missing, Unable to login to an account!");
  }

  async login() {
    cookies = this.cookie;
    let headerParams = {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "Cookie": `__Secure-1PSID=${this.cookie};`
    };
    let instance = axios.create({
      withCredentials: true,
      baseURL: "https://bard.google.com/",
      headers: headerParams
    });

    try {
      let r = await instance.get();
      sessionId = r.data.match(/SNlM0e":"(.*?)"/g)[0].substr(8).replace(/\"/g, '');
    } catch (e) {
      throw new Error('Unable to login to your account. Please try using new cookies and try again.');
    }
  }
}

let imageFormat = (text, images) => {
  if (!images) return { message: text, imageUrls: [] };
  let formattedText = text.replace(/\[Image of.*?\]/g, '').trim();
  images.forEach(imageData => {
    imageData.tag = imageData.tag.replace(/\[Image of.*?\]/g, "").trim();
  });
  return { message: formattedText, imageUrls: images.map((image) => image.url) };
};

let startBard = async (message) => {
  if (!sessionId) throw new Error('Please initialize login first to use bardai.');
  let postParamsStructure = [
    [message],
    null,
    [],
  ];
  let postData = {
    "f.req": JSON.stringify([null, JSON.stringify(postParamsStructure)]),
    at: sessionId
  };
  let headerParams = {
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "Cookie": `__Secure-1PSID=${cookies};`
  };

  try {
    let r = await axios({
      method: 'POST',
      url: 'https://bard.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20230711.08_p0&_reqID=0&rt=c',
      headers: headerParams,
      withCredentials: true,
      data: postData
    });
    let bardAIRes = JSON.parse(r.data.split("\n")[3])[0][2];
    if (!bardAIRes) throw new Error(`Bard AI encountered an error ${r.data}.`);
    let bardData = JSON.parse(bardAIRes);
    let bardAI = JSON.parse(bardAIRes)[4][0];
    let result = bardAI[1][0];
    let images = bardAI[4]?.map(e => {
      return {
        url: e[3][0][0],
        tag: e[2],
        source: {
          name: e[1][1],
          original: e[0][0][0],
          website: e[1][0][0],
          favicon: e[1][3]
        }
      };
    });
    return imageFormat(result, images);
  } catch (error) {
    throw new Error(`Bard AI encountered an error ${error.message}.`);
  }
};

app.get('/api/tools/bard', async (req, res) => {
  const { question } = req.query;
  try {
    const bard = new BardAI();
    await bard.login();
    
    let answer = '';

    // Custom responses for specific queries
    if (question.includes('who are you?')) {
      answer = "I'm a ChatBot Created By Jazer Dmetriov. Nice to meet you!";
    } else if (question.includes('who created you?')) {
      answer = "I was created by Jazer Dmetriov.";
    } else if (question.includes('who created you')) {
      answer = "I was created by Jazer Dmetriov.";
    } else if (question.includes('who are you')) {
      answer = "I'm a ChatBot Created By Jazer Dmetriov. Nice to meet you!";
    }

    if (answer !== '') {
      res.json({ message: answer, imageUrls: [] });
      return;
    }

    const response = await startBard(question);
    const { message, imageUrls } = response;
    res.json({ message, imageUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the documentation page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
