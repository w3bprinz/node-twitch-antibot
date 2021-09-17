// These lines make "require" available
import { equal } from "assert";
import { Console } from "console";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

//Load dependencies
require("dotenv").config();
import fetch from "node-fetch";
import { resolve } from "path";
const tmi = require("tmi.js");

// Constants
var friendlyBots = ['Nightbot' , 'streamelements']; // <<< Friendly Bots are configured here!
var abbTimer;
// Fetch TwitchBots from API
async function GetTwitchBots() {
  //const response = await fetch("https://api.twitchinsights.net/v1/bots/all");
  const response = await fetch("https://api.twitchinsights.net/v1/bots/online");
  const data = await response.json();
  return data;
}

// Fetch Users from Twitch Channels
async function getChannelViewers(channel) {
  const viewers_response = await fetch(
    `http://tmi.twitch.tv/group/user/${channel}/chatters`
  );
  const viewers = await viewers_response.json();
  //console.log(viewers);
  return viewers;
}
// Function to  check if a User is in friendlyBots or not.
function checkFriendlyBots(channel, botname){
	console.log('Bin in funktion checkfriendlybots!')
	console.log(`Channel lautet ${channel}.`)
	console.log(`Botname lautet ${botname}.`)
	friendlyBots.forEach(element => {
		//console.log('Bin in funktion checkfriendlybots - foreach Schleife!')
		//console.log(`Botname lautet ${botname}.`)
		//console.log(`Element lautet ${element}.`)
		if(element === botname){
			console.log(`INFO: ${botname} is friendly.`);
		}
		else{
			console.log(`WARNING: ${botname} is NOT friendly and will be checked!`)
			//Prüfen ob botname in TwitchInsights API Bots vorhanden ist!
			BotInAPI(channel, botname)
		}
	});
}
// Function to Check if User/Bot is in the API and marked as a bot.
function BotInAPI(channel, botname){
	GetTwitchBots().then(promise =>{
		var currentActiveBots = promise;
		//console.log('Bin in BotInAPI Funktion!')
		//console.log(`Botname lautet: ${botname}.`)
		//console.log(promise.bots['0']['0']);
		currentActiveBots.bots.forEach(element => {
			//console.log(`Checking ${element['0']} with ${botname}.`)
			if(element['0'] === botname)
			{
				console.log(`WARNING: Checked the API. ${botname} is a BOT!`)
				banBot(channel, botname);
			}
			else if(element['0'] === 'undefined'){
				console.log(`WARNING: Error... got nothing from API.`)
			}
			else{
				console.log(`INFO: Checked the API.  ${botname} is not a BOT.`)
			}
			
		});
	} )
}

// Function to intiate a Ban if a User/Bot is not friendly and was checked in the API.
function banBot(channel, botname){
	console.log(`Banning ${botname} now.`)
	setTimeout( () =>{
		client.ban(channel, botname, 'Bots are not allowed here. Get rekt!').then((data) =>{
			console.log(data);
			// data returns [channel, username, reason]
		}).catch((err) => {
			//
			console.log(err);
		});
	},2 * 1000)
}

function abb(channel){
	getChannelViewers (channel.replace('#','')).then(
		promise => {
			//viewers stehen in promise.chatters.viewers
			//Prüfen ob Bot in FRIENDLY_BOTS ist.
			var vierwernames = promise.chatters.viewers;
			//console.log(`Viewernames: ${vierwernames}`);
			vierwernames.forEach(element => {
				//console.log(`Checking if ${element} is in FRIENDLY_BOTS. Running Function...`)
				checkFriendlyBots(channel, element)

			});
			//console.log(promise.chatters.viewers)
		}
	);
}

function startTimer(channel){
	console.log('Auto-Bot-Banning is running...')
	abbTimer = setInterval(abb,10 * 60000, channel) // Time in minutes - only change first number - Default 10 minutes.
	client.say(channel, 'Automatic bot banning is running...')
}

function stopTimer(channel){
	console.log('Auto-Bot-Banning is stopping...')
	clearInterval(abbTimer)
	client.say(channel, 'Automatic bot banning is stopping...')
}

//Create TMI JS Bot Instance
const client = new tmi.Client({	
  options: { debug: true },
  connection: { reconnect: true },
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.BOT_OAUTH_PASSWORD,
  },
  channels: [process.env.BOT_CHANNELS],
});

client.connect().catch(console.error);
client.on("message", (channel, tags, message, self) => {
	if (self) return;
	if (message.toLowerCase() === "!hello") {
    	client.say(channel, `@${tags.username}, heya!`);
	}
  	if (message.toLowerCase() === "!banbots") {
	  	if(tags['user-id'] === process.env.BOT_OWNER){
			//client.say(channel, 'Automatic BOT Banning activated.')
			//client.say(channel, `--- !WARNING! - BOT BAN WAVE INCOMMING - !WARNING! ---`);
			getChannelViewers(channel.replace('#','')).then(
				promise => {
					//viewers stehen in promise.chatters.viewers
					//Prüfen ob Bot in FRIENDLY_BOTS ist.
					var vierwernames = promise.chatters.viewers;
					//console.log(`Viewernames: ${vierwernames}`);
					vierwernames.forEach(element => {
						//console.log(`Checking if ${element} is in FRIENDLY_BOTS. Running Function...`)
						checkFriendlyBots(channel, element)
					});
					//console.log(promise.chatters.viewers)
				}
			);
		}
		else{
			client.say(channel, `@${tags.username} - You are not allowed to use this command!`)
		}
		//console.log(viewers.chatters);
 	}
  	if (message.toLocaleLowerCase() === "!startabb"){
	  	//console.log(tags);
	  	if(tags['user-id'] === process.env.BOT_OWNER){
			//client.say(channel, 'Automatic BOT Banning activated.')
			startTimer(channel)
	  	}
	  	else{
			client.say(channel, `@${tags.username} - You are not allowed to use this command!`)
	  	}
	}
	if (message.toLocaleLowerCase() === "!stopabb"){
		//console.log(tags);
		if(tags['user-id'] === process.env.BOT_OWNER){
			//client.say(channel, 'Automatic BOT Banning deativated.')
			//Find a workaround for automation setinterval clearinterval maybe?
			stopTimer(channel)
		}
		else{
			client.say(channel, `@${tags.username} - You are not allowed to use this command!`)
		}
	}
});
