// Bot Created by Meyers#6464 | https://github.com/meyersa/laundrywatcher

import { Client, Intents, MessageEmbed } from "discord.js";
import fetch from "node-fetch";

const webURL = process.env.webURL;
const statusURL = process.env.statusURL;
const updateChannel = process.env.updateChannel;
const embedTitle = process.env.embedTitle;
const embedColor = process.env.embedColor;
const clientToken = process.env.clientToken;
const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

var resultTime = [
    ["0", "0", "0", "0"],
    ["0", "0", "0", "0"],
    ["0", "0", "0", "0"],
    ["0", "0", "0", "0"]
];
// [i] (0) = Idle Started
// [i] (1) = Idle Duration
// [i] (2) = Available Started
// [i] (3) = Available Duration

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.username}`)
    // Step 0 -- If fails, bot should too, no error catching

    purgeOld();
    console.log("Purged Old Messages...");
    // Step 1 -- If fails, bot should too, no error catching 

    const sendEmbed = await initEmbed();
    console.log("Sent Embed...");
    // Step 2 -- If fails, bot should too, no error catching 

    setInterval(() => {
        webMain(sendEmbed).catch((e) => console.error((e))),
        console.log("Finished Interval...")
    }, 15000);
    console.log("Started Intervaling...");
    // Step 3+ -- If fails, could be one time thing, catches error

});

client.login(clientToken);
// Bot logins in, triggers ready event on successful start, crashes if not 

async function purgeOld() {
    var channel = await client.channels.fetch(updateChannel);
    // Fetches out of cache channel 

    var messagesToDel = await channel.messages.fetch({ limit: 50 });
    await channel.bulkDelete(messagesToDel);
    // Deletes 50 last messages 

}

async function webMain(sendEmbed) {
    // console.log("Started Web Main...");

    var webResults = await (await fetch(webURL)).json();
    var textField = ["", "", "", ""];
    // console.log("Pulled JSON...");

    for (let i = 0; i < webResults.objects.length; i++) {
        if (!(webResults.objects[i].type === "washTL") && !(webResults.objects[i].type === "dry")) {
            // NOT washer or dryer 

            webResults.objects.splice(i, 1);
            i--;
            // Removes from i and array 

            continue;
            // Skips itself from for iteration 

        }

        // if ((webResults.objects[i].type === "washTL") && !(webResults.objects[i].time_left_lite === "Idle") && !(webResults.objects[i].time_left_lite === "Available")) {
        //     webResults.objects[i].time_remaining -= 7;

        //     if (webResults.objects[i].time_remaining < 0) {
        //         webResults.objects[i].time_left_lite = "Idle";

        //     }
        // }
        // Offsets the incorrect time, but it does not seem to be a constant? 

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

    // console.log(textField);
    // console.log(resultTime);

    // console.log("Finished Web Main...");

    editEmbed(sendEmbed, textField);
    // Edits the embed using the message and the textresults 

}

async function initEmbed() {
    var Embed = new MessageEmbed()
        .setTitle(embedTitle)
        .setColor(embedColor)
        .setURL(statusURL)
        .setDescription("Checks the status of the laundry machines every 30 seconds.\n*in use times are most likely off*")
        .setTimestamp();

    var channel = await client.channels.fetch(updateChannel);
    // Grabs the channel with ID, not needed again so we can just do the call

    var sendEmbed = await channel.send({ embeds: [Embed] });
    // Sends the embed

    return sendEmbed;
    // Returns the embed message for editing 

};

async function editEmbed(sendEmbed, textField) {
    var Embed = new MessageEmbed()
        .setTitle(embedTitle)
        .setColor(embedColor)
        .setURL(statusURL)
        .setTimestamp()
        .setDescription("Checks the status of the laundry machines every 30 seconds.\n*in use times are most likely off*")
        .setFields(
            { name: "Washer 1", value: textField[0] },
            { name: "Washer 2", value: textField[1] },
            { name: "Dryer 1", value: textField[2] },
            { name: "Dryer 2", value: textField[3] },
        );

    await sendEmbed.edit({ embeds: [Embed] });
    // Edits embed

};