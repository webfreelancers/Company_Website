<?php
/**
 * Web Freelancers - Hostinger PHP Live Chat & AI API
 * 100% Compatible with Hostinger Shared & Business Web Hosting
 * No database or terminal commands required - Pure Plug & Play!
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Storage Directory
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

// Prevent direct browser download of json files
$htaccessFile = $dataDir . '/.htaccess';
if (!file_exists($htaccessFile)) {
    @file_put_contents($htaccessFile, "Deny from all\n");
}

$dataFile = $dataDir . '/chats.json';

// Initialize data store if not present
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([
        'visitors' => [],
        'lastUpdated' => time()
    ], JSON_PRETTY_PRINT));
}

function loadData() {
    global $dataFile;
    $raw = @file_get_contents($dataFile);
    if (!$raw) {
        return ['visitors' => [], 'lastUpdated' => time()];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : ['visitors' => [], 'lastUpdated' => time()];
}

function saveData($data) {
    global $dataFile;
    $data['lastUpdated'] = time();
    @file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}

// Built-in Intelligent AI Bot Responses
function getAIResponse($text) {
    $q = strtolower(trim($text));

    if (preg_match('/(\+?\d{10,12})/', $text, $matches)) {
        $phone = $matches[0];
        return "Thank you! I have saved your phone number {$phone}. Our senior developer Janoshan will call or WhatsApp you within 15 minutes! Would you like us to prepare a quote for a Business Website (₹7,999), E-Commerce Store (₹8,999+), or Android App (₹7,500)?";
    }

    if (strpos($q, '7999') !== false || strpos($q, 'web') !== false || strpos($q, 'website') !== false || strpos($q, 'package') !== false) {
        return "🚀 **Our Web Development Package is ₹7,999 (Special Offer!):**\n\n• **3 to 7 High-Converting Pages**\n• **1-Year Domain (.com/.in) & Web Hosting INCLUDED**\n• **Free SSL Security Certificate**\n• **WhatsApp Chat & Google Maps Integration**\n• **100% Mobile Responsive Design**\n• **Express 7-Day Guaranteed Delivery**\n\nWould you like to book this now or connect with our developer?";
    }

    if (strpos($q, 'ecommerce') !== false || strpos($q, 'e-commerce') !== false || strpos($q, 'shop') !== false || strpos($q, 'store') !== false || strpos($q, 'sell') !== false) {
        return "🛍️ **E-Commerce Store Package (₹8,999 - ₹14,999):**\n\n• Up to 10+ Initial Products\n• Secure Payment Gateway (Razorpay/UPI/Cards)\n• Shiprocket Automatic Shipping & Invoices\n• Customer Accounts, Wishlist & Coupons\n• Admin Dashboard to manage inventory\n\nReady to start selling online? Drop your WhatsApp number or click 'Connect Live Agent'!";
    }

    if (strpos($q, 'app') !== false || strpos($q, 'android') !== false || strpos($q, 'apk') !== false || strpos($q, '7500') !== false) {
        return "📱 **Mobile App Development (Flat ₹7,500):**\n\n• Native Android APK generated\n• Custom App Icon with your brand logo\n• In-App Refresh, Offline Internet Alerts & Loading Spinners\n• Payment Gateway Integration in App\n• Submission & Publishing to Google Play Store!\n\nWe convert your website or idea into a published mobile app in record time.";
    }

    if (strpos($q, 'delivery') !== false || strpos($q, 'days') !== false || strpos($q, 'time') !== false || strpos($q, 'fast') !== false) {
        return "⚡ **Express 7-Day Delivery Guarantee!**\n\nOnce we receive your requirements and logos, our team delivers your fully functioning website within **7 business days**. We also provide weekend support (Saturday & Sunday)!";
    }

    if (strpos($q, 'contact') !== false || strpos($q, 'phone') !== false || strpos($q, 'address') !== false || strpos($q, 'office') !== false) {
        return "📍 **Contact Web Freelancers:**\n\n• **WhatsApp / Phone:** +91 75300 18721\n• **Address:** 17/7 J G Nagar, 60 Feet Rd, Kumarnathapuram, Tiruppur, Tamil Nadu 641602\n• **Email:** support@webfreelancers.in\n\nYou can call us directly or chat right here!";
    }

    if (strpos($q, 'hi') !== false || strpos($q, 'hello') !== false || strpos($q, 'hey') !== false || strpos($q, 'vanakkam') !== false) {
        return "Hello! Welcome to Web Freelancers! How can I assist you with your website or app today? Feel free to ask about our **₹7,999 Web Package**, **E-Commerce Store**, **Android App**, or click **'Connect Live Agent'**!";
    }

    return "Got it! We can definitely build that for your business. To give you the exact quote and delivery plan:\n\n1. Share your **WhatsApp / Phone number** here, OR\n2. Click the **'Connect Live Agent'** button above to chat directly with Janoshan!";
}

// Read input payload
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$store = loadData();

switch ($action) {
    // 1. VISITOR: Register session
    case 'visitor_join':
        $vid = $input['visitorId'] ?? ('vis_' . substr(md5(uniqid()), 0, 5));
        if (!isset($store['visitors'][$vid])) {
            $store['visitors'][$vid] = [
                'id' => $vid,
                'name' => $input['name'] ?? ('Visitor #' . substr($vid, 4)),
                'phone' => $input['phone'] ?? '',
                'page' => $input['page'] ?? 'Home',
                'mode' => 'ai',
                'unread' => 0,
                'messages' => [],
                'lastActive' => time()
            ];
        } else {
            $store['visitors'][$vid]['lastActive'] = time();
            if (!empty($input['phone'])) {
                $store['visitors'][$vid]['phone'] = $input['phone'];
            }
        }
        saveData($store);
        echo json_encode(['status' => 'success', 'visitor' => $store['visitors'][$vid]]);
        break;

    // 2. VISITOR: Send Message
    case 'visitor_send':
        $vid = $input['visitorId'] ?? '';
        $text = trim($input['text'] ?? '');
        if (!$vid || !$text) {
            echo json_encode(['status' => 'error', 'message' => 'Missing visitorId or text']);
            exit;
        }

        if (!isset($store['visitors'][$vid])) {
            $store['visitors'][$vid] = [
                'id' => $vid,
                'name' => $input['name'] ?? ('Visitor #' . substr($vid, 4)),
                'phone' => '',
                'page' => $input['page'] ?? 'Home',
                'mode' => 'ai',
                'unread' => 0,
                'messages' => [],
                'lastActive' => time()
            ];
        }

        $visitor = &$store['visitors'][$vid];
        $visitor['lastActive'] = time();
        $visitor['unread']++;

        // Detect phone number
        if (preg_match('/(\+?\d{10,12})/', $text, $matches)) {
            $visitor['phone'] = $matches[0];
        }

        // Add user message
        $userMsg = [
            'id' => 'msg_' . time() . '_' . rand(100, 999),
            'sender' => 'user',
            'senderName' => $visitor['name'],
            'text' => $text,
            'time' => date('h:i A')
        ];
        $visitor['messages'][] = $userMsg;

        // If in AI mode and user didn't request human, generate instant AI reply
        $aiReplyMsg = null;
        $isHumanRequest = preg_match('/(human|agent|operator|call|janoshan)/i', $text);
        if ($isHumanRequest) {
            $visitor['mode'] = 'live';
            $aiReplyMsg = [
                'id' => 'msg_' . time() . '_' . rand(100, 999),
                'sender' => 'system',
                'senderName' => 'Live Support System',
                'text' => "🔔 **Connecting to Live Support Team...**\nJanoshan has been notified in the Operator Portal. You can continue typing below, or reach us directly at WhatsApp **+91 7530018721**!",
                'time' => date('h:i A')
            ];
            $visitor['messages'][] = $aiReplyMsg;
        } elseif ($visitor['mode'] === 'ai') {
            $replyText = getAIResponse($text);
            $aiReplyMsg = [
                'id' => 'msg_' . time() . '_' . rand(100, 999),
                'sender' => 'ai',
                'senderName' => 'Web Freelancers AI',
                'text' => $replyText,
                'time' => date('h:i A')
            ];
            $visitor['messages'][] = $aiReplyMsg;
        }

        saveData($store);
        echo json_encode([
            'status' => 'success',
            'userMsg' => $userMsg,
            'aiMsg' => $aiReplyMsg,
            'mode' => $visitor['mode']
        ]);
        break;

    // 3. VISITOR: Poll for new messages (e.g. from operator)
    case 'visitor_poll':
        $vid = $_GET['visitorId'] ?? $input['visitorId'] ?? '';
        if (!$vid || !isset($store['visitors'][$vid])) {
            echo json_encode(['status' => 'success', 'messages' => []]);
            exit;
        }
        $visitor = &$store['visitors'][$vid];
        $visitor['lastActive'] = time();
        saveData($store);
        echo json_encode([
            'status' => 'success',
            'messages' => $visitor['messages'],
            'mode' => $visitor['mode']
        ]);
        break;

    // 4. VISITOR: Request Live Human
    case 'visitor_request_live':
        $vid = $input['visitorId'] ?? '';
        if ($vid && isset($store['visitors'][$vid])) {
            $store['visitors'][$vid]['mode'] = 'live';
            $store['visitors'][$vid]['unread']++;
            $store['visitors'][$vid]['messages'][] = [
                'id' => 'msg_' . time() . '_' . rand(100, 999),
                'sender' => 'system',
                'senderName' => 'Live Support System',
                'text' => "🔔 **Connecting to Live Support Team...**\nJanoshan has been notified in the Operator Portal. Type your questions below!",
                'time' => date('h:i A')
            ];
            saveData($store);
        }
        echo json_encode(['status' => 'success', 'mode' => 'live']);
        break;

    // 5. OPERATOR: Get all visitors & active chats
    case 'operator_get_visitors':
        // Filter out very stale visitors (inactive for > 7 days)
        $cutoff = time() - (7 * 86400);
        $activeList = [];
        foreach ($store['visitors'] as $k => $v) {
            if (($v['lastActive'] ?? 0) >= $cutoff || !empty($v['messages'])) {
                $activeList[] = $v;
            }
        }
        // Sort: visitors with unread or live requests first, then by last active
        usort($activeList, function($a, $b) {
            if ($a['mode'] === 'live' && $b['mode'] !== 'live') return -1;
            if ($b['mode'] === 'live' && $a['mode'] !== 'live') return 1;
            return ($b['lastActive'] ?? 0) <=> ($a['lastActive'] ?? 0);
        });
        echo json_encode([
            'status' => 'success',
            'visitors' => $activeList,
            'serverTime' => time()
        ]);
        break;

    // 6. OPERATOR: Send Reply to a visitor
    case 'operator_send':
        $vid = $input['visitorId'] ?? '';
        $text = trim($input['text'] ?? '');
        $senderName = $input['senderName'] ?? 'Janoshan (Operator)';

        if (!$vid || !$text || !isset($store['visitors'][$vid])) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid visitor or empty text']);
            exit;
        }

        $visitor = &$store['visitors'][$vid];
        $visitor['mode'] = 'live'; // Operator has taken over
        $visitor['unread'] = 0; // Mark read by operator
        $visitor['lastActive'] = time();

        $opMsg = [
            'id' => 'msg_' . time() . '_' . rand(100, 999),
            'sender' => 'operator',
            'senderName' => $senderName,
            'text' => $text,
            'time' => date('h:i A')
        ];
        $visitor['messages'][] = $opMsg;

        saveData($store);
        echo json_encode(['status' => 'success', 'message' => $opMsg]);
        break;

    // 7. OPERATOR: Takeover / Return to AI
    case 'operator_set_mode':
        $vid = $input['visitorId'] ?? '';
        $mode = $input['mode'] ?? 'live'; // 'live' or 'ai'

        if ($vid && isset($store['visitors'][$vid])) {
            $store['visitors'][$vid]['mode'] = $mode;
            $noticeText = ($mode === 'live') 
                ? "👤 **Operator Janoshan has joined the chat!** You are now chatting live with a real human."
                : "🤖 **AI Assistant has resumed the chat.** Ask any questions 24/7!";

            $store['visitors'][$vid]['messages'][] = [
                'id' => 'msg_' . time() . '_' . rand(100, 999),
                'sender' => 'system',
                'senderName' => 'System',
                'text' => $noticeText,
                'time' => date('h:i A')
            ];
            saveData($store);
        }
        echo json_encode(['status' => 'success', 'mode' => $mode]);
        break;

    // 8. Health check
    case 'health':
    default:
        echo json_encode([
            'status' => 'online',
            'platform' => 'Hostinger Web Hosting (PHP)',
            'phpVersion' => PHP_VERSION,
            'visitorCount' => count($store['visitors']),
            'timestamp' => date('c')
        ]);
        break;
}
