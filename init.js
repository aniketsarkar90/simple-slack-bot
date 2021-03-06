'use strict';

require('dotenv').config();

const SLACK_OAUTH_TOKEN = process.env.SLACK_OAUTH_ACCESS_TOKEN;
const SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;

const Slack = require('slack');

let request = require('request');
let channel = 'test'; //fallback channel 

module.exports.start = async (data) => {
    console.log('data');
    console.log(data);
    const dataObj = JSON.parse(data.body);

    console.log('dataObj');
    console.log(dataObj);
    let response = {
        statusCode: 200,
        body: {},
        headers: {'X-Slack-No-Retry': 1} //turning retries off - https://api.slack.com/events-api#graceful_retries
    }

      //avoid triggering the lambda multiple times if the header is present - https://api.slack.com/events-api
      if (!('X-Slack-Retry-Num' in data.headers)) {
        
        switch ( dataObj.type ) {
            case 'url_verification':
                response.body = urlVerification(dataObj); 
                break;
            case 'event_callback':
                await messageHandler(dataObj.event);
                response.body = { 
                    ok: true 
                }; 
                break;
            default:
                response.statusCode = 400,
                response.body = 'Empty request';
                break;
        } 
    }
    
    return response;
}

//URL Verification challenge - https://api.slack.com/events/url_verification
function urlVerification(dataObj) {
    if ( dataObj.token === process.env.SLACK_VERIFICATION_TOKEN ) {
        return dataObj.challenge;
    } else {
        throw 'Verification failed';
    }
}

//URL Verification challenge - https://api.slack.com/events/url_verification
async function messageHandler(event) {
    //checking if this is coming form a bot

    console.log('Event Type: ');
    console.log(event);

    if(!event.bot_id){
        //read the message
        let message = parseMessage(event.text);
        let reply = '';

        //handle specific messages based on the input
        switch (message) {
            case 'hi':
                reply = 'Hi, How are you?';
                await postMessageOnSlack( event.channel, reply);
                break;
            case 'i am good':
                    reply = 'Glad to know';
                    await postMessageOnSlack( event.channel, reply);
                    break;    
            case 'who are you?':
                reply = 'I am Monday.';
                await postMessageOnSlack( event.channel, reply);
                break;
            case 'idiot':
                reply = 'Tera baap!!!';
                await postMessageOnSlack( event.channel, reply);
                break;
            default:
                reply = 'Let me get back to you on this :)';
                await postMessageOnSlack( event.channel, reply);
                break;
        }
        
    }
}

function parseMessage(message){
    return message.split( ' ', 2 ).pop();
}

function postMessageOnSlack(channel, message){
    let payload = {
        token  : SLACK_OAUTH_TOKEN,
        channel: channel,
        text   : message
    };

    return Slack.chat.postMessage(payload);
}