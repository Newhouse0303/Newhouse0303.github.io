// Function to fetch json data (instead of having separate function for both data.json & constants.json)
async function fetchData(url) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
  }
}

async function initialize() {
  const constants = await fetchData("constants.json"); // calling the above function
  populateDropdown("potType", constants, "pot"); // passing (html-id, constants.json, datatype) as parameter
  populateDropdown("plantType", constants, "species");
  populateDropdown("season", constants, "season");
}

function populateDropdown(dropdownId, data, type) {
  // calling above f to get options (html-id, json, datatype wanted)
  const dropdown = document.getElementById(dropdownId); // corresponding datatype (pot, species, or season)
  data // chaning filter & forEach instead of a loop
    .filter((item) => item.datatype === type) // new array to handle only the right datatypes
    .forEach((item) => {
      // iterates over the above array
      const option = document.createElement("option"); //creates option element for html
      option.text = item.name; // assigns name
      option.value = item.name; // assingns value
      dropdown.add(option); // adds element to html
    });
}

function calculatePotVolume(diameter, height) {
  const radius = diameter / 2;
  return Math.PI * Math.pow(radius, 2) * height;
}

async function calculateRecommendations(potVolume, potType, plantType, season) {
  const data = await fetchData("constants.json");
  if (!data) return;

  // .find instead of a loop

  const potData = data.find(
    (item) => item.datatype === "pot" && item.name === potType
  );
  const speciesData = data.find(
    (item) => item.datatype === "species" && item.name === plantType
  );
  const seasonData = data.find(
    (item) => item.datatype === "season" && item.name === season
  );

  const water =
    potVolume * 0.0001 * potData.datafield_1 * seasonData.datafield_1;
  const fertilizer = water * seasonData.datafield_2;

  document.getElementById("recommendedWater").textContent = `${water.toFixed(
    1
  )} liters`;
  document.getElementById(
    "recommendedFertilizer"
  ).textContent = `${fertilizer.toFixed(2)} units`;
}

async function findRecommendations(potVolume, potType, plantType, season) {
  const data = await fetchData("data.json"); // fetches the recommendations
  if (!data) return;

  const similarItems = data.filter(
    // instead of looping through data and counting similars creates an array
    (item) =>
      item.pot_type === potType &&
      item.plant_type === plantType &&
      item.time_of_year === season &&
      item.pot_volume > potVolume * 0.9 &&
      item.pot_volume < potVolume * 1.1
  );

  const similarWaterItems = similarItems.filter(
    // same as above
    (item) =>
      item.actual_water > item.recommended_water * 0.9 &&
      item.actual_water < item.recommended_water * 1.1
  );

  const lessWaterItems = similarItems.filter(
    // same as above
    (item) => item.actual_water <= item.recommended_water * 0.9
  );

  const moreWaterItems = similarItems.filter(
    // same as above
    (item) => item.actual_water >= item.recommended_water * 1.1
  );

  updateStatistics(similarItems, "similar"); // calls with array and a prefix
  updateStatistics(similarWaterItems, "similarwater");
  updateStatistics(lessWaterItems, "lesswater");
  updateStatistics(moreWaterItems, "morewater");

  document.getElementById("outputSection").style.display = "block"; // displays Stats
}

function updateStatistics(items, prefix) {
  const count = items.length; //array eg. similarItems -> number of similars
  const growthSum = items.reduce((sum, item) => sum + item.growth_rate, 0);
  const yieldSum = items.reduce((sum, item) => sum + item.crop_yield, 0);

  document.getElementById(`${prefix}Count`).textContent = count;
  document.getElementById(`${prefix}GrowthAverage`).textContent = count
    ? (growthSum / count).toFixed(1)
    : "-";
  document.getElementById(`${prefix}YieldAverage`).textContent = count
    ? (yieldSum / count).toFixed(1)
    : "-";
}

document
  .getElementById("calculateButton")
  .addEventListener("click", async function () {
    const potType = document.getElementById("potType").value;
    const potDiameter = parseFloat(
      document.getElementById("potDiameter").value
    );
    const potHeight = parseFloat(document.getElementById("potHeight").value);
    const plantType = document.getElementById("plantType").value;
    const season = document.getElementById("season").value;

    const potVolume = calculatePotVolume(potDiameter, potHeight);
    document.getElementById("potSize").textContent = (potVolume / 1000).toFixed(
      1
    );

    await calculateRecommendations(potVolume, potType, plantType, season);
    await findRecommendations(potVolume, potType, plantType, season);
  });
