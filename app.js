const form = document.getElementById("subscriptionForm");
const list = document.getElementById("subscriptionsList");

let subscriptions = []; // Start empty, backend will fill it
let editRow = null;
let userEmail = localStorage.getItem("userEmail") || null;
window.userEmail = localStorage.getItem("userEmail") || null;

console.log("Logged in as:", window.userEmail);


if (!window.userEmail) {
  // User is not logged in → send to login page
  window.location.href = "index.html";
}

if (window.userEmail) {
  console.log("Welcome back", window.userEmail);
  document.querySelector(".g_id_signin")?.style?.setProperty("display", "none");
  document.getElementById("logoutBtn").style.display = "block";
  loadSubscriptions();
}

function handleCredentialResponse(response) {
  const user = jwt_decode(response.credential);

  window.userEmail = user.email;
  localStorage.setItem("userEmail", user.email);

  console.log("Logged in as:", window.userEmail);

  // Hide sign in, show sign out
  document.querySelector(".g_id_signin")?.style?.setProperty("display", "none");
  document.getElementById("logoutBtn").style.display = "block";

  loadSubscriptions();
}


document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("userEmail");
  userEmail = null;
  window.location= "index.html";
};

function loadSubscriptions() {
  if (!window.userEmail) return;

  fetch(`https://cutoff-backend-7q70.onrender.com/getSubscriptions?userEmail=${encodeURIComponent(window.userEmail)}`)
    .then(res => res.json())
    .then(data => {
      subscriptions = data;
      list.innerHTML = "";
      subscriptions.forEach(addCard);
    });
}



// Load existing subscriptions on page load
// subscriptions.forEach(addCard);

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (!window.userEmail) {
    alert("Please sign in first.");
    return;
  }

  const sub = {
    userEmail: window.userEmail,
    name: document.getElementById("name").value,
    platform: document.getElementById("platform").value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    email: document.getElementById("email").value,
    mobile: document.getElementById("mobile").value,
  };

  if (editRow !== null) {
    console.log("Sending update for row:", editRow);

    fetch(`https://cutoff-backend-7q70.onrender.com/updateSubscription/${editRow}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub)
    })
    .then(res => res.json())
    .then(() => {
      editRow = null;
      form.reset();
      loadSubscriptions(); // Refresh UI ✅
    });

    return;
  }

  // Normal Add
  fetch("https://cutoff-backend-7q70.onrender.com/addSubscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub)
  }).then(() => {
    form.reset();
    loadSubscriptions();
  });
});




function addCard(sub) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24))
  );

  const div = document.createElement("div");
  div.className = "sub-card";

  div.innerHTML = `
    <div class="sub-main">
      <!-- Header: title + badge -->
      <div class="sub-header">
        <div class="sub-title-block">
          <h3 class="sub-name">${sub.name}</h3>
          ${sub.platform ? `<p class="platform">${sub.platform}</p>` : ""}
        </div>
        <span class="days">${daysLeft} days left</span>
      </div>

      <!-- Uniform info rows -->
      <div class="sub-info">
        <div class="sub-row">
          <span class="sub-label">Period</span>
          <span class="sub-value">${formatDate(sub.startDate)} to ${formatDate(sub.endDate)}</span>
        </div>
        ${sub.email ? `
        <div class="sub-row">
          <span class="sub-label">Email</span>
          <span class="sub-value">${sub.email}</span>
        </div>` : ""}
        ${sub.mobile ? `
        <div class="sub-row">
          <span class="sub-label">Mobile</span>
          <span class="sub-value">${sub.mobile}</span>
        </div>` : ""}
      </div>
    </div>

    <!-- Actions always at bottom -->
    <div class="card-actions">
      <button class="edit-btn" onclick="editSub(${sub.row})">Edit</button>
      <button class="delete-btn" onclick="deleteSub(${sub.row})">Delete</button>
    </div>
  `;

  // badge color
  const badge = div.querySelector(".days");
  let base = "#4C6EF5";
  if (daysLeft <= 1) base = "#DC2626";
  else if (daysLeft <= 5) base = "#EA580C";
  badge.style.backgroundColor = base + "15";
  badge.style.color = base;

  list.prepend(div);
}


function deleteSub(row) {
  fetch(`https://cutoff-backend-7q70.onrender.com/deleteSubscription/${row}`, {
    method: "DELETE"
  }).then(() => {
    loadSubscriptions(); // Refresh UI after delete
  });
}


function editSub(row) {
  console.log("Editing row:", row);

  const sub = subscriptions.find(s => s.row === row);
  
  document.getElementById("name").value = sub.name;
  document.getElementById("platform").value = sub.platform;
  document.getElementById("startDate").value = sub.startDate;
  document.getElementById("endDate").value = sub.endDate;
  document.getElementById("email").value = sub.email;
  document.getElementById("mobile").value = sub.mobile;
 


  editRow = row;  // remember row being edited
}


function showToast() {
  const t = document.getElementById("toast");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}
