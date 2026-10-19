
"use strict";


const weatherForm = document.querySelector("#weather-form");
const cityInput = document.querySelector("#city");
const unitsInput = document.querySelector("#units");
const searchButton = document.querySelector("#search-button");
const statusMessage = document.querySelector("#status-message");
const weatherResults = document.querySelector("#weather-results");
const forecastList = document.querySelector("#forecast-list");


function getWeatherInfo(code) {
  const weatherTypes = {
    0: ["Clear sky", "☀️"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Moderate drizzle", "🌦️"],
    55: ["Dense drizzle", "🌧️"],
    56: ["Light freezing drizzle", "🌧️"],
    57: ["Heavy freezing drizzle", "🌧️"],
    61: ["Light rain", "🌦️"],
    63: ["Moderate rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Light freezing rain", "🌧️"],
    67: ["Heavy freezing rain", "🌧️"],
    71: ["Light snowfall", "🌨️"],
    73: ["Moderate snowfall", "🌨️"],
    75: ["Heavy snowfall", "❄️"],
    77: ["Snow grains", "🌨️"],
    80: ["Light rain showers", "🌦️"],
    81: ["Moderate rain showers", "🌧️"],
    82: ["Violent rain showers", "⛈️"],
    85: ["Light snow showers", "🌨️"],
    86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️"],
    99: ["Thunderstorm with heavy hail", "⛈️"]
  };

  return weatherTypes[code] || ["Conditions unavailable", "🌡️"];
}


function showStatus(message, state = "info") {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
}


function formatDate(dateString, options = {}) {
  const date = new Date(`${dateString}T12:00:00`);

  return new Intl.DateTimeFormat("en-GB", options).format(date);
}


async function getWeather(city, units) {
  const temperatureSymbol = units === "celsius" ? "°C" : "°F";
  const windUnit = units === "celsius" ? "km/h" : "mph";

  
  const locationUrl = new URL(
    "https://geocoding-api.open-meteo.com/v1/search"
  );

  locationUrl.search = new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json"
  });

  const locationResponse = await fetch(locationUrl);

  if (!locationResponse.ok) {
    throw new Error("We couldn't search for that city. Please try again.");
  }

  const locationData = await locationResponse.json();
  const location = locationData.results?.[0];

  if (!location) {
    throw new Error(
      "City not found. Check the spelling or add the country name."
    );
  }

  
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");

  weatherUrl.search = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max"
    ].join(","),
    temperature_unit: units,
    wind_speed_unit: units === "celsius" ? "kmh" : "mph",
    forecast_days: "5",
    timezone: "auto"
  });

  const weatherResponse = await fetch(weatherUrl);

  if (!weatherResponse.ok) {
    throw new Error("Weather data is unavailable right now. Try again later.");
  }

  const weatherData = await weatherResponse.json();

  
  return {
    location,
    weather: weatherData,
    temperatureSymbol,
    windUnit
  };
}


function displayCurrentWeather(result) {
  const { location, weather, temperatureSymbol, windUnit } = result;
  const current = weather.current;

  document.querySelector("#location-name").textContent =
    [location.name, location.admin1, location.country]
      .filter(Boolean)
      .join(", ");

  document.querySelector("#current-date").textContent =
    `Local time: ${weather.current.time.replace("T", " ")}`;

  const info = getWeatherInfo(current.weather_code);

  document.querySelector("#weather-description").textContent = info[0];
  document.querySelector("#current-icon").textContent = info[1];

  document.querySelector("#current-temperature").textContent =
    `${Math.round(current.temperature_2m)}${temperatureSymbol}`;

  document.querySelector("#feels-like").textContent =
    `Feels like ${Math.round(current.apparent_temperature)}${temperatureSymbol}`;

  document.querySelector("#humidity").textContent =
    `${current.relative_humidity_2m}%`;

  document.querySelector("#wind-speed").textContent =
    `${Math.round(current.wind_speed_10m)} ${windUnit}`;

  document.querySelector("#precipitation").textContent =
    `${current.precipitation} mm`;
}


function displayForecast(result) {
  const { weather, temperatureSymbol } = result;
  const daily = weather.daily;

  
  forecastList.replaceChildren();

  daily.time.forEach((date, index) => {
    const info = getWeatherInfo(daily.weather_code[index]);

    const card = document.createElement("article");
    card.className = "forecast-card";

    const day = document.createElement("h3");
    day.className = "forecast-day";
    day.textContent = index === 0
      ? "Today"
      : formatDate(date, { weekday: "short" });

    const icon = document.createElement("p");
    icon.className = "forecast-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = info[1];

    const description = document.createElement("p");
    description.className = "forecast-description";
    description.textContent = info[0];

    const temperatures = document.createElement("p");
    temperatures.className = "forecast-temperatures";

    const high = document.createElement("span");
    high.textContent =
      `${Math.round(daily.temperature_2m_max[index])}${temperatureSymbol}`;

    const low = document.createElement("span");
    low.className = "forecast-low";
    low.textContent =
      `${Math.round(daily.temperature_2m_min[index])}${temperatureSymbol}`;

    temperatures.append(high, low);

    const rain = document.createElement("p");
    rain.className = "muted";
    rain.textContent =
      `Rain chance: ${daily.precipitation_probability_max[index] ?? "—"}%`;

    card.append(day, icon, description, temperatures, rain);
    forecastList.append(card);
  });
}


weatherForm.addEventListener("submit", async function (event) {
  
  event.preventDefault();

  const city = cityInput.value.trim();
  const units = unitsInput.value;

  
  if (city.length < 2) {
    showStatus("Please enter a city name with at least two characters.", "error");
    cityInput.focus();
    return;
  }

  
  searchButton.disabled = true;
  searchButton.textContent = "Searching...";
  showStatus(`Looking up the weather for ${city}...`);
  weatherResults.hidden = true;

  try {
    const result = await getWeather(city, units);

    displayCurrentWeather(result);
    displayForecast(result);

    weatherResults.hidden = false;
    showStatus("Weather updated successfully.", "success");
  } catch (error) {
    console.error("Weather search failed:", error);

    showStatus(
      error instanceof TypeError
        ? "Unable to connect. Check your internet connection and try again."
        : error.message || "Something went wrong. Please try again.",
      "error"
    );
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Find weather";
  }
});
