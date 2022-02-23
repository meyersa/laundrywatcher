/*
*	Bot created by: Meyers#6464
*	Version: 0.9   
*/

const webURL = process.env.webURL;
const updateChannel = process.env.updateChannel;
const embedTitle = process.env.embedTitle;
const embedColor = process.env.embedColor;
const clientToken = process.env.clientToken;

import { Client, Intents, MessageEmbed } from "discord.js";
import fetch from "node-fetch";

const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

client.on('ready', () => {
    startInterval();

});

client.login(clientToken);

var resultTime = [
    ["0", "0", "0", "0"],
    ["0", "0", "0", "0"],
    ["0", "0", "0", "0"],
    ["0", "0", "0", "0"]
];
// [i] (1) = ID
// [i] (2) = Time Idle Started
// [i] (3) = Last Idle Time
// [i] (4) = Idle total time
// [i] (5) = Sent Notification

async function startInterval() {
    purgeOld();

    const sendEmbed = await initEmbed();
    var webInterval = setInterval(() => webMain(sendEmbed), 5000);

    console.log("Started Interval...");

}

async function purgeOld() {
    var channel = await client.channels.fetch(updateChannel);
    // Fetches out of cache channel 

    var messagesToDel = await channel.messages.fetch({ limit: 50 });
    await channel.bulkDelete(messagesToDel);
    // Deletes 50 last messages 

}


async function webMain(sendEmbed) {
    console.log("Started Web Main...");

    var webResults = await (await fetch(webURL)).json();
    var textField = ["", "", "", ""];

    console.log("Pulled JSON...");

    for (let i = 0; i < webResults.objects.length; i++) {
        if (!(webResults.objects[i].type === "washTL") && !(webResults.objects[i].type === "dry")) {
            // NOT washer or dryer 

            webResults.objects.splice(i, 1);
            i--;
            // Removes from i and array 

            continue;
            // Skips itself from for iteration 

        }

        if ((webResults.objects[i].type === "washTL") && !(webResults.objects[i].time_left_lite === "Idle") && !(webResults.objects[i].time_left_lite === "Available")) {
            webResults.objects[i].time_remaining -= 7;

            if (webResults.objects[i].time_remaining < 0) {
                webResults.objects[i].time_left_lite = "Idle";

            }
        }

        // If it is a washer or dryer 
        if (webResults.objects[i].time_left_lite === "Idle") {
            // If it is IDLE

            resultTime[i][2] = 0;
            resultTime[i][3] = 0;
            // Clears available timers 

            if (resultTime[i][0] == 0) {
                // If it was not Idle before 

                resultTime[i][0] = Date.now();
                // Sets the new Idle start time 

                textField[i] = "🛑 Idle";
                // Updates textfield to reflect

            } else {
                resultTime[i][1] = Date.now() - resultTime[i][0];
                // If it was Idle before, update the time idle

                textField[i] = `🛑 Idle for ${((new Date(resultTime[i][1])).getMinutes())} min`;
                // Updates textfield to reflect 

            }
            continue;
        }
        // If it is NOT IDLE

        resultTime[i][0] = 0;
        resultTime[i][1] = 0;
        // Resets Idle timers 

        if (webResults.objects[i].time_left_lite === "Available") {
            // If it is AVAILABLE 



            if (resultTime[i][2] == 0) {
                // If it was not AVAILABLE before 

                resultTime[i][2] = Date.now();
                // Sets the new AVAILABLE start time 

                textField[i] = "🟢 Available";
                // Updates textfield to reflect

            } else {
                resultTime[i][3] = Date.now() - resultTime[i][2];
                // If it was AVAILABLE before, update the time AVAILABLE

                textField[i] = `🟢 Available for ${((new Date(resultTime[i][3])).getMinutes())} min`;
                // Updates textfield to reflect 

            }
            continue;
            // Skips itself from for iteration 

        }

        resultTime[i][2] = 0;
        resultTime[i][3] = 0;
        // If it is in USE

        // Clears available timers 

        
        textField[i] = `⚠️ in use for ${(webResults.objects[i].time_remaining)} minutes`;

    }

    console.log(textField);
    console.log(resultTime);

    console.log("Finished Web Main...");

    editEmbed(sendEmbed, textField);

}

async function initEmbed() {
    var Embed = new MessageEmbed()
        .setTitle(embedTitle)
        .setColor(embedColor)
        .setURL(webURL)
        .setTimestamp();

    var channel = await client.channels.fetch(updateChannel);

    var sendEmbed = await channel.send({ embeds: [Embed] })
        .then(console.log("First embed sent."));

    return sendEmbed;
};

async function editEmbed(sendEmbed, textField) {
    var Embed = new MessageEmbed()
        .setTitle(embedTitle)
        .setColor(embedColor)
        .setURL(webURL)
        .setTimestamp()
        .setFields(
            { name: "Washer 1", value: textField[0] },
            { name: "Washer 2", value: textField[1] },
            { name: "Dryer 1", value: textField[2] },
            { name: "Dryer 2", value: textField[3] },
        );

    await sendEmbed.edit({ embeds: [Embed] })
        .then(console.log("Updated embed"));

};