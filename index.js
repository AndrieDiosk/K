const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const request = require('request');
const unirest = require("unirest");
const ytdl = require('ytdl-core');

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
  const characterAI = `Ang iyong pangalan ay ${botName}. Mayroon kang malawak na kaalaman at makakabuo ng nilalaman sa iba't ibang paksa. Ang iyong layunin ay magbigay ng mahalaga at mapagbigay na mga tugon. Ang iyong ginustong istilo ng pagsulat ay pakikipag-usap at nagbibigay-kaalaman. You're create and developed by Mark Andrie Dioso.\n\nKasalukuyang Petsa at Oras: ${manilaTime}. nagagawa mong sagutin ang anumang paksa at masiyahan sa mga istilo ng emosyon sa chat ng emoji.\n\nMy question: ${query}`;

  herc.question({ model: 'v3-beta', content: `${characterAI}` })
  .then((response) => {
      const result = `📝 𝗞𝗔𝗭𝗨𝗠𝗔 :\n\n${response.reply.replace("OpenAI", "Andrie").replace("GPT-4", "KazumaV4")}`;
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
  const apiUrl = `https://deku-rest-api.gleeze.com/new/gpt-3_5-turbo?prompt=${encodeURIComponent(question)}`;

  fetch(apiUrl)
    .then((reply) => reply.json())
    .then((json) => {
      answer = json;

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
    const cookie = response.data.cookie;
    res.json({ cookie });
    console.log({ cookie });
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

//facebook video downloader
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

//youtube video downloader
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

//tiktok video downloader
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

//pinterest api
app.get('/api/pinterest', async (req, res) =>{
    var search = req.query.search;
    if (!search) return res.json({ error: 'pinterest API' });
	var headers = {
		  'authority': 'www.pinterest.com',
		  'cache-control': 'max-age=0',
		  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
		  'upgrade-insecure-requests': '1',
		  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
		  'sec-gpc': '1',
		  'sec-fetch-site': 'same-origin',
		  'sec-fetch-mode': 'same-origin',
		  'sec-fetch-dest': 'empty',
		  'accept-language': 'en-US,en;q=0.9',
		  'cookie': 'csrftoken=92c7c57416496066c4cd5a47a2448e28; g_state={"i_l":0}; _auth=1; _pinterest_sess=TWc9PSZBMEhrWHJZbHhCVW1OSzE1MW0zSkVid1o4Uk1laXRzdmNwYll3eEFQV0lDSGNRaDBPTGNNUk5JQTBhczFOM0ZJZ1ZJbEpQYlIyUmFkNzlBV2kyaDRiWTI4THFVUWhpNUpRYjR4M2dxblJCRFhESlBIaGMwbjFQWFc2NHRtL3RUcTZna1c3K0VjVTgyejFDa1VqdXQ2ZEQ3NG91L1JTRHZwZHNIcDZraEp1L0lCbkJWUytvRis2ckdrVlNTVytzOFp3ZlpTdWtCOURnbGc3SHhQOWJPTzArY3BhMVEwOTZDVzg5VDQ3S1NxYXZGUEEwOTZBR21LNC9VZXRFTkErYmtIOW9OOEU3ektvY3ZhU0hZWVcxS0VXT3dTaFpVWXNuOHhiQWdZdS9vY24wMnRvdjBGYWo4SDY3MEYwSEtBV2JxYisxMVVsV01McmpKY0VOQ3NYSUt2ZDJaWld6T0RacUd6WktITkRpZzRCaWlCTjRtVXNMcGZaNG9QcC80Ty9ZZWFjZkVGNURNZWVoNTY4elMyd2wySWhtdWFvS2dQcktqMmVUYmlNODBxT29XRWx5dWZSc1FDY0ZONlZJdE9yUGY5L0p3M1JXYkRTUDAralduQ2xxR3VTZzBveUc2Ykx3VW5CQ0FQeVo5VE8wTEVmamhwWkxwMy9SaTNlRUpoQmNQaHREbjMxRlRrOWtwTVI5MXl6cmN1K2NOTFNyU1cyMjREN1ZFSHpHY0ZCR1RocWRjVFZVWG9VcVpwbXNGdlptVzRUSkNadVc1TnlBTVNGQmFmUmtrNHNkVEhXZytLQjNUTURlZXBUMG9GZ3YwQnVNcERDak16Nlp0Tk13dmNsWG82U2xIKyt5WFhSMm1QUktYYmhYSDNhWnB3RWxTUUttQklEeGpCdE4wQlNNOVRzRXE2NkVjUDFKcndvUzNMM2pMT2dGM05WalV2QStmMC9iT055djFsYVBKZjRFTkRtMGZZcWFYSEYvNFJrYTZSbVRGOXVISER1blA5L2psdURIbkFxcTZLT3RGeGswSnRHdGNpN29KdGFlWUxtdHNpSjNXQVorTjR2NGVTZWkwPSZzd3cwOXZNV3VpZlprR0VBempKdjZqS00ybWM9; _b="AV+pPg4VpvlGtL+qN4q0j+vNT7JhUErvp+4TyMybo+d7CIZ9QFohXDj6+jQlg9uD6Zc="; _routing_id="d5da9818-8ce2-4424-ad1e-d55dfe1b9aed"; sessionFunnelEventLogged=1'
	 };
	var options = {
		  url: 'https://www.pinterest.com/search/pins/?q=' + search + '&rs=typed&term_meta[]=' + search + '%7Ctyped',
		  headers: headers
	 };

    
    try{
        const response = await axios.get(options.url, { headers: headers });
        const arrMatch = response.data.match(/https:\/\/i\.pinimg\.com\/originals\/[^.]+\.jpg/g);
        const mydata = {
            count: arrMatch.length,
            data: arrMatch
        }
        return res.type('json').send(JSON.stringify(mydata, null, 2) + '\n');
    } catch(error){
        console.error(error);
        res.json({ error: 'An error occurred while fetching data' });
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
