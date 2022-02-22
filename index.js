const webURL = process.env.webURL;
const webHookURL = process.env.webHookURL;

import fetch from "node-fetch";

var resultTime = [
    ["0", "0", "0", "0", "0"],
    ["0", "0", "0", "0", "0"],
    ["0", "0", "0", "0", "0"],
    ["0", "0", "0", "0", "0"]
];

// [i] (1) = ID
// [i] (2) = Time Idle Started
// [i] (3) = Last Idle Time
// [i] (4) = Idle total time
// [i] (5) = Sent Notification

var webInterval = setInterval(() => webMain(), 30000);

async function webMain() {
    console.log("Started checking...");

    var webResults = await (await fetch(webURL)).json();
    console.log("Found results...");

    let i = 0;

    for (let i = 0; i < webResults.objects.length; i++) {
        if ((webResults.objects[i].type === "washTL") || (webResults.objects[i].type === "dry")) {
            // If it is a Washer or Dryer 

            resultTime[i][0] = webResults.objects[i].appliance_desc;
            // Sets the Appliance ##

            if (webResults.objects[i].time_left_lite === "Idle") {
                // If it is IDLE ** CHANGE FROM AVAILABLE OUTSIDE OF TESTING **

                if (resultTime[i][1] == 0) {
                    // If it was not Idle before 

                    resultTime[i][1] = Date.now();
                    // Sets the new Idle start time 

                } else {
                    resultTime[i][2] = Date.now();
                    // If it was Idle before, update the time

                }
            } else {
                // If it is not Idle

                resultTime[i][1] = 0;
                resultTime[i][4] = 0;
                // Clears the time, incase it was not before -- The second time does not need to be cleared

            }
        } else {
            // If it is not a washing machine/dryer

            webResults.objects.splice(i, 1);
            // Remove from array 

            i--;
            // Reset i value

        }
    }

    for (let i = 0; i < resultTime.length; i++) {
        if (resultTime[i][1] !== 0) {
            // If the time is greater than zero, aka has been idle 

            resultTime[i][3] = resultTime[i][2] - resultTime[i][1];
            // Resulting idle time 

            if ((resultTime[i][3] > 3600) && (resultTime[i][4] == 0)) {
                // If the idle time is greater than an hour 

                console.log(`Found ${resultTime[i][0]} in violation...`);

                fetch(webHookURL, {
                    "method": "POST",
                    "headers": { "Content-Type": "application/json" },
                    "body": JSON.stringify({
                        "content": `${resultTime[i][0]} has met the idle threshhold`
                    })

                }).then(console.log("Sent a webhook"));
                
                resultTime[i][4] = 1;
                
            }
        }
    }
    console.log(resultTime);
    console.log("Finished Cycle...");

}