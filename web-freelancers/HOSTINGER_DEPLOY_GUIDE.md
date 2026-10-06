# How to Deploy Web Freelancers & Live Chat on Hostinger (hPanel) 🚀

Because you have **Hostinger Business Web Hosting**, you **do not need any terminal or complex server setup**! 

I have created a **native PHP API (`chat-api.php`)** that works out-of-the-box on Hostinger's Apache/LiteSpeed web servers with zero database configuration.

---

## 📦 What Files to Upload

All files in your local project folder:
[`C:\Users\Jano_Rascol\.gemini\antigravity\scratch\web-freelancers`](file:///C:/Users/Jano_Rascol/.gemini/antigravity/scratch/web-freelancers)

- `index.html` (Main website with animations & AI chat widget)
- `portal.html` (Live Operator Portal)
- `chat-api.php` (Hostinger Live Chat & AI backend)
- `assets/` (Images, videos, logos)
- `css/` (Stylesheets)
- `js/` (`animations.js`, `chat-widget.js`)

---

## 🛠️ Step-by-Step Upload Instructions for Hostinger hPanel

### Step 1: Open Hostinger File Manager
1. In your **Hostinger hPanel** (from the screen you shared):
2. Click on the **Dashboard** button next to your website (e.g. `webfreelancers.in` or the domain you want to host it on).
3. In the search bar on the left, type **File Manager** (or find it under **Files** -> **File Manager**).
4. Click **Access files of [your domain]**.

---

### Step 2: Open `public_html`
1. Double click to open the **`public_html`** directory.
2. *(Optional)* If there is a default `default.php` file, you can delete or rename it.

---

### Step 3: Upload the Files
You have two easy choices:

#### Method A: Upload as ZIP (Recommended - Fastest!)
1. On your computer, select all files inside `web-freelancers` folder:
   - `index.html`
   - `portal.html`
   - `chat-api.php`
   - `assets` folder
   - `css` folder
   - `js` folder
2. Right-click -> **Compress to ZIP file** (name it `website.zip`).
3. In Hostinger File Manager, click the **Upload** button (top right) -> choose `website.zip`.
4. Right-click `website.zip` inside Hostinger File Manager -> click **Extract** -> Extract to `.` (current directory).
5. Done!

#### Method B: Drag and Drop
- Drag the files and folders directly from your computer into the Hostinger File Manager browser window.

---

## 🌐 How to Use Your Live Website & Operator Portal

### 1. Your Public Website (For Clients)
Visit your domain in any browser:
```text
https://yourdomain.com/
```
- Visitors see the new dynamic animations, interactive typewriter, 3D tilt cards, and the interactive Project Cost Calculator.
- The **AI Chat Assistant** is live in the bottom-right corner!
- Visitors can ask questions about the **₹7,999 Web Package**, **E-Commerce**, **Android App**, and **7-Day Delivery**.
- The AI answers instantly, or visitors can click **"Connect Live Agent"** to chat with you live!

### 2. Your Live Operator Portal (For You / Admin)
Open this private link on your computer or mobile phone browser:
```text
https://yourdomain.com/portal.html
```
- Bookmark this URL on your phone or PC!
- You will see the **Hostinger Live Sync Active** green badge.
- When any visitor chats on your website, you will **hear an audio chime** and see them appear on your screen!
- You can read their messages, click **"⚡ Take Over from AI"**, and reply to them in real time!
- You can click **"Chat via WhatsApp"** to instantly message them if they shared their phone number.

---

## 🔒 Security & Privacy Built-In
- `chat-api.php` automatically creates a protected `data/` folder on your Hostinger server with `.htaccess` deny rules so no one can download your chat logs.
- Zero external database required — runs smoothly with zero maintenance.
