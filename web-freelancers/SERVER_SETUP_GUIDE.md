# Web Freelancers - Live AI & Operator Chat System Guide 🚀

This system equips **Web Freelancers** with:
1. **Ultra-Modern Animated Landing Page** with interactive cyber particle network canvas, dynamic typewriter headline, 3D tilt cards, animated stat counters, real-time social proof alerts, and an interactive Project Cost Calculator!
2. **24/7 AI Chat Assistant** embedded on your website with instant agency knowledge (prices, packages, delivery time, technologies, portfolio, WhatsApp direct transfer).
3. **Real-Time Live Operator Portal (`portal.html`)** where you can see visitors in real-time, hear audio chimes when a message arrives, take over from the AI with one click, and chat directly with clients!
4. **Dual-Transport Architecture**:
   - **Local Browser Cross-Tab Mode**: Works immediately in your browser right now across tabs without needing to run any server commands!
   - **Production Server Mode**: Powered by Node.js, Express, and Socket.IO for bi-directional multi-user live messaging across the globe.

---

## 📁 Project Structure

```text
web-freelancers/
├── index.html                 # Main website with animations & AI chat widget
├── portal.html                # Operator / Admin Live Chat Portal
├── server.js                  # Production Node.js + Socket.IO real-time server
├── package.json               # Server dependencies & start scripts
├── .env.example               # Environment variables template
├── SERVER_SETUP_GUIDE.md      # Setup & deployment manual
├── assets/
│   ├── images/                # Logos, flyers, badges
│   │   ├── logo.png
│   │   └── Web Freelancers logo.png
│   └── videos/                # Ads & Intro videos
│       ├── Website ad_erasio.mp4
│       └── comapny intro_erasio.mp4
└── js/
    ├── animations.js          # Particle canvas, 3D tilt, counters, synthesizer
    └── chat-widget.js         # Visitor AI & Live chat logic with dual transport
```

---

## ⚡ Quick Test: Open Immediately in Browser (No Server Needed!)

You can test the live chat right now on your machine:
1. Double click or open `index.html` in your web browser (e.g., Google Chrome).
2. Open `portal.html` in another browser tab or side-by-side window.
3. On `index.html`, open the chat box at the bottom right and type a message or click **"👤 Connect Live Agent"**.
4. Switch to your `portal.html` tab — you will hear an audio chime and see the visitor appear live with their messages!
5. Type a reply in `portal.html` and hit Enter — it will instantly show up in the visitor's chat on `index.html`!

---

## 🖥️ Deploying & Running on Your Server (Node.js + VPS / Linux / Windows)

When you deploy this to your production server (e.g., Ubuntu VPS, DigitalOcean, AWS, Hostinger, cPanel, or Windows Server):

### Step 1: Install Node.js
Ensure Node.js (v18 or higher) is installed on your server:
```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Install Project Dependencies
In your project folder (`web-freelancers`):
```bash
npm install
```
This installs `express`, `socket.io`, `cors`, and `dotenv`.

### Step 3: Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
You can set your desired port (e.g., `PORT=3000` or `PORT=80`).

### Step 4: Start the Server
```bash
npm start
```
You will see:
```text
=======================================================
🚀 Web Freelancers Server running on http://localhost:3000
🌐 Website: http://localhost:3000/index.html
🛡️ Operator Portal: http://localhost:3000/portal.html
=======================================================
```

---

## 🔄 Running 24/7 in Background with PM2

To ensure the server never turns off even after closing the terminal:
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start server as a background service
pm2 start server.js --name "web-freelancers-chat"

# Save service to restart on system reboots
pm2 startup
pm2 save
```

To view logs or status:
```bash
pm2 status
pm2 logs web-freelancers-chat
```

---

## 🌐 Nginx Reverse Proxy Setup (for your domain e.g. webfreelancers.in)

If you are using Nginx to point your domain with SSL (HTTPS):

```nginx
server {
    server_name webfreelancers.in www.webfreelancers.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🛡️ Operator Portal Features (`portal.html`)

- **Live Visitor Stream**: Shows every active visitor, their session ID, browsing page, and unread badge.
- **Audio Chime System**: Zero-dependency Web Audio synthesizers play notifications for new messages and urgent live requests.
- **AI Handover Control**: 
  - Click **"⚡ Take Over from AI"** to stop bot replies and talk directly to the client.
  - Click **"🤖 Hand Back to AI"** whenever you are busy.
- **Canned Quick Responses**: 1-click preset answers for ₹7,999 package, ₹7,500 app, 7-day delivery, and requesting phone numbers.
- **Client Lead CRM**: Automatically detects phone numbers in chat and generates a 1-click **"Chat via WhatsApp"** button.
- **Status Toggle**: Set yourself to **Online**, **Away**, or **Offline**.

---

## 🎨 New Animations & Unique Features on the Website

1. **Interactive Cyber Particle Canvas**: Reactive starry/network particle canvas in the Hero section responding to mouse movements.
2. **Dynamic Headline Typewriter**: Cycles smoothly through key high-impact agency value propositions.
3. **3D Tilt Cards with Holographic Glare**: Cards dynamically tilt towards the cursor with an illuminating specular glow.
4. **Neon Gradient Animated Borders**: Featured package card ("POPULAR CHOICE") has a smooth glowing animated gradient border.
5. **Interactive Project Cost Calculator**: Clients can pick base packages, page scale, and high-growth add-ons to see live calculated investment and turnaround days with a 1-click WhatsApp order generator.
6. **Live Social Proof Ticker**: Subtle, modern activity notifications pop up in the corner showcasing verified client bookings and reviews.
7. **Animated Metric Counters**: Numbers smoothly count up as they scroll into view (100+, 100%, 7 Days).
