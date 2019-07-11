//imports
const cors = require('cors'),
      next = require('next'),
      Pusher = require('pusher'),
      express = require('express'),
      bodyParser = require('body-parser'),
      dotEnv = require('dotenv');

//variables
const dev = process.env.NODE_ENV !== 'production',
      port = process.env.PORT || 3000;

//initializations
const app = next({ dev }),
      handler = app.getRequestHandler(),
      pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_APP_KEY,
        secret: process.env.PUSHER_APP_SECRET,
        cluster: process.env.PUSHER_APP_CLUSTER,
        forceTLS: true
      });

app.prepare()
    .then(() => {
        const server = express();

        server.use(cors());
        server.use(bodyParser.json());
        server.use(bodyParser.urlencoded({extended: true}));

        server.get('*', (req, res) => {
            return handler(req, res);
        });

        const chatHistory = { messages: [] };

        server.post('/message', (req, res, next) => {
            const { user = null, message = '', timestamp = +new Date } = req.body;
            const chat = { user, message, timestamp };

            chatHistory.messages.push(chat);

            pusher.trigger('chat-room', 'new-message', { chat });
        });

        server.post('/messages', (req, res, next) => {
            res.json({...chatHistory, status: 'success' });
        });

        server.listen(port, err => {
            if (err) throw err;
            console.log(`>Ready on http://localhost/${port}`);
        });
    })
    .catch(ex => {
      console.error(ex.stack);
      process.exit(1);
    });
