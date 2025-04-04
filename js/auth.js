"use strict";

// Hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Cookie helpers
function setLastUsernameCookie(username) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `lastUsername=${encodeURIComponent(username)}; max-age=${maxAge}; path=/`;
}
function getLastUsernameFromCookie() {
  const match = document.cookie.match(new RegExp('(^| )lastUsername=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : "";
}

// Auth status UI update
function updateAuthStatus() {
  const authStatusEl = document.getElementById("authStatus");
  let user = localStorage.getItem("currentUser");

  if (user) {
    user = JSON.parse(user);

    authStatusEl.innerHTML = `
      <div class="user-menu">
        <button class="dropbtn">👤 ${user.username} ⬇</button>
        <div class="dropdown-content">
          <a href="#" id="profileBtn">View Profile</a>
          <a href="#" id="resetPwBtn">Reset Password</a>
          <a href="#" id="logoutBtn">Logout</a>
        </div>
      </div>
    `;
    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("resetPwBtn").addEventListener("click", () => showPasswordResetForm(user.email));
    document.getElementById("profileBtn").addEventListener("click", showProfilePage);
  } else {
    authStatusEl.innerHTML = `
      <button id="loginBtn">Login</button>
      <button id="createUserBtn">Create New User</button>
    `;
    document.getElementById("loginBtn").addEventListener("click", showLocalLoginForm);
    document.getElementById("createUserBtn").addEventListener("click", showNewUserForm);
  }
}

// Clear UI content
function clearContent() {
  const container = document.getElementById("content");
  if (container) container.innerHTML = "";
}

// Logout
function logout() {
  localStorage.removeItem("currentUser");
  updateAuthStatus();
  clearContent();
  alert("Logged out.");
}

function showProfilePage() {
  clearContent();
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const content = document.getElementById("content");

  content.innerHTML = `
    <h2>Your Profile</h2>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Username:</strong> <span id="usernameDisplay">${user.username}</span>
      <button id="editUsernameBtn">✏️ Edit</button></p>
    <p><strong>Learning Progress:</strong></p>
    <ul>
      <li>Flashcards Reviewed: ${localStorage.getItem("flashcardsReviewed") || 0}</li>
      <li>Quiz Attempts: ${localStorage.getItem("quizzesTaken") || 0}</li>
    </ul>
    <button id="backBtn">Back</button>
  `;

  document.getElementById("editUsernameBtn").addEventListener("click", async () => {
    const newUsername = prompt("Enter new username:", user.username);
    if (newUsername && newUsername.length >= 2) {
      user.username = newUsername;
      await updateUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      alert("Username updated!");
      showProfilePage(); // Reload view
      updateAuthStatus(); // Update dropdown label
    }
  });

  document.getElementById("backBtn").addEventListener("click", updateAuthStatus);
}


// New user form
function showNewUserForm() {
  clearContent();
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Create New User</h2>
    <form id="newUserForm">
      <label>Email: <input type="email" name="email" required></label><br>
      <label>Username: <input type="text" name="username" required></label><br>
      <label>Password: <input type="password" name="password" required></label><br>
      <button type="submit">Create Account</button>
    </form>
  `;
  document.getElementById("newUserForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email").trim();
    const username = formData.get("username").trim();
    const password = formData.get("password").trim();
    if (!email || !username || !password) {
      alert("All fields are required.");
      return;
    }
    const hashedPassword = await hashPassword(password);
    const user = { email, username, password: hashedPassword };
    addUserIfNotExists(user).then(() => {
      localStorage.setItem("currentUser", JSON.stringify(user));
      updateAuthStatus();
      alert("Account created and logged in.");
    }).catch(err => {
      console.error("Error creating new user:", err);
      alert("Failed to create user.");
    });
  });
}

// Login form
function showLocalLoginForm() {
  clearContent();
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Local Login</h2>
    <form id="localLoginForm">
      <label>Email: <input type="email" name="email" required></label><br>
      <label>Username: <input type="text" name="username" required></label><br>
      <label>Password: <input type="password" name="password" required></label><br>
      <button type="submit">Login</button>
    </form>
    <p><a href="#" id="forgotPasswordLink">Forgot your password?</a></p>
  `;
  document.getElementById("localLoginForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email").trim();
    const username = formData.get("username").trim();
    const password = formData.get("password").trim();
    if (!email || !username || !password) {
      alert("All fields are required.");
      return;
    }
    const hashedPassword = await hashPassword(password);
    getUserByEmail(email).then(existingUser => {
      if (existingUser) {
        if (existingUser.password !== hashedPassword || existingUser.username !== username) {
          alert("Incorrect username or password.");
          return;
        }
        localStorage.setItem("currentUser", JSON.stringify(existingUser));
        updateAuthStatus();
        alert("Login successful.");
      } else {
        alert("No user found with that email. Please create a new account.");
      }
    }).catch(err => {
      console.error("Error retrieving user:", err);
      alert("Login error.");
    });
  });

  document.getElementById("forgotPasswordLink").addEventListener("click", showPasswordResetForm);
}

// Password Reset UI
function showPasswordResetForm(prefilledEmail = "") {
  clearContent();
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Reset Password</h2>
    <form id="resetForm">
      <label>Email: <input type="email" name="resetEmail" required value="${prefilledEmail}"></label><br>
      <button type="submit">Reset Password</button>
    </form>
    <p><a href="#" id="backToLogin">Back</a></p>
  `;

  document.getElementById("resetForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const email = e.target.resetEmail.value.trim();
    const user = await getUserByEmail(email);
    if (!user) {
      alert("No user found with that email.");
      return;
    }
    const newPassword = prompt("Enter your new password (min 6 characters):");
    if (!newPassword || newPassword.length < 6) {
      alert("Invalid password.");
      return;
    }
    const hashed = await hashPassword(newPassword);
    user.password = hashed;
    await updateUser(user);
    alert("Password reset successful. Please log in.");
    showLocalLoginForm();
  });

  document.getElementById("backToLogin").addEventListener("click", showLocalLoginForm);
}

// IndexedDB helpers
function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(["usersStore"], "readonly");
      const store = transaction.objectStore("usersStore");
      const req = store.get(email);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    }).catch(reject);
  });
}

function addUserIfNotExists(user) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(["usersStore"], "readwrite");
      const store = transaction.objectStore("usersStore");
      const req = store.get(user.email);
      req.onsuccess = function(e) {
        if (!e.target.result) {
          const addReq = store.add(user);
          addReq.onsuccess = () => resolve();
          addReq.onerror = e => reject(e.target.error);
        } else {
          resolve(); // user exists already
        }
      };
      req.onerror = e => reject(e.target.error);
    }).catch(reject);
  });
}

function updateUser(user) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(["usersStore"], "readwrite");
      const store = transaction.objectStore("usersStore");
      const req = store.put(user);
      req.onsuccess = () => resolve();
      req.onerror = e => reject(e.target.error);
    }).catch(reject);
  });
}
