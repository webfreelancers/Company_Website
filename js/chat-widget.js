/**
 * Web Freelancers - AI Assistant & Live Support Chat Widget
 * 
 * Supports:
 * 1. Hostinger Native PHP Mode (via chat-api.php - Zero configuration!)
 * 2. Node.js WebSocket Mode (via Socket.IO)
 * 3. Local Browser Cross-Tab Mode (via BroadcastChannel)
 * 4. Instant 24/7 AI Knowledge Base + Sound Effects + Lead Capture
 */

class LiveChatWidget {
    constructor() {
        this.isOpen = false;
        this.mode = 'ai'; // 'ai' or 'live'
        this.visitorId = this.getOrCreateVisitorId();
        this.visitorName = localStorage.getItem('wf_visitor_name') || 'Visitor';
        this.visitorPhone = localStorage.getItem('wf_visitor_phone') || '';
        this.messages = this.loadMessages();
        this.socket = null;
        this.broadcastChannel = null;
        this.hasPhpApi = false;
        this.pollingInterval = null;
        this.typingTimeout = null;

        this.initDOM();
        this.initTransports();
        this.renderMessages();

        if (this.messages.length === 0) {
            this.addSystemGreeting();
        }
    }

    getOrCreateVisitorId() {
        let vid = localStorage.getItem('wf_visitor_id');
        if (!vid) {
            vid = 'vis_' + Math.floor(1000 + Math.random() * 9000);
            localStorage.setItem('wf_visitor_id', vid);
        }
        return vid;
    }

    loadMessages() {
        try {
            const raw = localStorage.getItem('wf_chat_history');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    saveMessages() {
        try {
            localStorage.setItem('wf_chat_history', JSON.stringify(this.messages));
        } catch (e) {}
    }

    initTransports() {
        // 1. Cross-Tab Sync (Local testing)
        if (window.BroadcastChannel) {
            try {
                this.broadcastChannel = new BroadcastChannel('wf_live_chat');
                this.broadcastChannel.onmessage = (event) => {
                    this.handleIncomingBroadcast(event.data);
                };
            } catch (e) {}
        }

        // 2. Check for Hostinger PHP API (chat-api.php)
        fetch('chat-api.php?action=health')
            .then(res => res.json())
            .then(data => {
                if (data && data.status === 'online') {
                    this.hasPhpApi = true;
                    console.log('[LiveChat] Connected to Hostinger PHP API:', data.platform);
                    this.registerVisitorWithPhp();
                    this.startPhpPolling();
                }
            })
            .catch(() => {
                // If not hosted on PHP or running offline, fall back gracefully
            });

        // 3. Socket.IO connection (if running on Node.js server)
        if (typeof io !== 'undefined') {
            try {
                const serverUrl = window.location.origin.includes('localhost') 
                    ? window.location.origin 
                    : (window.location.protocol.startsWith('http') ? window.location.origin : 'http://localhost:3000');
                
                this.socket = io(serverUrl, {
                    transports: ['websocket', 'polling'],
                    reconnectionAttempts: 3,
                    timeout: 3000
                });

                this.socket.on('connect', () => {
                    console.log('[LiveChat] Connected to WebSocket Server:', this.socket.id);
                    this.socket.emit('visitor:join', {
                        visitorId: this.visitorId,
                        name: this.visitorName,
                        phone: this.visitorPhone,
                        page: window.location.pathname || 'Home',
                        mode: this.mode
                    });
                });

                this.socket.on('operator:message', (data) => {
                    if (data.visitorId === this.visitorId) {
                        this.receiveOperatorMessage(data.text, data.senderName || 'Operator Janoshan');
                    }
                });

                this.socket.on('operator:takeover', (data) => {
                    if (data.visitorId === this.visitorId) {
                        this.setMode('live');
                        this.showSystemNotice(`👤 ${data.senderName || 'Live Operator'} has joined the chat! You are now speaking directly with a real human.`);
                    }
                });
            } catch (err) {}
        }
    }

    registerVisitorWithPhp() {
        fetch('chat-api.php?action=visitor_join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitorId: this.visitorId,
                name: this.visitorName,
                phone: this.visitorPhone,
                page: window.location.pathname || 'Home'
            })
        }).catch(() => {});
    }

    startPhpPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => {
            fetch(`chat-api.php?action=visitor_poll&visitorId=${this.visitorId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success' && Array.isArray(data.messages)) {
                        let hasNew = false;
                        const currentIds = new Set(this.messages.map(m => m.id));

                        data.messages.forEach(msg => {
                            if (!currentIds.has(msg.id)) {
                                this.messages.push(msg);
                                currentIds.add(msg.id);
                                hasNew = true;
                                if (msg.sender === 'operator') {
                                    if (window.wfAudio) window.wfAudio.playDing();
                                    if (!this.isOpen) {
                                        const badge = document.getElementById('wf-unread-badge');
                                        if (badge) badge.classList.remove('hidden');
                                    }
                                }
                            }
                        });

                        if (data.mode && data.mode !== this.mode) {
                            this.setMode(data.mode);
                        }

                        if (hasNew) {
                            this.saveMessages();
                            this.renderMessages();
                        }
                    }
                })
                .catch(() => {});
        }, 2500);
    }

    handleIncomingBroadcast(data) {
        if (!data || data.visitorId !== this.visitorId) return;

        if (data.type === 'operator_message') {
            this.receiveOperatorMessage(data.text, data.senderName || 'Operator Janoshan');
        } else if (data.type === 'operator_takeover') {
            this.setMode('live');
            this.showSystemNotice(`👤 ${data.senderName || 'Live Operator Janoshan'} has joined the chat.`);
        } else if (data.type === 'operator_return_ai') {
            this.setMode('ai');
            this.showSystemNotice(`🤖 AI Assistant has resumed the chat.`);
        }
    }

    broadcast(data) {
        data.visitorId = this.visitorId;
        data.visitorName = this.visitorName;
        data.visitorPhone = this.visitorPhone;
        data.page = window.location.pathname || 'Home';
        data.timestamp = new Date().toISOString();

        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage(data);
        }

        if (this.socket && this.socket.connected) {
            if (data.type === 'visitor_message') {
                this.socket.emit('visitor:message', data);
            } else if (data.type === 'visitor_request_live') {
                this.socket.emit('visitor:request_live', data);
            }
        }
    }

    initDOM() {
        const launcher = document.createElement('div');
        launcher.id = 'wf-chat-launcher';
        launcher.className = 'fixed bottom-6 right-6 z-50 flex items-center gap-3 group cursor-pointer';
        launcher.innerHTML = `
            <div id="wf-chat-teaser" class="hidden sm:flex items-center gap-2 glass-card px-4 py-2 rounded-2xl border border-sky-500/40 shadow-xl text-xs font-semibold text-slate-200 transition-all duration-300 transform group-hover:scale-105">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Chat with AI / Live Operator</span>
            </div>

            <button class="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-sky-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border border-white/20">
                <i data-lucide="message-square" id="wf-launcher-icon" class="w-7 h-7"></i>
                <span id="wf-unread-badge" class="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md hidden">1</span>
            </button>
        `;

        const widget = document.createElement('div');
        widget.id = 'wf-chat-modal';
        widget.className = 'fixed bottom-24 right-6 z-50 w-[360px] sm:w-[400px] h-[580px] max-h-[85vh] glass-card rounded-3xl border border-sky-500/30 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform translate-y-12 opacity-0 pointer-events-none bg-slate-950/95 backdrop-blur-2xl';
        widget.innerHTML = `
            <div class="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-0.5 flex items-center justify-center text-white shadow-md">
                        <img src="./assets/images/Web Freelancers logo.png" onerror="this.src='./assets/images/logo.png'" alt="Logo" class="w-8 h-8 object-contain">
                        <span id="wf-header-status-dot" class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-white text-sm">Web Freelancers</h4>
                            <span id="wf-mode-pill" class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">AI Bot</span>
                        </div>
                        <p id="wf-header-status-text" class="text-xs text-slate-400 flex items-center gap-1">
                            <span>Instant 24/7 AI & Live Support</span>
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-1.5 text-slate-400">
                    <button id="wf-sound-toggle" class="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition" title="Toggle Sound">
                        <i data-lucide="volume-2" class="w-4 h-4"></i>
                    </button>
                    <button id="wf-chat-close" class="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition" title="Close">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <div id="wf-mode-banner" class="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <span id="wf-mode-desc" class="text-slate-300">🤖 AI is actively answering.</span>
                <button id="wf-request-human-btn" class="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1">
                    <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
                    <span>Connect Live Agent</span>
                </button>
            </div>

            <div id="wf-messages-container" class="flex-1 p-4 overflow-y-auto space-y-3 text-sm no-scrollbar"></div>

            <div id="wf-typing-box" class="px-5 py-2 text-xs text-slate-400 flex items-center gap-2 hidden">
                <div class="flex gap-1">
                    <span class="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
                    <span class="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span class="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span id="wf-typing-name">Thinking...</span>
            </div>

            <div id="wf-quick-chips" class="px-3 py-2 bg-slate-950/70 border-t border-slate-900 flex gap-1.5 overflow-x-auto no-scrollbar">
                <button class="wf-chip whitespace-nowrap text-xs bg-slate-900 hover:bg-sky-600/30 text-slate-300 hover:text-white border border-slate-800 px-2.5 py-1 rounded-lg transition" data-query="What is included in the ₹7,999 Web Package?">
                    💰 ₹7,999 Package
                </button>
                <button class="wf-chip whitespace-nowrap text-xs bg-slate-900 hover:bg-sky-600/30 text-slate-300 hover:text-white border border-slate-800 px-2.5 py-1 rounded-lg transition" data-query="How does the Android App (₹7,500) work?">
                    📱 Android App
                </button>
                <button class="wf-chip whitespace-nowrap text-xs bg-slate-900 hover:bg-sky-600/30 text-slate-300 hover:text-white border border-slate-800 px-2.5 py-1 rounded-lg transition" data-query="What features come with E-Commerce Store?">
                    🛒 E-Commerce
                </button>
                <button class="wf-chip whitespace-nowrap text-xs bg-slate-900 hover:bg-sky-600/30 text-slate-300 hover:text-white border border-slate-800 px-2.5 py-1 rounded-lg transition" data-query="Can you really deliver in 7 days?">
                    ⚡ 7-Day Delivery
                </button>
                <button class="wf-chip whitespace-nowrap text-xs bg-slate-900 hover:bg-sky-600/30 text-slate-300 hover:text-white border border-slate-800 px-2.5 py-1 rounded-lg transition" data-query="I want to talk to human operator Janoshan">
                    👤 Talk to Human
                </button>
            </div>

            <div class="p-3 border-t border-slate-800 bg-slate-900/90">
                <form id="wf-chat-form" class="flex items-center gap-2">
                    <input type="text" id="wf-chat-input" placeholder="Ask AI or type for live agent..." class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition">
                    <button type="submit" class="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-md shadow-sky-500/30 transition flex-shrink-0">
                        <i data-lucide="send" class="w-4 h-4"></i>
                    </button>
                </form>
                <div class="mt-2 flex items-center justify-between text-[10px] text-slate-500 px-1">
                    <span>Direct WhatsApp: +91 7530018721</span>
                    <a href="https://wa.me/917530018721?text=Hi%20Web%20Freelancers,%20I%20am%20chatting%20from%20your%20website" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-0.5 font-bold">
                        <span>Open WhatsApp</span>
                        <i data-lucide="external-link" class="w-2.5 h-2.5"></i>
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(launcher);
        document.body.appendChild(widget);

        launcher.addEventListener('click', () => this.toggleChat());
        document.getElementById('wf-chat-close').addEventListener('click', () => this.toggleChat(false));
        document.getElementById('wf-chat-form').addEventListener('submit', (e) => this.handleSendMessage(e));
        document.getElementById('wf-request-human-btn').addEventListener('click', () => this.requestHumanAgent());

        document.querySelectorAll('.wf-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const query = chip.getAttribute('data-query');
                this.sendUserMessage(query);
            });
        });

        const soundBtn = document.getElementById('wf-sound-toggle');
        soundBtn.addEventListener('click', () => {
            if (window.wfAudio) {
                window.wfAudio.enabled = !window.wfAudio.enabled;
                soundBtn.innerHTML = window.wfAudio.enabled 
                    ? `<i data-lucide="volume-2" class="w-4 h-4"></i>`
                    : `<i data-lucide="volume-x" class="w-4 h-4 text-red-400"></i>`;
                if (window.lucide) window.lucide.createIcons();
            }
        });

        if (window.lucide) window.lucide.createIcons();
    }

    toggleChat(forceState) {
        this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
        const modal = document.getElementById('wf-chat-modal');
        const badge = document.getElementById('wf-unread-badge');
        const teaser = document.getElementById('wf-chat-teaser');

        if (this.isOpen) {
            modal.classList.remove('opacity-0', 'translate-y-12', 'pointer-events-none');
            modal.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
            if (badge) badge.classList.add('hidden');
            if (teaser) teaser.classList.add('hidden');
            document.getElementById('wf-chat-input').focus();
            this.scrollToBottom();
            if (window.wfAudio) window.wfAudio.playPop();
        } else {
            modal.classList.add('opacity-0', 'translate-y-12', 'pointer-events-none');
            modal.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
        }
    }

    addSystemGreeting() {
        const welcome = {
            id: 'msg_' + Date.now(),
            sender: 'ai',
            senderName: 'Web Freelancers AI',
            text: `👋 **Welcome to Web Freelancers!**\n\nI am your 24/7 AI Assistant. We build:\n• **Corporate Websites** (₹7,999 with 1-Yr Free Domain & Hosting)\n• **E-Commerce Stores** (₹8,999 - ₹14,999 with Payment Gateway)\n• **Android Apps** (₹7,500 with Play Store Submission)\n• **SEO & Google Ads**\n\nHow can I help your business grow today?`,
            time: this.formatTime(new Date())
        };
        this.messages.push(welcome);
        this.saveMessages();
        this.renderMessages();
    }

    handleSendMessage(e) {
        e.preventDefault();
        const input = document.getElementById('wf-chat-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        this.sendUserMessage(text);
    }

    sendUserMessage(text) {
        if (window.wfAudio) window.wfAudio.playPop();

        const userMsg = {
            id: 'msg_' + Date.now(),
            sender: 'user',
            senderName: this.visitorName,
            text: text,
            time: this.formatTime(new Date())
        };

        this.messages.push(userMsg);
        this.saveMessages();
        this.renderMessages();

        // 1. Send to Hostinger PHP backend if available
        if (this.hasPhpApi) {
            this.showTypingIndicator('Processing request...');
            fetch('chat-api.php?action=visitor_send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitorId: this.visitorId,
                    name: this.visitorName,
                    text: text,
                    page: window.location.pathname || 'Home'
                })
            })
            .then(res => res.json())
            .then(data => {
                this.hideTypingIndicator();
                if (data.aiMsg) {
                    this.messages.push(data.aiMsg);
                    this.saveMessages();
                    this.renderMessages();
                    if (window.wfAudio) window.wfAudio.playChime();
                }
                if (data.mode) {
                    this.setMode(data.mode);
                }
            })
            .catch(() => {
                this.fallbackClientAI(text);
            });
        } else {
            // 2. Client-side AI fallback or WebSocket broadcast
            this.broadcast({
                type: 'visitor_message',
                text: text,
                mode: this.mode
            });
            this.fallbackClientAI(text);
        }
    }

    fallbackClientAI(text) {
        const humanKeywords = ['human', 'agent', 'operator', 'call', 'talk to person', 'janoshan'];
        const isRequestingHuman = humanKeywords.some(k => text.toLowerCase().includes(k));

        if (isRequestingHuman && this.mode === 'ai') {
            this.requestHumanAgent();
            return;
        }

        if (this.mode === 'ai') {
            this.showTypingIndicator('AI is analyzing your request...');
            setTimeout(() => {
                const replyText = this.generateAIResponse(text);
                this.receiveAIMessage(replyText);
            }, 700 + Math.random() * 500);
        }
    }

    receiveAIMessage(text) {
        this.hideTypingIndicator();
        if (window.wfAudio) window.wfAudio.playChime();

        const aiMsg = {
            id: 'msg_' + Date.now(),
            sender: 'ai',
            senderName: 'Web Freelancers AI',
            text: text,
            time: this.formatTime(new Date())
        };

        this.messages.push(aiMsg);
        this.saveMessages();
        this.renderMessages();

        this.broadcast({
            type: 'ai_response',
            text: text
        });
    }

    receiveOperatorMessage(text, senderName) {
        this.hideTypingIndicator();
        if (window.wfAudio) window.wfAudio.playDing();

        const opMsg = {
            id: 'msg_' + Date.now(),
            sender: 'operator',
            senderName: senderName || 'Operator Janoshan',
            text: text,
            time: this.formatTime(new Date())
        };

        this.messages.push(opMsg);
        this.saveMessages();
        this.renderMessages();

        if (!this.isOpen) {
            const badge = document.getElementById('wf-unread-badge');
            if (badge) badge.classList.remove('hidden');
        }
    }

    requestHumanAgent() {
        this.setMode('live');
        if (window.wfAudio) window.wfAudio.playDing();

        if (this.hasPhpApi) {
            fetch('chat-api.php?action=visitor_request_live', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitorId: this.visitorId })
            }).catch(() => {});
        }

        const alertNotice = {
            id: 'msg_' + Date.now(),
            sender: 'system',
            text: `🔔 **Connecting to Live Support Team...**\nJanoshan has been notified in the Operator Portal. Type your query below or connect on WhatsApp at **+91 7530018721**!`,
            time: this.formatTime(new Date())
        };
        this.messages.push(alertNotice);
        this.saveMessages();
        this.renderMessages();

        this.broadcast({
            type: 'visitor_request_live',
            urgent: true
        });
    }

    setMode(mode) {
        this.mode = mode;
        const modePill = document.getElementById('wf-mode-pill');
        const modeDesc = document.getElementById('wf-mode-desc');
        const humanBtn = document.getElementById('wf-request-human-btn');

        if (!modePill || !modeDesc || !humanBtn) return;

        if (mode === 'live') {
            modePill.textContent = 'Live Agent';
            modePill.className = 'text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            modeDesc.innerHTML = '🟢 <b>Live Chat Active</b> (Direct with Operator)';
            humanBtn.classList.add('hidden');
        } else {
            modePill.textContent = 'AI Bot';
            modePill.className = 'text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30';
            modeDesc.innerHTML = '🤖 AI is actively answering.';
            humanBtn.classList.remove('hidden');
        }
    }

    showSystemNotice(text) {
        this.messages.push({
            id: 'msg_' + Date.now(),
            sender: 'system',
            text: text,
            time: this.formatTime(new Date())
        });
        this.saveMessages();
        this.renderMessages();
    }

    showTypingIndicator(label) {
        const box = document.getElementById('wf-typing-box');
        const name = document.getElementById('wf-typing-name');
        if (box && name) {
            name.textContent = label;
            box.classList.remove('hidden');
            this.scrollToBottom();

            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                box.classList.add('hidden');
            }, 5000);
        }
    }

    hideTypingIndicator() {
        const box = document.getElementById('wf-typing-box');
        if (box) box.classList.add('hidden');
    }

    generateAIResponse(input) {
        const q = input.toLowerCase();

        const phoneMatch = input.match(/(\+?\d{10,12})/);
        if (phoneMatch) {
            this.visitorPhone = phoneMatch[0];
            localStorage.setItem('wf_visitor_phone', this.visitorPhone);
            return `Thank you! I have saved your phone number **${this.visitorPhone}**. Our senior developer Janoshan will call or WhatsApp you shortly! What project are you interested in?`;
        }

        if (q.includes('7999') || q.includes('web development') || q.includes('package') || q.includes('website price') || q.includes('business website')) {
            return `🚀 **Our Web Development Package is ₹7,999:**\n\n• **3 to 7 High-Converting Pages**\n• **1-Year Domain (.com/.in) & Web Hosting INCLUDED**\n• **Free SSL Security Certificate**\n• **WhatsApp Chat & Google Maps Integration**\n• **100% Mobile Responsive**\n• **Express 7-Day Guaranteed Delivery**\n\nWould you like to book this now or connect with our developer?`;
        }

        if (q.includes('ecommerce') || q.includes('e-commerce') || q.includes('online store') || q.includes('shop') || q.includes('sell')) {
            return `🛍️ **E-Commerce Store Package (₹8,999 - ₹14,999):**\n\n• Up to 10+ Products\n• Secure Payment Gateway (Razorpay/UPI/Cards)\n• Shiprocket Automatic Shipping & Invoices\n• Customer Accounts, Wishlist & Coupons\n• Admin Dashboard to manage inventory\n\nReady to start selling online? Drop your WhatsApp number or click 'Connect Live Agent'!`;
        }

        if (q.includes('app') || q.includes('android') || q.includes('play store') || q.includes('apk') || q.includes('7500')) {
            return `📱 **Mobile App Development (Flat ₹7,500):**\n\n• Native Android APK generated\n• Custom App Icon with your brand logo\n• In-App Refresh, Offline Internet Alerts & Loading Spinners\n• Payment Gateway Integration in App\n• Submission & Publishing to Google Play Store!`;
        }

        if (q.includes('delivery') || q.includes('days') || q.includes('time') || q.includes('fast')) {
            return `⚡ **Express 7-Day Delivery Guarantee!**\n\nWe deliver your fully functioning website within **7 business days** with active weekend support (Saturday & Sunday)!`;
        }

        if (q.includes('contact') || q.includes('phone') || q.includes('address') || q.includes('office')) {
            return `📍 **Contact Web Freelancers:**\n\n• **WhatsApp / Phone:** +91 75300 18721\n• **Address:** 17/7 J G Nagar, 60 Feet Rd, Kumarnathapuram, Tiruppur, Tamil Nadu 641602\n• **Email:** support@webfreelancers.in`;
        }

        if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('vanakkam')) {
            return `Hello! Welcome to Web Freelancers! How can I assist you with your website or app today? Feel free to ask about our **₹7,999 Web Package**, **E-Commerce**, **Android App**, or click **'Connect Live Agent'**!`;
        }

        return `Got it! We can definitely build that for your business. Share your **WhatsApp / Phone number** here, or click **'Connect Live Agent'** above to speak directly with Janoshan!`;
    }

    renderMessages() {
        const container = document.getElementById('wf-messages-container');
        if (!container) return;

        container.innerHTML = '';
        this.messages.forEach(msg => {
            const el = document.createElement('div');
            
            if (msg.sender === 'user') {
                el.className = 'flex justify-end';
                el.innerHTML = `
                    <div class="max-w-[80%] bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 shadow-md">
                        <p class="whitespace-pre-wrap leading-relaxed">${this.formatMarkdown(msg.text)}</p>
                        <span class="text-[9px] text-sky-200 block text-right mt-1 opacity-80">${msg.time}</span>
                    </div>
                `;
            } else if (msg.sender === 'system') {
                el.className = 'flex justify-center my-2';
                el.innerHTML = `
                    <div class="max-w-[90%] bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl px-3 py-2 text-center">
                        <p class="whitespace-pre-wrap">${this.formatMarkdown(msg.text)}</p>
                    </div>
                `;
            } else {
                const isOp = msg.sender === 'operator';
                const avatarBg = isOp ? 'bg-emerald-500' : 'bg-sky-500';
                const badgeText = isOp ? 'Live Operator' : 'AI Assistant';
                const badgeColor = isOp ? 'text-emerald-400 bg-emerald-500/10' : 'text-sky-400 bg-sky-500/10';

                el.className = 'flex justify-start gap-2';
                el.innerHTML = `
                    <div class="w-7 h-7 rounded-lg ${avatarBg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
                        ${isOp ? 'OP' : 'AI'}
                    </div>
                    <div class="max-w-[85%] bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-md">
                        <div class="flex items-center gap-1.5 mb-1">
                            <span class="font-bold text-xs text-white">${msg.senderName || 'Web Freelancers'}</span>
                            <span class="text-[9px] font-semibold px-1.5 py-0.2 rounded ${badgeColor}">${badgeText}</span>
                        </div>
                        <div class="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">${this.formatMarkdown(msg.text)}</div>
                        <span class="text-[9px] text-slate-500 block text-right mt-1">${msg.time}</span>
                    </div>
                `;
            }

            container.appendChild(el);
        });

        this.scrollToBottom();
    }

    formatMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    scrollToBottom() {
        const container = document.getElementById('wf-messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.wfLiveChat = new LiveChatWidget();
});
