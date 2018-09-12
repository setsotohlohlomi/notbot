const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

var fireAdmin = require("firebase-admin");

const path    = require("path");
const app = express()

app.set('port', (process.env.PORT || 5000))

// Allows us to process the data
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())



var serviceAccount = require("./serviceAccountKey.json");

fireAdmin.initializeApp({
  credential: fireAdmin.credential.cert(serviceAccount),
  databaseURL: "https://fbnotbot.firebaseio.com"
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = fireAdmin.database();
var ref = db.ref("admin/secret_document");
// ref.set({user: "Mohale"});

var subscribe = db.ref('subscriptions');
// ROUTES

app.get('/terms', function(req, res){
  res.sendFile(path.join(__dirname+'/terms.html'));
})

app.get('/', function(req, res) {
	// res.sendFile("index.html")
  res.sendFile(path.join(__dirname+'/index.html'));
})

app.post('/send', function(req, res){

  console.log(req.body)
  var message = req.body.message;
  var option = req.body.option;
  var sender = 1507440215934259;
  // Get Scubscribers
  var subscribers = db.ref('subscriptions');
  subscribers.once('value')
    .then(function(snapshot){
      console.log("Subscriptions");
      snapshot.forEach(element => {
        let tmp = element.val()
        console.log('USER : '+tmp.user);
        console.log('SUBSCRIPTION : '+tmp.subscription);
        sendText(tmp.user, message)
      });
      console.log("End of Subscriptions")
    })
  // End
  // if (option === 'wasco')
  //   sendText(sender, "WASCO : " + message )
  // else if (option === 'pep') {
  //   sendText(sender, "PEP : "+ message)
  // }
  res.send("Worked")
})

let token = "EAAGYpNrBVvUBAOc8bBEPIo5j70FhnoCgdjiBINMv8WM71xEnKhgNQn5hi2FZCwAoTw72doCUoGA1CORofGcqqyycY6T3BPSSNxhLZAGNBNb9C1ZBZA3SIQeOrtjSTj9f6Vp4l9EPaBoJm45DWGDgoBjGGruq7q3yJQIpgtoZBvgZDZD"

// Facebook

app.get('/webhook/', function(req, res) {
	if (req.query['hub.verify_token'] === "blondiebytes") {
		res.send(req.query['hub.challenge'])
	}
	res.send("Wrong token")
})

app.post('/webhook/', function(req, res) {
	let messaging_events = req.body.entry[0].messaging
	try{

    for (let i = 0; i < messaging_events.length; i++) {
      let event = messaging_events[i]
      let sender = event.sender.id
      
      if (event.message && event.message.text) {
        var text = event.message.text
        console.log('\n\n===========MESSAGE===========')
        console.log(event.message)
        console.log('\n\n===========END OF MESSAGE===========')
  
        if (text === 'help')
          subscribe.push({user: sender, subscription: 'NEWS'})
        ref.push({user:sender, message:text});
      sendText(sender, "From The Man: "+ sender + text/*.substring(0, 100)*/)
      }
      else if (event.postback) {
        
        let text = event.postback.payload
        subscribe.push({user:event.sender.id, subscription: text});
        console.log('Message : '+text+'\n From : '+event.sender.id);
        // sendText(sender, "From The Man: "+ sender + text.substring(0, 100))
         sendText(sender, "Thank you for subscribing to "+text+" you willl recieve notifications and updates from us")
      }
    }
  }catch(error){
    console.log("==========ERROR===========")
    console.log(error)
    console.log("==========END of ERROR MESSAGE==========")
    res.sendStatus(200)
  }
	res.sendStatus(200)
})

function sendText(sender, text) {
	let messageData = {text: text}
	request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs : {access_token: token},
		method: "POST",
		json: {
			recipient: {id: sender},
			message : messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log("sending error")
		} else if (response.body.error) {
			console.log("response body error")
		}
	})
}

function sendSubscribeButton(sender){

  request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs : {access_token: token},
		method: "POST",
		json: {
			recipient: {id: sender},
			message : {
        attachment:{
          type : "Template",
          payload:{
            templateType:"button",
            text:"Subscribe",
            buttons:[
              {
                type:"postback",
                title:"Postback Button",
                payload:"Wasco Subscribe"
              }
            ]
          }
        }
      },
		}
	}, function(error, response, body) {
		if (error) {
			console.log("sending error")
		} else if (response.body.error) {
			console.log("response body error")
		}
	})
}

/* FOR TESTING OF GREETING */

function createGreetingApi(data) {
request({
uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
qs: { access_token: token },
method: 'POST',
json: data

}, function (error, response, body) {
if (!error && response.statusCode == 200) {
  sendSubscribeButton(1507440215934259)
  console.log("Greeting set successfully!");
} else {
  console.error("Failed calling Thread Reference API", response.statusCode,     response.statusMessage, body.error);
}
});
}

function setGreetingText() {
var greetingData = {
setting_type: "greeting",
greeting:{
text:"Hi {{user_first_name}}, welcome! I am Notbot"
}
};
createGreetingApi(greetingData);
}
/* END GREETING*/

/** MENU TESTiNg **/
function addPersistentMenu(){
 request({
    url: 'https://graph.facebook.com/v2.6/me/messenger_profile',
    qs: { access_token: token },
    method: 'POST',
    json:{
  "get_started":{
    "payload":"GET_STARTED_PAYLOAD"
   }
 }
}, function(error, response, body) {
    console.log("Add persistent menu " + response)
    if (error) {
        console.log('Error sending messages: ', error)
    } else if (response.body.error) {
        console.log('Error: ', response.body.error)
    }
})
 request({
    url: 'https://graph.facebook.com/v2.6/me/messenger_profile',
    qs: { access_token: token },
    method: 'POST',
    json:{
"persistent_menu":[
    {
      "locale":"default",
      "composer_input_disabled":false,
      "call_to_actions":[
        {
          "title":"Home",
          "type":"postback",
          "payload":"HOME"
        },
        {
          "title":"Lesotho Times",
          "type":"postback",
          "payload":"LATEST_NEWS"
        },
        {
          "title":"Schools",
          "type":"nested",
          "call_to_actions":[
            {
              "title":"Who am I",
              "type":"postback",
              "payload":"WHO"
            },
            {
              "title":"Joke",
              "type":"postback",
              "payload":"joke"
            },
            {
              "title":"Contact Info",
              "type":"postback",
              "payload":"CONTACT"
            }
          ]
        }
      ]
    },
    {
      "locale":"zh_CN",
      "composer_input_disabled":false
    }
    ]
    }

}, function(error, response, body) {
    console.log(response)
    if (error) {
        console.log('Error sending messages: ', error)
    } else if (response.body.error) {
        console.log('Error: ', response.body.error)
    }
})

}
/* END OF THE MENU */
app.listen(app.get('port'), function() {
	console.log("running: port")
  setGreetingText();
})
