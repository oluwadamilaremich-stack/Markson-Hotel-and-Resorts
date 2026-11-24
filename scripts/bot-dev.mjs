import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// ─── Paths ───────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, "..");
const envPath = path.join(FRONTEND_ROOT, ".env.local");

// ─── Load .env.local ─────────────────────────────────────────
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID || "0");
const ADMIN_USER_IDS = new Set(
  (process.env.TELEGRAM_ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN not found in .env.local");
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
// 1. JSON FILE STORE
// ═══════════════════════════════════════════════════════════════

const DATA_DIR = path.join(FRONTEND_ROOT, "data");
const ROOMS_FILE = path.join(DATA_DIR, "rooms.json");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const UPLOADS_DIR = path.join(FRONTEND_ROOT, "public", "images", "uploads");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Seed data
const SEED_ROOMS = [
  {
    slug: "coastal-garden-suite",
    name: "Coastal Garden Suite",
    tagline: "Reconnect with nature in this tranquil suite with a garden patio and soothing ocean sounds.",
    description: "A peaceful 480 sq. ft. retreat featuring a private garden patio, queen bed, indoor-outdoor shower, and a serene meditation corner.",
    sizeSqft: 480, beds: "1 Queen Bed", guestsLabel: "2 Guests", maxGuests: 2, pricePerNight: 450000,
    image: "/images/rooms/coastal-garden-suite.webp",
    heroImage: "/images/rooms/hero.webp",
    gallery: ["/images/rooms/detail-1.webp","/images/rooms/detail-2.webp","/images/rooms/detail-3.webp","/images/rooms/detail-4.webp","/images/rooms/detail-5.webp"],
    amenities: ["Garden Patio","Queen Bed","Rain Shower","Breakfast","Meditation Area","Smart TV","Yoga Mat","Tea Set"],
  },
  {
    slug: "ocean-view-king-suite",
    name: "Ocean View King Suite",
    tagline: "Relax in seaside luxury with a private balcony, rainfall shower, and dreamy king bed.",
    description: "A breezy 550 sq. ft. suite with floor-to-ceiling doors opening onto a private ocean-view balcony, a canopy king bed, and a spa-inspired rainfall shower.",
    sizeSqft: 550, beds: "1 King Bed", guestsLabel: "2 Guests", maxGuests: 2, pricePerNight: 570000,
    image: "/images/rooms/ocean-view-king-suite.webp",
    gallery: ["/images/rooms/ocean-view-king-suite.webp","/images/rooms/ocean-view-king-suite-2.webp","/images/rooms/detail-5.webp","/images/home/rooms-feature.webp"],
    amenities: ["Ocean View","King Bed","Private Balcony","Rain Shower","Breakfast","Smart TV","Mini Bar","Tea Set"],
  },
  {
    slug: "sunset-loft",
    name: "Sunset Loft",
    tagline: "A light-filled loft with a glass ceiling, a cozy reading nook, and golden-hour views.",
    description: "A 650 sq. ft. two-level loft under a sweeping glass roof, with a queen bed, a lofted reading nook, a writing desk, and front-row seats to every sunset.",
    sizeSqft: 650, beds: "1 Queen Bed", guestsLabel: "2 Guests", maxGuests: 2, pricePerNight: 645000,
    image: "/images/rooms/sunset-loft.webp",
    gallery: ["/images/rooms/sunset-loft.webp","/images/rooms/sunset-loft-2.webp","/images/gallery/8.webp"],
    amenities: ["Sunset View","Queen Bed","Reading Loft","Work Desk","Breakfast","Smart TV","Wi-Fi","Tea Set"],
  },
  {
    slug: "beachfront-family-suite",
    name: "Beachfront Family Suite",
    tagline: "Bring the whole family and enjoy beachfront comfort, space, and fun for all ages.",
    description: "A spacious 750 sq. ft. suite steps from the sand, with two king beds, a lounge area for the little ones, and a terrace looking straight out to the sea.",
    sizeSqft: 750, beds: "2 King Beds", guestsLabel: "4-5 Guests", maxGuests: 5, pricePerNight: 840000,
    image: "/images/rooms/beachfront-family-suite.webp",
    gallery: ["/images/rooms/beachfront-family-suite.webp","/images/services/beach-cabanas.webp","/images/gallery/1.webp"],
    amenities: ["Beach Access","2 King Beds","Lounge Area","Terrace","Breakfast","Smart TV","Kids' Amenities","Mini Bar"],
  },
  {
    slug: "penthouse-suite",
    name: "Penthouse Suite",
    tagline: "Our crown jewel: a sweeping terrace, a private plunge pool, and panoramic ocean views.",
    description: "A 1,200 sq. ft. top-floor residence with two king bedrooms, a wraparound terrace with a private plunge pool, and an open living and dining space made for hosting.",
    sizeSqft: 1200, beds: "2 King Beds", guestsLabel: "4-5 Guests", maxGuests: 5, pricePerNight: 1350000,
    image: "/images/rooms/penthouse-suite.webp",
    gallery: ["/images/rooms/penthouse-suite.webp","/images/services/lounge.webp","/images/gallery/7.webp"],
    amenities: ["Plunge Pool","2 King Beds","Wraparound Terrace","Butler Service","Breakfast","Smart TV","Mini Bar","Dining Area"],
  },
  {
    slug: "horizon-suite",
    name: "Horizon Suite",
    tagline: "Floor-to-ceiling windows frame endless ocean horizons in this serene, modern suite.",
    description: "A calm 900 sq. ft. corner suite wrapped in glass, with a king bed, a sunken lounge, and uninterrupted views of the horizon from morning to night.",
    sizeSqft: 900, beds: "1 King Bed", guestsLabel: "2-3 Guests", maxGuests: 3, pricePerNight: 975000,
    image: "/images/rooms/horizon-suite.webp",
    gallery: ["/images/rooms/horizon-suite.webp","/images/home/rooms-feature.webp","/images/about/banner.webp"],
    amenities: ["Panoramic View","King Bed","Sunken Lounge","Rain Shower","Breakfast","Smart TV","Mini Bar","Tea Set"],
  },
];

const SEED_POSTS = [
  { slug: "top-5-hidden-gems-near-markson", title: "Top 5 Hidden Gems Near Markson You'll Love", excerpt: "Skip the crowds and explore local favorites just minutes from your suite.", date: "2025-06-01", image: "/images/blog/hidden-gems.webp", heroImage: "/images/blog/hidden-gems-hero.webp", body: ["Markson isn't just a destination — it's your gateway..."] },
  { slug: "inside-our-garden-wellness-suite", title: "Relax, Restore, Repeat: Inside Our Garden Wellness Suite", excerpt: "Discover your new favorite retreat designed for calm, clarity, and coastal connection.", date: "2025-05-28", image: "/images/blog/wellness-suite.webp", body: ["Some rooms are made for sleeping..."] },
  { slug: "bonfire-nights-are-back", title: "Bonfire Nights Are Back at Markson", excerpt: "Unwind with music, stories, and s'mores under the stars.", date: "2025-05-24", image: "/images/blog/bonfire-nights.webp", body: ["When the sun dips below the horizon..."] },
  { slug: "introducing-our-coastal-brunch-menu", title: "Introducing Our New Coastal Brunch Menu", excerpt: "Fresh flavors, ocean views, and breezy bites.", date: "2025-05-20", image: "/images/blog/coastal-brunch.webp", body: ["Weekends at Shoreline Restaurant just got a little more delicious."] },
  { slug: "a-day-in-the-life-at-markson", title: "Behind the Scenes: A Day in the Life at Markson", excerpt: "From sunrise to starlight, here's how our team brings the magic.", date: "2025-05-16", image: "/images/blog/behind-the-scenes.webp", body: ["Before the first guest wakes..."] },
  { slug: "tips-for-your-first-stay", title: "5 Essential Tips for Your First Stay at Markson", excerpt: "Make the most of your first coastal stay with us.", date: "2025-05-12", image: "/images/blog/first-stay-tips.webp", body: ["Your first stay with us should feel easy..."] },
];

function getRooms() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(ROOMS_FILE)) {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(SEED_ROOMS, null, 2), "utf-8");
    return structuredClone(SEED_ROOMS);
  }
  try {
    return JSON.parse(fs.readFileSync(ROOMS_FILE, "utf-8"));
  } catch {
    return structuredClone(SEED_ROOMS);
  }
}

function saveRooms(rooms) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2), "utf-8");
}

function getPosts() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(SEED_POSTS, null, 2), "utf-8");
    return structuredClone(SEED_POSTS);
  }
  try {
    return JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
  } catch {
    return structuredClone(SEED_POSTS);
  }
}

function savePosts(posts) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), "utf-8");
}

function getBookings() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2), "utf-8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf-8");
}

function checkCollision(roomSlug, checkIn, checkOut) {
  const bookings = getBookings();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    if (b.roomSlug !== roomSlug) continue;
    // Hotel overlap: in1 < out2 && out1 > in2
    if (checkIn < (b.actualCheckOut || b.checkOut) && checkOut > b.checkIn) {
      return b;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// 2. TELEGRAM API HELPERS
// ═══════════════════════════════════════════════════════════════

function callTelegram(method, payload = {}) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    const req = https.request(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": Buffer.byteLength(postData),
        },
        family: 4,
        timeout: 30000,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({ ok: false });
          }
        });
      },
    );
    req.on("error", (err) => {
      console.error(`Telegram API error (${method}):`, err.message);
      resolve({ ok: false });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false });
    });
    req.write(postData);
    req.end();
  });
}

function sendMsg(chatId, text, replyMarkup) {
  const payload = { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return callTelegram("sendMessage", payload);
}

function escapeHtml(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatNaira(amount) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ═══════════════════════════════════════════════════════════════
// 3. MEDIA DOWNLOADER (Telegram → Cloudinary or Local)
// ═══════════════════════════════════════════════════════════════

function downloadTelegramFile(fileId) {
  return new Promise((resolve, reject) => {
    https
      .get(
        `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
        { family: 4 },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            try {
              const info = JSON.parse(data);
              if (!info.ok || !info.result?.file_path) return reject(new Error("Cannot get file info"));
              const filePath = info.result.file_path;
              const ext = path.extname(filePath) || ".jpg";
              https
                .get(
                  `https://api.telegram.org/file/bot${token}/${filePath}`,
                  { family: 4 },
                  (res2) => {
                    const chunks = [];
                    res2.on("data", (c) => chunks.push(Buffer.from(c)));
                    res2.on("end", () => resolve({ buffer: Buffer.concat(chunks), ext }));
                  },
                )
                .on("error", reject);
            } catch (e) {
              reject(e);
            }
          });
        },
      )
      .on("error", reject);
  });
}

function uploadToCloudinary(buffer, folder) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return Promise.resolve(null);

  const timestamp = Math.floor(Date.now() / 1000);
  const sigStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(sigStr).digest("hex");
  const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  const payload = JSON.stringify({ file: base64, api_key: apiKey, timestamp, signature, folder });

  return new Promise((resolve) => {
    const req = https.request(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }, family: 4, timeout: 30000 },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try { const d = JSON.parse(body); resolve(d.secure_url || null); } catch { resolve(null); }
        });
      },
    );
    req.on("error", () => resolve(null));
    req.write(payload);
    req.end();
  });
}

async function saveTelegramPhoto(fileId, prefix = "upload") {
  const { buffer, ext } = await downloadTelegramFile(fileId);
  const cloudUrl = await uploadToCloudinary(buffer, "markson_hotel");
  if (cloudUrl) {
    console.log("[Media] Uploaded to Cloudinary:", cloudUrl);
    return cloudUrl;
  }
  ensureDir(UPLOADS_DIR);
  const filename = `${prefix}-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  console.log("[Media] Saved locally:", filename);
  return `/images/uploads/${filename}`;
}

// ═══════════════════════════════════════════════════════════════
// 4. ADMIN CONVERSATIONAL STATE MACHINE
// ═══════════════════════════════════════════════════════════════

const adminState = { step: "idle", data: {} };

function isAdmin(chatId, userId, chatType) {
  return chatId === ADMIN_CHAT_ID &&
    (ADMIN_USER_IDS.has(String(userId)) ||
      (chatType === "private" && userId === ADMIN_CHAT_ID));
}

function recordEarlyCheckout(reference) {
  const bookings = getBookings();
  const booking = bookings.find((item) => item.reference === reference);
  if (!booking) return { ok: false, message: "Booking not found." };
  if (booking.status !== "confirmed") {
    return { ok: false, message: "Only confirmed bookings can be checked out." };
  }
  if (booking.actualCheckOut) {
    return { ok: false, message: `Early checkout was already recorded for ${booking.actualCheckOut}.` };
  }

  const actualCheckOut = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
  if (actualCheckOut < booking.checkIn || actualCheckOut >= booking.checkOut) {
    return {
      ok: false,
      message: "This booking is not eligible for early checkout today. Its scheduled checkout date already frees the room automatically.",
    };
  }

  booking.actualCheckOut = actualCheckOut;
  booking.checkedOutAt = new Date().toISOString();
  saveBookings(bookings);
  return { ok: true, booking };
}

function resetState() {
  adminState.step = "idle";
  adminState.data = {};
}

// ═══════════════════════════════════════════════════════════════
// 5. UPDATE HANDLER
// ═══════════════════════════════════════════════════════════════

async function handleUpdate(update) {
  // ─── Callback Queries (Buttons) ───
  if (update.callback_query) {
    const cq = update.callback_query;
    const data = cq.data || "";
    const chatId = cq.message?.chat?.id;
    const staffName = cq.from.username ? `@${cq.from.username}` : cq.from.first_name;

    if (data.startsWith("early_checkout:")) {
      if (!cq.message || !isAdmin(chatId, cq.from.id, cq.message.chat.type)) {
        await callTelegram("answerCallbackQuery", { callback_query_id: cq.id, text: "⛔ Admin only.", show_alert: true });
        return;
      }

      const reference = data.slice("early_checkout:".length);
      await callTelegram("answerCallbackQuery", {
        callback_query_id: cq.id,
        text: "Confirm the guest has checked out today.",
      });
      await sendMsg(chatId, `Confirm early checkout for booking <code>${escapeHtml(reference)}</code>? This records today's date in Lagos time and releases later dates.`, {
        inline_keyboard: [[
          { text: "✅ Confirm checkout today", callback_data: `early_checkout_confirm:${reference}` },
          { text: "Cancel", callback_data: "early_checkout_cancel" },
        ]],
      });
      return;
    }

    if (data.startsWith("early_checkout_confirm:")) {
      if (!cq.message || !isAdmin(chatId, cq.from.id, cq.message.chat.type)) {
        await callTelegram("answerCallbackQuery", { callback_query_id: cq.id, text: "⛔ Admin only.", show_alert: true });
        return;
      }

      const reference = data.slice("early_checkout_confirm:".length);
      const result = recordEarlyCheckout(reference);
      await callTelegram("answerCallbackQuery", {
        callback_query_id: cq.id,
        text: result.ok ? "Early checkout recorded." : result.message,
        show_alert: !result.ok,
      });
      if (result.ok) {
        await sendMsg(chatId, `✅ <b>Early checkout recorded</b>\n🏨 ${escapeHtml(result.booking.roomName)}\n📅 Room released from ${result.booking.actualCheckOut}.\n🔖 <code>${escapeHtml(reference)}</code>`);
      }
      return;
    }

    if (data === "early_checkout_cancel") {
      await callTelegram("answerCallbackQuery", { callback_query_id: cq.id, text: "Checkout cancelled." });
      return;
    }

    if (data.startsWith("ack_booking:")) {
      await callTelegram("answerCallbackQuery", { callback_query_id: cq.id, text: `Booking acknowledged by ${staffName}!` });
      if (cq.message) {
        const time = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" }).format(new Date());
        await callTelegram("editMessageText", {
          chat_id: chatId, message_id: cq.message.message_id,
          text: `${cq.message.text}\n\n✅ Acknowledged by ${staffName} at ${time}`,
        });
      }
      return;
    }

    if (data.startsWith("ack_contact:")) {
      await callTelegram("answerCallbackQuery", { callback_query_id: cq.id, text: `Inquiry handled by ${staffName}!` });
      if (cq.message) {
        const time = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" }).format(new Date());
        await callTelegram("editMessageText", {
          chat_id: chatId, message_id: cq.message.message_id,
          text: `${cq.message.text}\n\n✅ Handled by ${staffName} at ${time}`,
        });
      }
      return;
    }

    if (data === "cmd_rooms") {
      await callTelegram("answerCallbackQuery", { callback_query_id: cq.id });
      await sendRoomList(chatId);
      return;
    }

    if (data === "cmd_status") {
      await callTelegram("answerCallbackQuery", { callback_query_id: cq.id });
      await sendStatusInfo(chatId);
      return;
    }

    if (!isAdmin(chatId, cq.from.id, cq.message?.chat?.type)) {
      await callTelegram("answerCallbackQuery", { callback_query_id: cq.id, text: "⛔ Admin only.", show_alert: true });
      return;
    }

    await callTelegram("answerCallbackQuery", { callback_query_id: cq.id });

    // ─── Admin Navigation ───
    if (data === "admin_main") {
      resetState();
      await sendAdminMenu(chatId);
      return;
    }

    if (data === "admin_rooms") {
      await sendMsg(chatId, `🏨 <b>Room Manager</b>\n\nChoose an action:`, {
        inline_keyboard: [
          [{ text: "✏️ Edit Room Price", callback_data: "admin_edit_price" }],
          [{ text: "🖼️ Change Room Photo", callback_data: "admin_edit_photo" }],
          [{ text: "➕ Add New Room", callback_data: "admin_add_room" }],
          [{ text: "🗑️ Delete Room", callback_data: "admin_delete_room" }],
          [{ text: "◀️ Back to Admin", callback_data: "admin_main" }],
        ],
      });
      return;
    }

    if (data === "admin_blog") {
      await sendMsg(chatId, `✍️ <b>Blog Manager</b>\n\nChoose an action:`, {
        inline_keyboard: [
          [{ text: "➕ Post New Blog", callback_data: "admin_new_post" }],
          [{ text: "📋 List All Posts", callback_data: "admin_list_posts" }],
          [{ text: "🗑️ Delete Post", callback_data: "admin_delete_post" }],
          [{ text: "◀️ Back to Admin", callback_data: "admin_main" }],
        ],
      });
      return;
    }

    // ─── Admin Bookings & Calendar Collision ───
    if (data === "admin_bookings") {
      const bookings = getBookings().filter((b) => b.status !== "cancelled");
      await sendMsg(chatId, `📅 <b>Bookings &amp; Calendar Availability</b>\n\nActive Reservations: <b>${bookings.length}</b>\n\nChoose an action:`, {
        inline_keyboard: [
          [{ text: "📋 View Active Bookings", callback_data: "admin_view_bookings" }],
          [{ text: "🔒 Manually Block Dates", callback_data: "admin_block_dates" }],
          [{ text: "🔓 Cancel / Free Up Booking", callback_data: "admin_cancel_booking" }],
          [{ text: "◀️ Back to Admin", callback_data: "admin_main" }],
        ],
      });
      return;
    }

    if (data === "admin_view_bookings") {
      const bookings = getBookings().filter((b) => b.status !== "cancelled");
      if (bookings.length === 0) {
        await sendMsg(chatId, "📭 No active room reservations or blocked dates at the moment.");
        return;
      }
      const lines = bookings.map((b, i) => {
        const typeLabel = b.status === "blocked" ? "🔒 BLOCKED" : "✅ CONFIRMED";
        const effectiveCheckOut = b.actualCheckOut || b.checkOut;
        const staySummary = b.actualCheckOut
          ? `${b.nights} booked night${b.nights > 1 ? "s" : ""}; early checkout`
          : `${b.nights} night${b.nights > 1 ? "s" : ""}`;
        return `${i + 1}. <b>${escapeHtml(b.roomName)}</b> (${typeLabel})\n   📅 ${b.checkIn} → ${effectiveCheckOut} (${staySummary})\n   👤 ${escapeHtml(b.guestName)} · 📞 ${escapeHtml(b.guestPhone || "N/A")}\n   🔖 Ref: <code>${b.reference}</code>`;
      });
      await sendMsg(chatId, `📋 <b>Active Room Reservations &amp; Blocks</b>\n━━━━━━━━━━━━━━━━━━━━━━\n${lines.join("\n\n")}\n━━━━━━━━━━━━━━━━━━━━━━`);
      return;
    }

    if (data === "admin_cancel_booking") {
      const bookings = getBookings().filter((b) => b.status !== "cancelled");
      if (bookings.length === 0) {
        await sendMsg(chatId, "📭 No active bookings to cancel.");
        return;
      }
      const buttons = bookings.map((b) => [
        { text: `${b.roomName.slice(0, 18)}: ${b.checkIn} (${b.status})`, callback_data: `cbr_${b.reference}` },
      ]);
      buttons.push([{ text: "❌ Cancel", callback_data: "admin_bookings" }]);
      await sendMsg(chatId, `🔓 <b>Release / Cancel Booking</b>\n\nSelect the reservation to cancel and free up its calendar dates:`, { inline_keyboard: buttons });
      return;
    }

    if (data.startsWith("cbr_")) {
      const ref = data.slice(4);
      const bookings = getBookings();
      const booking = bookings.find((b) => b.reference === ref);
      if (!booking) { await sendMsg(chatId, "❌ Reservation not found."); return; }
      booking.status = "cancelled";
      saveBookings(bookings);
      await sendMsg(chatId, `✅ <b>Reservation Cancelled!</b>\n\n🏨 Room: <b>${escapeHtml(booking.roomName)}</b>\n📅 Dates freed: <b>${booking.checkIn} → ${booking.checkOut}</b>\n\n<i>These dates are now immediately open for new guests on the website.</i>`);
      await sendAdminMenu(chatId);
      return;
    }

    // Manually block dates flow
    if (data === "admin_block_dates") {
      const rooms = getRooms();
      const buttons = rooms.map((r) => [{ text: `🔒 ${r.name}`, callback_data: `blk_${r.slug}` }]);
      buttons.push([{ text: "❌ Cancel", callback_data: "admin_bookings" }]);
      await sendMsg(chatId, `🔒 <b>Block Room Dates</b>\n\nSelect which room to block off:`, { inline_keyboard: buttons });
      return;
    }

    if (data.startsWith("blk_")) {
      const slug = data.slice(4);
      const rooms = getRooms();
      const room = rooms.find((r) => r.slug === slug);
      if (!room) { await sendMsg(chatId, "❌ Room not found."); return; }
      adminState.step = "blocking_check_in";
      adminState.data = { roomSlug: slug, roomName: room.name };
      const today = new Date().toISOString().slice(0, 10);
      await sendMsg(chatId, `🔒 Blocking dates for <b>${escapeHtml(room.name)}</b>.\n\n<b>Step 1/3:</b> Type the <b>Check-in Date</b> in <code>YYYY-MM-DD</code> format (e.g. <code>${today}</code>):\n\nOr type /cancel to abort.`);
      return;
    }

    // ─── Edit Price ───
    if (data === "admin_edit_price") {
      const rooms = getRooms();
      const buttons = rooms.map((r) => [{ text: `${r.name} — ${formatNaira(r.pricePerNight)}`, callback_data: `ep_${r.slug}` }]);
      buttons.push([{ text: "❌ Cancel", callback_data: "admin_main" }]);
      await sendMsg(chatId, `✏️ <b>Edit Room Price</b>\n\nSelect the room to update:`, { inline_keyboard: buttons });
      return;
    }

    if (data.startsWith("ep_")) {
      const slug = data.slice(3);
      const rooms = getRooms();
      const room = rooms.find((r) => r.slug === slug);
      if (!room) { await sendMsg(chatId, "❌ Room not found."); return; }
      adminState.step = "awaiting_new_price";
      adminState.data = { slug, roomName: room.name, oldPrice: room.pricePerNight };
      await sendMsg(chatId, `💰 Current price for <b>${escapeHtml(room.name)}</b> is <b>${formatNaira(room.pricePerNight)}</b>/night.\n\nType the <b>new price in Naira</b> (e.g. <code>500000</code>):\n\nOr type /cancel to abort.`);
      return;
    }

    // ─── Edit Photo ───
    if (data === "admin_edit_photo") {
      const rooms = getRooms();
      const buttons = rooms.map((r) => [{ text: `🖼️ ${r.name}`, callback_data: `ephoto_${r.slug}` }]);
      buttons.push([{ text: "❌ Cancel", callback_data: "admin_main" }]);
      await sendMsg(chatId, `🖼️ <b>Change Room Photo</b>\n\nSelect the room:`, { inline_keyboard: buttons });
      return;
    }

    if (data.startsWith("ephoto_")) {
      const slug = data.slice(7);
      const rooms = getRooms();
      const room = rooms.find((r) => r.slug === slug);
      if (!room) { await sendMsg(chatId, "❌ Room not found."); return; }
      adminState.step = "awaiting_room_photo";
      adminState.data = { slug, roomName: room.name };
      await sendMsg(chatId, `📸 Send a <b>new photo</b> for <b>${escapeHtml(room.name)}</b>.\n\nJust snap or forward an image here.\n\nOr type /cancel to abort.`);
      return;
    }

    // ─── Add Room ───
    if (data === "admin_add_room") {
      adminState.step = "adding_room_name";
      adminState.data = {};
      await sendMsg(chatId, `➕ <b>Add New Room</b>\n\n<b>Step 1/7:</b> Type the <b>room name</b>:\n\nOr type /cancel to abort.`);
      return;
    }

    // ─── Delete Room ───
    if (data === "admin_delete_room") {
      const rooms = getRooms();
      const buttons = rooms.map((r) => [{ text: `🗑️ ${r.name}`, callback_data: `delroom_${r.slug}` }]);
      buttons.push([{ text: "❌ Cancel", callback_data: "admin_main" }]);
      await sendMsg(chatId, `🗑️ <b>Delete Room</b>\n\nSelect the room to delete:`, { inline_keyboard: buttons });
      return;
    }

    if (data.startsWith("delroom_")) {
      const slug = data.slice(8);
      const rooms = getRooms();
      const room = rooms.find((r) => r.slug === slug);
      if (!room) { await sendMsg(chatId, "❌ Room not found."); return; }
      await sendMsg(chatId, `⚠️ Are you sure you want to delete <b>${escapeHtml(room.name)}</b>?\n\nThis will remove it from the website immediately.`, {
        inline_keyboard: [
          [{ text: "✅ Yes, Delete", callback_data: `confirmdelroom_${slug}` }, { text: "❌ No, Cancel", callback_data: "admin_rooms" }],
        ],
      });
      return;
    }

    if (data.startsWith("confirmdelroom_")) {
      const slug = data.slice(15);
      const rooms = getRooms();
      const updated = rooms.filter((r) => r.slug !== slug);
      saveRooms(updated);
      await sendMsg(chatId, `✅ Room deleted successfully!\n\n<i>The website will reflect this immediately.</i>`);
      await sendAdminMenu(chatId);
      return;
    }

    // ─── Blog Manager ───
    if (data === "admin_new_post") {
      adminState.step = "blog_title";
      adminState.data = {};
      await sendMsg(chatId, `✍️ <b>Post New Blog</b>\n\n<b>Step 1/4:</b> Type the <b>blog title</b>:\n\nOr type /cancel to abort.`);
      return;
    }

    if (data === "admin_list_posts") {
      const posts = getPosts();
      if (posts.length === 0) { await sendMsg(chatId, "📭 No blog posts yet."); return; }
      const lines = posts.map((p, i) => `${i + 1}. <b>${escapeHtml(p.title)}</b>\n   📅 ${p.date} · <code>${p.slug}</code>`);
      await sendMsg(chatId, `📋 <b>All Blog Posts (${posts.length})</b>\n━━━━━━━━━━━━━━━━━━━━━━\n${lines.join("\n\n")}\n━━━━━━━━━━━━━━━━━━━━━━`);
      return;
    }

    if (data === "admin_delete_post") {
      const posts = getPosts();
      if (posts.length === 0) { await sendMsg(chatId, "📭 No blog posts to delete."); return; }
      const buttons = posts.map((p) => [{ text: `🗑️ ${p.title.slice(0, 40)}`, callback_data: `dp_${p.slug}` }]);
      buttons.push([{ text: "❌ Cancel", callback_data: "admin_main" }]);
      await sendMsg(chatId, `🗑️ <b>Delete Blog Post</b>\n\nSelect the post to delete:`, { inline_keyboard: buttons });
      return;
    }

    if (data.startsWith("dp_")) {
      const slug = data.slice(3);
      const posts = getPosts();
      const post = posts.find((p) => p.slug === slug);
      if (!post) { await sendMsg(chatId, "❌ Post not found."); return; }
      await sendMsg(chatId, `⚠️ Delete <b>${escapeHtml(post.title)}</b>?`, {
        inline_keyboard: [
          [{ text: "✅ Yes, Delete", callback_data: `confirmdp_${slug}` }, { text: "❌ No, Cancel", callback_data: "admin_blog" }],
        ],
      });
      return;
    }

    if (data.startsWith("confirmdp_")) {
      const slug = data.slice(10);
      const posts = getPosts();
      const updated = posts.filter((p) => p.slug !== slug);
      savePosts(updated);
      await sendMsg(chatId, `✅ Blog post deleted successfully!`);
      await sendAdminMenu(chatId);
      return;
    }

    await callTelegram("answerCallbackQuery", { callback_query_id: cq.id, text: "Received." });
    return;
  }

  // ─── Photos ───
  if (update.message?.photo && isAdmin(update.message.chat.id, update.message.from?.id, update.message.chat.type)) {
    const chatId = update.message.chat.id;
    const photos = update.message.photo;
    const bestPhoto = photos[photos.length - 1];
    const fileId = bestPhoto.file_id;

    if (adminState.step === "awaiting_room_photo") {
      const { slug, roomName } = adminState.data;
      await sendMsg(chatId, `⏳ Downloading photo for <b>${escapeHtml(roomName)}</b>...`);
      try {
        const imageUrl = await saveTelegramPhoto(fileId, `room-${slug}`);
        const rooms = getRooms();
        const idx = rooms.findIndex((r) => r.slug === slug);
        if (idx >= 0) {
          rooms[idx].image = imageUrl;
          if (rooms[idx].heroImage) rooms[idx].heroImage = imageUrl;
          rooms[idx].gallery = [imageUrl, ...(rooms[idx].gallery || [])];
          saveRooms(rooms);
          resetState();
          await sendMsg(chatId, `✅ <b>Photo updated!</b>\n\n🏨 <b>${escapeHtml(roomName)}</b>\n🖼️ <code>${escapeHtml(imageUrl)}</code>\n\n<i>Live on website!</i>`);
          await sendAdminMenu(chatId);
        } else {
          resetState();
          await sendMsg(chatId, "❌ Room not found.");
        }
      } catch (err) {
        resetState();
        await sendMsg(chatId, `❌ Error saving photo: ${escapeHtml(err.message)}`);
      }
      return;
    }

    if (adminState.step === "adding_room_photo") {
      const draft = adminState.data;
      await sendMsg(chatId, `⏳ Saving room photo...`);
      try {
        const imageUrl = await saveTelegramPhoto(fileId, `room-${draft.slug}`);
        draft.image = imageUrl;
        draft.heroImage = imageUrl;
        draft.gallery = [imageUrl];
        const rooms = getRooms();
        rooms.push(draft);
        saveRooms(rooms);
        resetState();
        await sendMsg(chatId, `✅ <b>New Room Created!</b>\n\n🏨 <b>${escapeHtml(draft.name)}</b>\n💰 ${formatNaira(draft.pricePerNight)}/night\n\n<i>Live on website!</i>`);
        await sendAdminMenu(chatId);
      } catch (err) {
        resetState();
        await sendMsg(chatId, `❌ Error: ${escapeHtml(err.message)}`);
      }
      return;
    }

    if (adminState.step === "blog_photo") {
      const draft = adminState.data;
      await sendMsg(chatId, `⏳ Saving blog cover...`);
      try {
        const imageUrl = await saveTelegramPhoto(fileId, `blog-${draft.slug}`);
        draft.image = imageUrl;
        draft.heroImage = imageUrl;
        const posts = getPosts();
        posts.unshift(draft);
        savePosts(posts);
        resetState();
        await sendMsg(chatId, `✅ <b>Blog Post Published!</b>\n\n📝 <b>${escapeHtml(draft.title)}</b>\n\n<i>Live on website!</i>`);
        await sendAdminMenu(chatId);
      } catch (err) {
        resetState();
        await sendMsg(chatId, `❌ Error: ${escapeHtml(err.message)}`);
      }
      return;
    }

    return;
  }

  // ─── Text Messages ───
  if (update.message && typeof update.message.text === "string") {
    const text = update.message.text.trim();
    const chatId = update.message.chat.id;
    const command = text.split(" ")[0].toLowerCase().split("@")[0];

    console.log(`[Bot] ${command || text.slice(0, 30)} from ${chatId} | state: ${adminState.step}`);

    if (command === "/cancel") {
      if (adminState.step !== "idle") {
        resetState();
        await sendMsg(chatId, "❌ Operation cancelled.");
        await sendAdminMenu(chatId);
      } else {
        await sendMsg(chatId, "Nothing to cancel.");
      }
      return;
    }

    // ─── Admin Conversational Flows ───
    if (isAdmin(chatId, update.message.from?.id, update.message.chat.type) && adminState.step !== "idle") {
      // Blocking Dates: Step 1 Check-in
      if (adminState.step === "blocking_check_in") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
          await sendMsg(chatId, "❌ Invalid date format. Please use <code>YYYY-MM-DD</code> (e.g. 2026-11-20):");
          return;
        }
        adminState.data.checkIn = text;
        adminState.step = "blocking_check_out";
        await sendMsg(chatId, `📅 Check-in: <b>${text}</b>\n\n<b>Step 2/3:</b> Type the <b>Check-out Date</b> in <code>YYYY-MM-DD</code> format:`);
        return;
      }

      // Blocking Dates: Step 2 Check-out
      if (adminState.step === "blocking_check_out") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || text <= adminState.data.checkIn) {
          await sendMsg(chatId, `❌ Check-out date must be after ${adminState.data.checkIn}. Use <code>YYYY-MM-DD</code>:`);
          return;
        }

        // Collision Check!
        const conflict = checkCollision(adminState.data.roomSlug, adminState.data.checkIn, text);
        if (conflict) {
          resetState();
          await sendMsg(chatId, `⚠️ <b>Cannot Block: Date Collision!</b>\n\nThis room is already reserved from <b>${conflict.checkIn}</b> to <b>${conflict.actualCheckOut || conflict.checkOut}</b> by <b>${escapeHtml(conflict.guestName)}</b> (Ref: <code>${conflict.reference}</code>).\n\nPlease choose non-colliding dates.`);
          await sendAdminMenu(chatId);
          return;
        }

        adminState.data.checkOut = text;
        adminState.step = "blocking_reason";
        await sendMsg(chatId, `📅 Dates: <b>${adminState.data.checkIn} → ${text}</b>\n\n<b>Step 3/3:</b> Type a brief <b>reason</b> (e.g. "Walk-in VIP Guest" or "Maintenance"):`);
        return;
      }

      // Blocking Dates: Step 3 Reason & Save
      if (adminState.step === "blocking_reason") {
        const { roomSlug, roomName, checkIn, checkOut } = adminState.data;
        const nights = Math.max(1, Math.round((Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`)) / 86400000));
        const newBlock = {
          reference: `block_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          roomSlug,
          roomName,
          checkIn,
          checkOut,
          nights,
          guests: 1,
          amountKobo: 0,
          guestName: `[Blocked] ${text}`,
          guestEmail: "hotel@marksonhotel.com",
          guestPhone: "",
          createdAt: new Date().toISOString(),
          status: "blocked",
        };

        const bookings = getBookings();
        bookings.push(newBlock);
        saveBookings(bookings);
        resetState();

        await sendMsg(chatId, [
          `🔒 <b>Room Dates Blocked!</b>`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `🏨 <b>Room:</b> ${escapeHtml(roomName)}`,
          `📅 <b>Dates:</b> ${checkIn} → ${checkOut} (${nights} nights)`,
          `🏷️ <b>Reason:</b> ${escapeHtml(text)}`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `<i>These dates are now locked and cannot be double-booked on the website.</i>`,
        ].join("\n"));
        await sendAdminMenu(chatId);
        return;
      }

      // Edit Price Flow
      if (adminState.step === "awaiting_new_price") {
        const num = parseInt(text.replace(/[₦,\s]/g, ""), 10);
        if (isNaN(num) || num <= 0) {
          await sendMsg(chatId, "❌ Please enter a valid number (e.g. <code>500000</code>). Try again or /cancel.");
          return;
        }
        const { slug, roomName, oldPrice } = adminState.data;
        const rooms = getRooms();
        const idx = rooms.findIndex((r) => r.slug === slug);
        if (idx < 0) { resetState(); await sendMsg(chatId, "❌ Room not found."); return; }
        rooms[idx].pricePerNight = num;
        saveRooms(rooms);
        resetState();
        await sendMsg(chatId, [
          `✅ <b>Price Updated!</b>`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `🏨 <b>Room:</b> ${escapeHtml(roomName)}`,
          `💰 <b>Old Price:</b> ${formatNaira(oldPrice)}/night`,
          `💰 <b>New Price:</b> ${formatNaira(num)}/night`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `<i>Synchronized with website immediately!</i>`,
        ].join("\n"));
        await sendAdminMenu(chatId);
        return;
      }

      // Add Room Steps
      if (adminState.step === "adding_room_name") {
        adminState.data.name = text;
        adminState.data.slug = slugify(text);
        adminState.step = "adding_room_price";
        await sendMsg(chatId, `👍 Room: <b>${escapeHtml(text)}</b>\n\n<b>Step 2/7:</b> Type the <b>nightly price in Naira</b> (e.g. <code>500000</code>):`);
        return;
      }

      if (adminState.step === "adding_room_price") {
        const num = parseInt(text.replace(/[₦,\s]/g, ""), 10);
        if (isNaN(num) || num <= 0) { await sendMsg(chatId, "❌ Invalid price. Enter numbers only (e.g. <code>500000</code>)."); return; }
        adminState.data.pricePerNight = num;
        adminState.step = "adding_room_beds";
        await sendMsg(chatId, `💰 Price: <b>${formatNaira(num)}</b>/night\n\n<b>Step 3/7:</b> Type bed config (e.g. "1 King Bed"):`);
        return;
      }

      if (adminState.step === "adding_room_beds") {
        adminState.data.beds = text;
        adminState.step = "adding_room_guests";
        await sendMsg(chatId, `🛏️ Beds: <b>${escapeHtml(text)}</b>\n\n<b>Step 4/7:</b> Type max guests (e.g. <code>2</code>):`);
        return;
      }

      if (adminState.step === "adding_room_guests") {
        const num = parseInt(text, 10);
        if (isNaN(num) || num <= 0 || num > 20) { await sendMsg(chatId, "❌ Enter a valid number (1-20)."); return; }
        adminState.data.maxGuests = num;
        adminState.data.guestsLabel = num <= 2 ? `${num} Guests` : `${num - 1}-${num} Guests`;
        adminState.step = "adding_room_size";
        await sendMsg(chatId, `👥 Max guests: <b>${num}</b>\n\n<b>Step 5/7:</b> Type size in sq. ft. (e.g. <code>550</code>):`);
        return;
      }

      if (adminState.step === "adding_room_size") {
        const num = parseInt(text.replace(/[,\s]/g, ""), 10);
        if (isNaN(num) || num <= 0) { await sendMsg(chatId, "❌ Enter a valid number."); return; }
        adminState.data.sizeSqft = num;
        adminState.step = "adding_room_description";
        await sendMsg(chatId, `📐 Size: <b>${num} sq. ft.</b>\n\n<b>Step 6/7:</b> Type a short description / tagline:`);
        return;
      }

      if (adminState.step === "adding_room_description") {
        adminState.data.tagline = text;
        adminState.data.description = text;
        adminState.data.amenities = ["Breakfast", "Smart TV", "Wi-Fi", "Mini Bar"];
        adminState.step = "adding_room_photo";
        await sendMsg(chatId, `📝 Description saved!\n\n<b>Step 7/7:</b> 📸 Send a photo for this room:`);
        return;
      }

      // Blog Post Steps
      if (adminState.step === "blog_title") {
        adminState.data.title = text;
        adminState.data.slug = slugify(text);
        adminState.data.date = new Date().toISOString().slice(0, 10);
        adminState.step = "blog_excerpt";
        await sendMsg(chatId, `📝 Title: <b>${escapeHtml(text)}</b>\n\n<b>Step 2/4:</b> Type an excerpt (1-2 sentences):`);
        return;
      }

      if (adminState.step === "blog_excerpt") {
        adminState.data.excerpt = text;
        adminState.data.body = [];
        adminState.step = "blog_body";
        await sendMsg(chatId, `✅ Excerpt saved!\n\n<b>Step 3/4:</b> Type body paragraphs (send each paragraph as a message). Type <b>/done</b> when finished.`);
        return;
      }

      if (adminState.step === "blog_body") {
        if (command === "/done") {
          if (adminState.data.body.length === 0) {
            await sendMsg(chatId, "❌ Please type at least one paragraph before /done.");
            return;
          }
          adminState.step = "blog_photo";
          await sendMsg(chatId, `📝 ${adminState.data.body.length} paragraphs saved.\n\n<b>Step 4/4:</b> 📸 Send a cover photo, or type /skip.`);
          return;
        }
        adminState.data.body.push(text);
        await sendMsg(chatId, `✅ Paragraph ${adminState.data.body.length} saved. Send next or /done.`);
        return;
      }

      if (adminState.step === "blog_photo") {
        if (command === "/skip") {
          const draft = adminState.data;
          draft.image = "/images/blog/bonfire-nights.webp";
          const posts = getPosts();
          posts.unshift(draft);
          savePosts(posts);
          resetState();
          await sendMsg(chatId, `✅ <b>Blog Post Published!</b>\n\n📝 <b>${escapeHtml(draft.title)}</b>\n\n<i>Live on website!</i>`);
          await sendAdminMenu(chatId);
          return;
        }
        await sendMsg(chatId, "📸 Please send a photo image. Or type /skip.");
        return;
      }

      resetState();
    }

    // ─── Regular Commands ───
    if (command === "/start" || command === "/help" || command === "/menu") {
      const welcome = [
        `🌊 <b>Markson Hotels &amp; Resorts Bot</b>`,
        `Welcome to your hotel operations concierge.`,
        ``,
        `<b>Commands:</b>`,
        `• /rooms — View all suites &amp; rates`,
        `• /status — System &amp; payment status`,
        `• /contact — Hotel contact info`,
        isAdmin(chatId, update.message.from?.id, update.message.chat.type) ? `• /admin — 🔐 Admin CMS &amp; Calendar` : ``,
        `• /help — Show this menu`,
      ].filter(Boolean).join("\n");

      const keyboard = [
        [{ text: "🏨 View Rooms", callback_data: "cmd_rooms" }, { text: "⚡ Status", callback_data: "cmd_status" }],
        [{ text: "🌐 Open Website", url: process.env.APP_URL || "http://localhost:3000" }],
      ];
      if (isAdmin(chatId, update.message.from?.id, update.message.chat.type)) {
        keyboard.splice(1, 0, [{ text: "🔐 Admin CMS & Calendar", callback_data: "admin_main" }]);
      }

      await sendMsg(chatId, welcome, { inline_keyboard: keyboard });
      return;
    }

    if (command === "/rooms") {
      await sendRoomList(chatId);
      return;
    }

    if (command === "/status") {
      await sendStatusInfo(chatId);
      return;
    }

    if (command === "/contact") {
      const reply = [
        `📍 <b>Markson Hotels &amp; Resorts</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `🏢 <b>Location:</b> Lagos, Nigeria`,
        `📞 <b>Reservations:</b> (234) 812-114-1582`,
        `✉️ <b>Email:</b> oluwadamilaremich@gmail.com`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
      ].join("\n");
      await sendMsg(chatId, reply);
      return;
    }

    if (command === "/admin") {
      if (!isAdmin(chatId, update.message.from?.id, update.message.chat.type)) {
        await sendMsg(chatId, "⛔ <b>Access Denied</b>\n\nThis command is restricted to hotel administrators.");
        return;
      }
      resetState();
      await sendAdminMenu(chatId);
      return;
    }

    await sendMsg(chatId, "I can help with hotel operations, but I don't understand free-form prompts. Try /start, /rooms, /status, /contact, or /admin.");
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. REUSABLE MESSAGE BUILDERS
// ═══════════════════════════════════════════════════════════════

async function sendAdminMenu(chatId) {
  const rooms = getRooms();
  const posts = getPosts();
  const activeBookings = getBookings().filter((b) => b.status !== "cancelled");

  await sendMsg(chatId, [
    `🔐 <b>Admin Operations &amp; CMS</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🏨 Rooms: <b>${rooms.length}</b> listed`,
    `✍️ Blog Posts: <b>${posts.length}</b> published`,
    `📅 Active Bookings: <b>${activeBookings.length}</b> reserved`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `Choose a module to manage:`,
  ].join("\n"), {
    inline_keyboard: [
      [{ text: "🏨 Manage Rooms & Prices", callback_data: "admin_rooms" }],
      [{ text: "📅 Bookings & Calendar Collision", callback_data: "admin_bookings" }],
      [{ text: "✍️ Blog Stories Manager", callback_data: "admin_blog" }],
    ],
  });
}

async function sendRoomList(chatId) {
  const rooms = getRooms();
  const roomLines = rooms.map((r, i) =>
    `${i + 1}. <b>${escapeHtml(r.name)}</b>\n   • Rate: <b>${formatNaira(r.pricePerNight)}</b> / night\n   • Bed: ${escapeHtml(r.beds)} (${r.maxGuests} max guests)\n   • Size: ${r.sizeSqft} sq. ft.`
  );
  const reply = [
    `🏨 <b>Markson Room &amp; Suite Catalog</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ...roomLines,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `<i>Rates are synchronized with the online booking system.</i>`,
  ].join("\n");
  await sendMsg(chatId, reply);
}

async function sendStatusInfo(chatId) {
  const now = new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date());

  const activeBookings = getBookings().filter((b) => b.status !== "cancelled");

  const reply = [
    `⚡ <b>Markson HR System Status</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🕒 <b>Lagos Time:</b> ${now}`,
    `💳 <b>Paystack:</b> 🟡 TEST MODE`,
    `🌐 <b>App URL:</b> <code>${process.env.APP_URL || "http://localhost:3000"}</code>`,
    `🤖 <b>Telegram Polling:</b> 🟢 Active`,
    `🛡️ <b>Calendar Collision Prevention:</b> 🟢 Active (${activeBookings.length} bookings)`,
    `📦 <b>Data Store:</b> JSON-backed persistent store`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");
  await sendMsg(chatId, reply);
}

// ═══════════════════════════════════════════════════════════════
// 7. REGISTER COMMANDS & LONG-POLLING
// ═══════════════════════════════════════════════════════════════

async function registerCommands() {
  const result = await callTelegram("setMyCommands", {
    commands: [
      { command: "start", description: "Main menu & quick actions" },
      { command: "admin", description: "🔐 Admin CMS & calendar control" },
      { command: "rooms", description: "View all suites & rates" },
      { command: "status", description: "System & collision status" },
      { command: "contact", description: "Hotel contact details" },
      { command: "cancel", description: "Cancel current operation" },
      { command: "help", description: "Help overview" },
    ],
  });
  if (!result.ok) throw new Error(result.description || "Could not register Telegram commands.");
  console.log("✅ Bot commands registered with Telegram.");
}

let offset = 0;

async function poll() {
  const webhook = await callTelegram("deleteWebhook", { drop_pending_updates: false });
  if (!webhook.ok) throw new Error(webhook.description || "Could not disable the Telegram webhook for local polling.");
  await registerCommands();
  console.log("⚡ Markson Bot CMS & Collision polling service active...");
  console.log(`   Admin Chat ID: ${ADMIN_CHAT_ID}`);

  while (true) {
    try {
      const res = await callTelegram("getUpdates", { offset, timeout: 20, allowed_updates: ["message", "callback_query"] });
      if (!res.ok) throw new Error(res.description || "Telegram getUpdates failed.");
      if (Array.isArray(res.result)) {
        for (const update of res.result) {
          offset = update.update_id + 1;
          try {
            await handleUpdate(update);
          } catch (err) {
            console.error("[Handler Error]", err);
          }
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

poll();
