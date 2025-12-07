
const tz1 = "Asia/Kolkata";
const tz2 = "Atlantic/Reykjavik";

function calculateDifference() {
    const now = new Date();

    // Simulate logic from app.js
    const date1 = new Date(now.toLocaleString('en-US', { timeZone: tz1 }));
    const date2 = new Date(now.toLocaleString('en-US', { timeZone: tz2 }));

    const diffMs = date2 - date1;
    const diffHours = diffMs / (1000 * 60 * 60);
    const rounded = Math.round(diffHours * 10) / 10;

    console.log(`TZ1: ${tz1}`);
    console.log(`TZ2: ${tz2}`);
    console.log(`Date1: ${date1.toISOString()}`);
    console.log(`Date2: ${date2.toISOString()}`);
    console.log(`Diff Hours: ${diffHours}`);
    console.log(`Rounded: ${rounded}`);
}

calculateDifference();
