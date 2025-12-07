// --- Country List for Typo Correction ---
const COUNTRY_LIST = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
    "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
    "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
];

// --- Global State ---
let map = null; // Leaflet map instance
let tz1 = null; // Timezone string for City 1
let tz2 = null; // Timezone string for City 2
let clockInterval;
let debounceTimers = {}; // Store timers for each input

// --- Event Listeners ---

window.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        if (themeToggle) themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }

    // Geolocation Logic (My Location)
    const locateBtn = document.getElementById('locate-btn');
    const city1Input = document.getElementById('city1-input');

    if (locateBtn && city1Input) {
        locateBtn.addEventListener('click', async () => {
            locateBtn.classList.add('spinning'); // Start spin

            const handleSuccess = (city) => {
                if (city) {
                    city1Input.value = city;
                    showToast(`Located: ${city}`);
                } else {
                    showToast("Could not determine city name.");
                }
                locateBtn.classList.remove('spinning');
            };

            const handleError = async (err) => {
                console.warn("Geolocation failed/denied, trying IP fallback...", err);
                try {
                    const res = await fetch('https://ipapi.co/json/');
                    if (!res.ok) throw new Error("IP API failed");
                    const data = await res.json();
                    handleSuccess(data.city);
                } catch (fallbackErr) {
                    console.error("Fallback failed:", fallbackErr);
                    showToast("Could not auto-detect location.");
                    locateBtn.classList.remove('spinning');
                }
            };

            if (!navigator.geolocation) {
                await handleError(new Error("Geolocation not supported"));
                return;
            }

            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Use OpenStreetMap Nominatim for Reverse Geocoding
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

                    // Add timeout for fetch
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const res = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    const data = await res.json();
                    const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state;
                    handleSuccess(city);
                } catch (error) {
                    // If Reverse Geocode fails, try IP fallback
                    await handleError(error);
                }
            }, (error) => {
                // If User Denies Permission, try IP fallback
                handleError(error);
            }, { timeout: 10000 });
        });
    }

    // Check for shared URL parameters
    const params = new URLSearchParams(window.location.search);
    const c1 = params.get('c1');
    const c2 = params.get('c2');

    // PAGE: RESULTS
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        if (c1 && c2) {
            startComparison(c1, c2);
        } else {
            // No cities provided
            document.getElementById('loading').textContent = "No cities selected. Please go back.";
            document.getElementById('loading').classList.remove('hidden');
        }
    }

    // PAGE: HOME
    if (document.getElementById('city1-input')) {
        setupAutocomplete('city1-input', 'suggestions-1');
        setupAutocomplete('city2-input', 'suggestions-2');
    }
});

// Compare Button Click (Home Page)
const compareBtn = document.getElementById('compare-btn');
if (compareBtn) {
    compareBtn.addEventListener('click', () => {
        const c1 = document.getElementById('city1-input').value.trim();
        const c2 = document.getElementById('city2-input').value.trim();

        if (!c1 || !c2) return alert("Please enter both cities.");

        // Redirect to results page
        window.location.href = `results.html?c1=${encodeURIComponent(c1)}&c2=${encodeURIComponent(c2)}`;
    });
}

// Share Button Click (Results Page)
const shareBtn = document.getElementById('share-btn');
if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
        const shareData = {
            title: 'CityTimeCompare',
            text: `Time difference check`,
            url: window.location.href
        };

        // Try to get refined text from DOM if available
        const city1Name = document.getElementById('city1-name').textContent.trim();
        const city2Name = document.getElementById('city2-name').textContent.trim();

        // Remove "City X" if it's still default
        const cleanName1 = city1Name.replace('City 1', '').trim() || city1Name;
        const cleanName2 = city2Name.replace('City 2', '').trim() || city2Name;

        shareData.text = `Time difference between ${cleanName1} and ${cleanName2}`;

        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.log('Share canceled'); }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                const msg = document.getElementById('share-msg');
                msg.classList.remove('hidden');
                setTimeout(() => msg.classList.add('hidden'), 3000);
            } catch (err) {
                alert('Could not copy link.');
            }
        }
    });
}
// --- Main Logic Functions ---

let loc1Data = null;
let loc2Data = null;

async function startComparison(city1, city2) {
    if (!document.getElementById('results')) return;

    toggleLoading(true);

    try {
        const [data1, data2] = await Promise.all([
            fetchCityData(city1, 1),
            fetchCityData(city2, 2)
        ]);

        loc1Data = data1.loc;
        tz1 = data1.timezone;

        loc2Data = data2.loc;
        tz2 = data2.timezone;

        startLiveClock();
        // generateMeetingPlanner removed


        setTimeout(() => initMap(), 100);

        toggleLoading(false);
    } catch (error) {
        console.error(error);
        document.getElementById('loading').textContent = "Error: " + error.message;
    }
}

async function fetchCityData(cityName, slot) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
        const correction = findBestMatch(cityName, COUNTRY_LIST);
        if (correction) {
            showToast(`Auto-corrected "${cityName}" to "${correction}"`);
            return fetchCityData(correction, slot);
        }
        throw new Error(`Could not find city: "${cityName}"`);
    }

    const loc = geoData.results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const cityHeader = document.getElementById(`city${slot}-name`);
    const flagImg = document.getElementById(`city${slot}-flag`);

    cityHeader.innerHTML = '';
    cityHeader.appendChild(flagImg);
    cityHeader.appendChild(document.createTextNode(` ${loc.name}, ${loc.country || ''}`));

    if (loc.country_code) {
        flagImg.src = `https://flagcdn.com/w40/${loc.country_code.toLowerCase()}.png`;
        flagImg.alt = `${loc.country} Flag`;
        flagImg.classList.remove('hidden');
    } else {
        flagImg.classList.add('hidden');
    }

    document.getElementById(`city${slot}-temp`).textContent = `${Math.round(weatherData.current_weather.temperature)}°C`;
    document.getElementById(`city${slot}-condition`).textContent = getWeatherString(weatherData.current_weather.weathercode);

    const resolvedTz = loc.timezone || weatherData.timezone;

    return { loc, timezone: resolvedTz };
}

function startLiveClock() {
    if (clockInterval) clearInterval(clockInterval);

    const update = () => {
        const now = new Date();
        updateTimeDisplay(1, tz1, now);
        updateTimeDisplay(2, tz2, now);
        calculateDifference(now);
    };

    update();
    clockInterval = setInterval(update, 1000);
}

function updateTimeDisplay(slot, tz, now) {
    try {
        const timeStr = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true
        }).format(now);

        const dateStr = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, weekday: 'short', month: 'short', day: 'numeric'
        }).format(now);

        document.getElementById(`city${slot}-time`).textContent = timeStr;
        document.getElementById(`city${slot}-date`).textContent = dateStr;
    } catch (e) {
        console.error("Time format error:", e);
    }
}

function calculateDifference(now) {
    if (!tz1 || !tz2) return;

    const date1 = new Date(now.toLocaleString('en-US', { timeZone: tz1 }));
    const date2 = new Date(now.toLocaleString('en-US', { timeZone: tz2 }));

    const diffMs = date2 - date1;
    const isNegative = diffMs < 0;
    const absDiff = Math.abs(diffMs);

    const totalMinutes = Math.floor(absDiff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const valEl = document.getElementById('time-diff-val');
    const textEl = document.getElementById('time-diff-text');

    if (hours === 0 && minutes === 0) {
        valEl.textContent = "Same Time";
        textEl.textContent = "No time difference";
    } else {
        const sign = isNegative ? "-" : "+";
        if (hours === 0) {
            valEl.textContent = `${sign}${minutes} Mins`;
        } else {
            valEl.textContent = `${sign}${hours} Hrs : ${minutes} Mins`;
        }

        const city2Name = document.getElementById('city2-name').textContent.split(',')[0];
        textEl.textContent = !isNegative ? `${city2Name} is ahead` : `${city2Name} is behind`;
    }
}



// --- Interactive Map ---
function initMap() {
    console.log("initMap called");
    if (!loc1Data || !loc2Data) {
        console.warn("Map skipped: Missing location data", { loc1Data, loc2Data });
        return;
    }
    if (typeof L === 'undefined') {
        console.error("Leaflet (L) is undefined. Script might not be loaded.");
        return;
    }

    const mapEl = document.getElementById('map');
    if (!mapEl) {
        console.error("Map container #map not found. Dumping Body HTML:");
        console.log(document.body.innerHTML);
        return;
    }

    // Remove existing map instance if any
    if (map) {
        map.remove();
        map = null;
    }

    try {
        const lat1 = loc1Data.latitude;
        const lon1 = loc1Data.longitude;
        const lat2 = loc2Data.latitude;
        const lon2 = loc2Data.longitude;

        console.log("Initializing map with coords:", lat1, lon1, lat2, lon2);

        // Center map between points
        const centerLat = (lat1 + lat2) / 2;
        const centerLon = (lon1 + lon2) / 2;

        map = L.map('map').setView([centerLat, centerLon], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const marker1 = L.marker([lat1, lon1]).addTo(map);

        // Try to bind popups safely
        try {
            const time1 = document.getElementById('city1-time')?.textContent || '';
            marker1.bindPopup(`<b>${loc1Data.name}</b><br>${time1}`).openPopup();
        } catch (e) { console.warn("Popup 1 error", e); }

        const marker2 = L.marker([lat2, lon2]).addTo(map);
        try {
            const time2 = document.getElementById('city2-time')?.textContent || '';
            marker2.bindPopup(`<b>${loc2Data.name}</b><br>${time2}`);
        } catch (e) { console.warn("Popup 2 error", e); }

        // Fit bounds
        const bounds = L.latLngBounds([lat1, lon1], [lat2, lon2]);
        map.fitBounds(bounds, { padding: [50, 50] });

        console.log("Map initialized successfully");
    } catch (err) {
        console.error("Error inside initMap:", err);
    }
}

// --- Autocomplete Logic ---
function setupAutocomplete(inputId, listId) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    input.addEventListener('input', () => {
        clearTimeout(debounceTimers[inputId]);
        const query = input.value.trim();

        if (query.length < 3) {
            list.classList.add('hidden');
            return;
        }

        debounceTimers[inputId] = setTimeout(async () => {
            try {
                const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
                const res = await fetch(url);
                const data = await res.json();

                if (document.getElementById(inputId).value.trim().length < 3) return;

                list.innerHTML = '';

                if (data.results) {
                    list.classList.remove('hidden');
                    data.results.forEach(city => {
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>${city.name}</strong> <small>${city.admin1 || ''}, ${city.country || ''}</small>`;
                        li.addEventListener('click', () => {
                            input.value = city.name;
                            list.classList.add('hidden');
                        });
                        list.appendChild(li);
                    });
                } else {
                    list.classList.add('hidden');
                }
            } catch (e) {
                console.error("Autocomplete error:", e);
            }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !list.contains(e.target)) {
            list.classList.add('hidden');
        }
    });
}

// --- Helper Utilities ---

function toggleLoading(isLoading) {
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    if (!loading || !results) return;

    if (isLoading) {
        loading.classList.remove('hidden');
        results.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
        results.classList.remove('hidden');
    }
}

function getWeatherString(code) {
    const codes = {
        0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
        56: 'Freezing Drizzle', 57: 'Freezing Drizzle', 61: 'Light Rain', 63: 'Rain',
        65: 'Heavy Rain', 66: 'Freezing Rain', 67: 'Freezing Rain', 71: 'Snow',
        73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains', 80: 'Showers',
        81: 'Showers', 82: 'Violent Showers', 85: 'Snow Showers', 86: 'Snow Showers',
        95: 'Thunderstorm', 96: 'Hail', 99: 'Heavy Hail'
    };
    return codes[code] || 'Unknown';
}

function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

function findBestMatch(input, list) {
    let bestMatch = null;
    let minDistance = Infinity;
    const threshold = 3;
    const lowerInput = input.toLowerCase();

    for (const item of list) {
        const dist = levenshteinDistance(lowerInput, item.toLowerCase());
        if (dist < minDistance && dist <= threshold) {
            minDistance = dist;
            bestMatch = item;
        }
    }
    return bestMatch;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}