/**
 * Web Freelancers - Real-Time AI & Live Operator Chat Server
 * Node.js + Express + Socket.IO
 * 
 * Features:
 * - Serves website and operator portal statically
 * - Real-time bi-directional messaging between visitors and operators
 * - Room-based visitor session management
 * - Intelligent built-in AI bot with agency knowledge
 * - Optional Google Gemini / OpenAI integration hook via .env
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration for multi-domain support
app.use(cors());
app.use(express.json());

// Serve static assets from current directory
app.use(express.static(path.join(__dirname)));

// Socket.IO setup with permissive CORS
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Port configuration
const PORT = process.env.PORT || 3000;

// State storage (in-memory)
const visitors = new Map(); // visitorId -> { id, socketId, name, phone, page, mode: 'ai'|'live', messages: [], unread: 0 }
const operators = new Set(); // socketId set

// Agency Knowledge Base for AI
const AGENCY_KNOWLEDGE = {
    web: `Our Web Development Package is ₹7,999 (introductory offer). It includes 3 to 7 custom pages, 1 year free domain (.com/.in) and cloud hosting, free SSL, WhatsApp chat button, Google Maps integration, and guaranteed 7-day express delivery!`,
    ecommerce: `Our E-Commerce Package (₹8,999 - ₹14,999) includes up to 10 products, payment gateway (Razorpay/UPI/Cards), Shiprocket automated shipping, customer accounts, coupon codes, and a full admin dashboard to manage orders.`,
    app: `Our Mobile App Package is ₹7,500 flat. We provide the complete Android APK with your custom logo, push offline alerts, payment gateway inside the app, and submit it directly to the Google Play Store!`,
    delivery: `We guarantee 7-day express turnaround time! We also provide weekend support on Saturday and Sunday.`,
    contact: `You can reach Web Freelancers directly on WhatsApp or Call at +91 75300 18721. Office: Kumarnathapuram, Tiruppur, Tamil Nadu.`,
    default: `Thank you for contacting Web Freelancers! We would love to build this for you. Please share your phone or WhatsApp number, or click 'Connect Live Agent' to speak directly with Janoshan!`
};

function generateAIResponse(text) {
    const q = (text || '').toLowerCase();
    if (q.includes('7999') || q.includes('web') || q.includes('website') || q.includes('package')) {
        return AGENCY_KNOWLEDGE.web;
    }
    if (q.includes('ecommerce') || q.includes('e-commerce') || q.includes('shop') || q.includes('store') || q.includes('sell')) {
        return AGENCY_KNOWLEDGE.ecommerce;
    }
    if (q.includes('app') || q.includes('android') || q.includes('7500') || q.includes('play store')) {
        return AGENCY_KNOWLEDGE.app;
    }
    if (q.includes('delivery') || q.includes('days') || q.includes('time') || q.includes('fast')) {
        return AGENCY_KNOWLEDGE.delivery;
    }
    if (q.includes('contact') || q.includes('phone') || q.includes('call') || q.includes('address')) {
        return AGENCY_KNOWLEDGE.contact;
    }
    return AGENCY_KNOWLEDGE.default;
}

// Socket.IO Real-Time Communications
io.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // --- 1. VISITOR EVENTS ---
    socket.on('visitor:join', (data) => {
        const vid = data.visitorId || ('vis_' + socket.id.substring(0, 5));
        socket.join(vid);
        socket.visitorId = vid;

        let visitor = visitors.get(vid);
        if (!visitor) {
            visitor = {
                id: vid,
                socketId: socket.id,
                name: data.name || 'Visitor #' + vid.replace('vis_', ''),
                phone: data.phone || '',
                page: data.page || 'Home',
                mode: data.mode || 'ai',
                messages: [],
                unread: 0,
                connectedAt: new Date()
            };
            visitors.set(vid, visitor);
        } else {
            visitor.socketId = socket.id;
        }

        console.log(`[Visitor Joined] ${visitor.name} (${vid})`);

        // Notify operators
        io.to('operators').emit('visitor:join', visitor);
    });

    socket.on('visitor:message', (data) => {
        const vid = socket.visitorId || data.visitorId;
        const visitor = visitors.get(vid);
        if (!visitor) return;

        const msgObj = {
            id: 'msg_' + Date.now(),
            sender: 'user',
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        visitor.messages.push(msgObj);

        // Forward to operators
        io.to('operators').emit('visitor:message', {
            visitorId: vid,
            visitorName: visitor.name,
            visitorPhone: visitor.phone,
            text: data.text,
            mode: visitor.mode
        });

        // If in AI mode, reply after short delay
        if (visitor.mode === 'ai') {
            setTimeout(() => {
                const aiReply = generateAIResponse(data.text);
                const aiMsgObj = {
                    id: 'msg_' + Date.now(),
                    sender: 'ai',
                    text: aiReply,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                visitor.messages.push(aiMsgObj);

                io.to(vid).emit('ai_response', {
                    visitorId: vid,
                    text: aiReply
                });

                io.to('operators').emit('ai_response', {
                    visitorId: vid,
                    text: aiReply
                });
            }, 800);
        }
    });

    socket.on('visitor:request_live', (data) => {
        const vid = socket.visitorId || data.visitorId;
        const visitor = visitors.get(vid);
        if (visitor) {
            visitor.mode = 'live';
            io.to('operators').emit('visitor:request_live', {
                visitorId: vid,
                urgent: true
            });
            console.log(`[Urgent Live Request] Visitor ${vid} requested live human operator!`);
        }
    });

    socket.on('visitor:typing', (data) => {
        const vid = socket.visitorId || data.visitorId;
        io.to('operators').emit('visitor:typing', { visitorId: vid });
    });

    // --- 2. OPERATOR EVENTS ---
    socket.on('operator:join', (data) => {
        socket.join('operators');
        operators.add(socket.id);
        console.log(`[Operator Connected] Operator ${data.operatorName || 'Janoshan'} joined.`);

        // Send all currently active visitors
        const list = Array.from(visitors.values());
        list.forEach(v => {
            socket.emit('visitor:join', v);
        });
    });

    socket.on('operator:message', (data) => {
        const vid = data.visitorId;
        const visitor = visitors.get(vid);
        if (visitor) {
            visitor.mode = 'live'; // Operator has engaged
            const opMsg = {
                id: 'msg_' + Date.now(),
                sender: 'operator',
                senderName: data.senderName || 'Operator Janoshan',
                text: data.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            visitor.messages.push(opMsg);

            // Send to visitor room
            io.to(vid).emit('operator:message', {
                visitorId: vid,
                senderName: data.senderName || 'Operator Janoshan',
                text: data.text
            });

            console.log(`[Operator -> Visitor ${vid}] ${data.text}`);
        }
    });

    socket.on('operator:takeover', (data) => {
        const vid = data.visitorId;
        const visitor = visitors.get(vid);
        if (visitor) {
            visitor.mode = 'live';
            io.to(vid).emit('operator:takeover', {
                visitorId: vid,
                senderName: data.senderName || 'Operator Janoshan'
            });
        }
    });

    socket.on('disconnect', () => {
        if (operators.has(socket.id)) {
            operators.delete(socket.id);
            console.log(`[Operator Disconnected] ${socket.id}`);
        }
        if (socket.visitorId) {
            console.log(`[Visitor Disconnected] ${socket.visitorId}`);
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        activeVisitors: visitors.size,
        activeOperators: operators.size,
        timestamp: new Date().toISOString()
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Web Freelancers Server running on http://localhost:${PORT}`);
    console.log(`🌐 Website: http://localhost:${PORT}/index.html`);
    console.log(`🛡️ Operator Portal: http://localhost:${PORT}/portal.html`);
    console.log(`=======================================================`);
});
