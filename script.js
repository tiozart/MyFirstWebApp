const form = document.getElementById("profileForm");
const rating = document.getElementById("rating");
const ratingValue = document.getElementById("ratingValue");
const result = document.getElementById("result");

rating.addEventListener("input", function () {
  ratingValue.textContent = rating.value;
});

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const interest = document.getElementById("interest").value;
  const experience = document.querySelector(
    'input[name="experience"]:checked'
  ).value;
  const interestRating = rating.value;
  const updates = document.getElementById("updates").checked;

  let recommendation;

  if (interest === "Cyber Security") {
    recommendation = "Try learning about safe passwords and phishing awareness.";
  } else if (interest === "Music") {
    recommendation = "Explore a new artist or practise a musical skill.";
  } else {
    recommendation = "Try learning about a new piece of technology.";
  }

  const updateMessage = updates
    ? " You have chosen to receive website updates."
    : " You have not selected website updates.";

  result.innerHTML = `
    <h3>Hello, ${name}!</h3>
    <p>You selected <strong>${interest}</strong> and described yourself as
    <strong>${experience}</strong>.</p>
    <p>Your interest rating is <strong>${interestRating}/10</strong>.</p>
    <p>${recommendation}${updateMessage}</p>
  `;

  result.classList.add("show");
});