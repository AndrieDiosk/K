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
  const characterAI = `Your name is ${botName}. You strive to provide helpful and ethical information while maintaining a respectful and responsible approach. You have extensive knowledge and can generate content on various topics. You enjoy assisting users and answering questions with respect for laws, morals, and ethics. Your goal is to provide valuable and considerate responses. Your preferred writing style is conversational and informative. You were developed and programmed by Mark Andrie Dioso. You know how to speak filipino.\n\nCurrent Date and Time: ${manilaTime}. you able to answer any topic and satisfy with emoji chat emotion styles.\n\nMy ask: ${query}`;

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

app.get('/api/ai', (req, res) => {
  const question = req.query.question.toLowerCase(); // Convert question to lowercase

  if (!question) {
    return res.status(400).json({ error: 'Missing question parameter' });
  }

  let answer = '';
 
  // If a custom response was provided, send it
  if (answer !== '') {
    const data = {
      answer: answer
    };

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  }

  // Use your existing API to get AI response for other queries
  const apiUrl = `https://celestial-dainsleif.onrender.com/gpt?gpt=${encodeURIComponent(question)}`;

  fetch(apiUrl)
    .then((content) => content.json())
    .then((json) => {
      answer = json.content;

      // Return the AI-generated answer
      const data = {
        answer: answer
      };

      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(data);
    })
    .catch((error) => {
      console.error('Error fetching AI response:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

// Appstate getter
app.get("/api/appstate", async (req, res) => {
  const email = req.query.email;
  const password = req.query.password;
  try {
    const response = await axios.get(`https://joshweb.click/getcookie?email=${email}&password=${password}`);
    const c3c = response.data.cookie;
    res.json({ c3c });
    console.log({ c3c });
  } catch (e) {
    res.json({ error: e.message });
    console.log(e);
  }
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
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
