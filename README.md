# CityTimeCompare 🌍⌚

**CityTimeCompare** is a modern, lightweight web tool designed to help users instantly check the live time difference and weather conditions between any two cities worldwide. Whether you're planning an international meeting or checking in on friends abroad, CityTimeCompare provides accurate, real-time data in a beautiful interface.

## ✨ Features

- **⚡ Instant Time Comparison**: Calculate exact time differences with live clocks for thousands of global cities.
- **🌦️ Live Weather**: Get real-time temperature and weather conditions (Clear, Rain, Snow, etc.) powered by [Open-Meteo](https://open-meteo.com/).
- **📍 Smart Location Detect**: Automatically detects your current city and timezone using Geolocation API, with a robust IP-based fallback.
- **🌍 Interactive Map**: Visualizes the location and distance between the two selected cities using a dynamic [Leaflet.js](https://leafletjs.com/) map.
- **🌙 Dark Mode**: Fully supported dark theme that persists based on user preference.
- **📱 Responsive & Fast**: Built with performance and mobile responsiveness in mind.

## 🛠️ Technologies Used

- **Core**: HTML5, CSS3 (CSS Variables for theming), Vanilla JavaScript (ES6+).
- **APIs**:
  - **Open-Meteo API**: For Geocoding (finding cities) and Weather data.
  - **OpenStreetMap Nominatim**: For reverse geocoding (GPS coords to City name).
  - **ipapi.co**: For IP-based location fallback.
- **Libraries**:
  - **Leaflet.js**: For the interactive map rendering.

## 🚀 How to Run

You can run this project locally without any complex build steps, **or you can run directly using this link - [kausaldev.me/citytimecompare](https://kausaldev.me/citytimecompare)**.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/CityTimeCompare.git
   cd CityTimeCompare
   ```

2. **Run locally:**
   Since the project uses ES modules and some browser APIs (like Geolocation) that require a secure context or server environment, it is best to run it via a local server rather than opening the file directly.

   **Using Python:**
   ```bash
   python -m http.server 8000
   ```

   **Using Node (http-server):**
   ```bash
   npx http-server . -p 8000
   ```

3. **Open in Browser:**
   Visit `http://localhost:8000` in your web browser.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

Developed by [Kausal Upadhayaya](https://kausaldev.me).
Check out the live version at [kausaldev.me/CityTimeCompare](https://kausaldev.me/CityTimeCompare).
