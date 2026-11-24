import { isDateOnly } from "@/lib/booking-rules";
import { formatNaira } from "@/lib/format";
import type { Post } from "@/content/posts";
import type { Room } from "@/content/rooms";
import { saveTelegramPhotoToCloudinary } from "./media";
import { dispatchBookingNotifications } from "./booking-notifications";
import {
  addStoredPost,
  addStoredRoom,
  blockRoomDates,
  cancelStoredBooking,
  clearTelegramAdminState,
  deleteStoredPost,
  deleteStoredRoom,
  getStoredBookings,
  getStoredPosts,
  getStoredRooms,
  getTelegramAdminState,
  saveTelegramAdminState,
  updateRoomImage,
  updateRoomPrice,
} from "./store";

type InlineKeyboardButton =
  | { text: string; callback_data: string }
  | { text: string; url: string };

type AdminMessageOptions = {
  chatId?: string | number;
  replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] };
};

type TelegramApiResult = {
  ok: boolean;
  description?: string;
};

export type AdminTelegramMessage = {
  message_id: number;
  from?: { id: number };
  chat: { id: number; type: string };
  text?: string;
  photo?: { file_id: string }[];
};

export type AdminTelegramCallback = {
  id: string;
  from: { id: number; first_name: string };
  message?: { message_id: number; chat: { id: number; type: string }; text?: string };
  data?: string;
};

export type TelegramAdminDependencies = {
  sendMessage: (text: string, options?: AdminMessageOptions) => Promise<TelegramApiResult>;
  callApi: (method: string, payload: Record<string, unknown>) => Promise<TelegramApiResult>;
  isAdmin: (userId: number, chatId: number, chatType: string) => boolean;
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
    .replace(/-$/g, "");
}

function getString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === "string" ? value : null;
}

function getNumber(data: Record<string, unknown>, key: string): number | null {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parsePositiveInteger(text: string): number | null {
  const parsed = Number.parseInt(text.replace(/[₦,\s]/g, ""), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function getTodayInLagos(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

async function setState(
  chatId: number,
  userId: number,
  step: string,
  data: Record<string, unknown>,
): Promise<void> {
  await saveTelegramAdminState(chatId, userId, { step, data });
}

async function sendAdminMenu(
  chatId: number,
  dependencies: TelegramAdminDependencies,
): Promise<void> {
  const [rooms, posts, bookings] = await Promise.all([
    getStoredRooms(),
    getStoredPosts(),
    getStoredBookings(),
  ]);
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
  await dependencies.sendMessage(
    [
      `🔐 <b>Admin Operations &amp; CMS</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🏨 Rooms: <b>${rooms.length}</b> listed`,
      `✍️ Blog Posts: <b>${posts.length}</b> published`,
      `📅 Active Bookings: <b>${activeBookings.length}</b> reserved`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `Choose a module to manage:`,
    ].join("\n"),
    {
      chatId,
      replyMarkup: {
        inline_keyboard: [
          [{ text: "🏨 Manage Rooms & Prices", callback_data: "admin_rooms" }],
          [{ text: "📅 Bookings & Calendar Collision", callback_data: "admin_bookings" }],
          [{ text: "✍️ Blog Stories Manager", callback_data: "admin_blog" }],
        ],
      },
    },
  );
}

async function sendRoomsMenu(chatId: number, dependencies: TelegramAdminDependencies): Promise<void> {
  await dependencies.sendMessage("🏨 <b>Room Manager</b>\n\nChoose an action:", {
    chatId,
    replyMarkup: {
      inline_keyboard: [
        [{ text: "✏️ Edit Room Price", callback_data: "admin_edit_price" }],
        [{ text: "🖼️ Change Room Photo", callback_data: "admin_edit_photo" }],
        [{ text: "➕ Add New Room", callback_data: "admin_add_room" }],
        [{ text: "🗑️ Delete Room", callback_data: "admin_delete_room" }],
        [{ text: "◀️ Back to Admin", callback_data: "admin_main" }],
      ],
    },
  });
}

async function sendBookingsMenu(
  chatId: number,
  dependencies: TelegramAdminDependencies,
): Promise<void> {
  const bookings = (await getStoredBookings()).filter((booking) => booking.status !== "cancelled");
  await dependencies.sendMessage(
    `📅 <b>Bookings &amp; Calendar Availability</b>\n\nActive Reservations: <b>${bookings.length}</b>\n\nChoose an action:`,
    {
      chatId,
      replyMarkup: {
        inline_keyboard: [
          [{ text: "📋 View Active Bookings", callback_data: "admin_view_bookings" }],
          [{ text: "🔒 Manually Block Dates", callback_data: "admin_block_dates" }],
          [{ text: "🔓 Cancel / Free Up Booking", callback_data: "admin_cancel_booking" }],
          [{ text: "◀️ Back to Admin", callback_data: "admin_main" }],
        ],
      },
    },
  );
}

async function sendBlogMenu(chatId: number, dependencies: TelegramAdminDependencies): Promise<void> {
  await dependencies.sendMessage("✍️ <b>Blog Manager</b>\n\nChoose an action:", {
    chatId,
    replyMarkup: {
      inline_keyboard: [
        [{ text: "➕ Post New Blog", callback_data: "admin_new_post" }],
        [{ text: "📋 List All Posts", callback_data: "admin_list_posts" }],
        [{ text: "🗑️ Delete Post", callback_data: "admin_delete_post" }],
        [{ text: "◀️ Back to Admin", callback_data: "admin_main" }],
      ],
    },
  });
}

function isAdminCallback(data: string): boolean {
  return (
    data.startsWith("admin_") ||
    data.startsWith("ep_") ||
    data.startsWith("ephoto_") ||
    data.startsWith("delroom_") ||
    data.startsWith("confirmdelroom_") ||
    data.startsWith("dp_") ||
    data.startsWith("confirmdp_") ||
    data.startsWith("blk_") ||
    data.startsWith("cbr_") ||
    data.startsWith("confirmcancel_") ||
    data.startsWith("notify_")
  );
}

export async function handleTelegramAdminCallback(
  callback: AdminTelegramCallback,
  dependencies: TelegramAdminDependencies,
): Promise<boolean> {
  const data = callback.data || "";
  if (!isAdminCallback(data)) return false;

  const chat = callback.message?.chat;
  if (!chat || !dependencies.isAdmin(callback.from.id, chat.id, chat.type)) {
    await dependencies.callApi("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "Only an authorized hotel admin can use this action.",
      show_alert: true,
    });
    return true;
  }

  await dependencies.callApi("answerCallbackQuery", { callback_query_id: callback.id });
  const chatId = chat.id;
  const userId = callback.from.id;

  if (data === "admin_main") {
    await clearTelegramAdminState(chatId, userId);
    await sendAdminMenu(chatId, dependencies);
    return true;
  }
  if (data === "admin_rooms") {
    await sendRoomsMenu(chatId, dependencies);
    return true;
  }
  if (data === "admin_bookings") {
    await sendBookingsMenu(chatId, dependencies);
    return true;
  }
  if (data === "admin_blog") {
    await sendBlogMenu(chatId, dependencies);
    return true;
  }

  if (data === "admin_edit_price" || data === "admin_edit_photo" || data === "admin_delete_room") {
    const rooms = await getStoredRooms();
    if (rooms.length === 0) {
      await dependencies.sendMessage("📭 No rooms are currently listed.", { chatId });
      return true;
    }
    const prefix =
      data === "admin_edit_price" ? "ep_" : data === "admin_edit_photo" ? "ephoto_" : "delroom_";
    const title =
      data === "admin_edit_price"
        ? "✏️ <b>Edit Room Price</b>\n\nSelect the room to update:"
        : data === "admin_edit_photo"
          ? "🖼️ <b>Change Room Photo</b>\n\nSelect the room:"
          : "🗑️ <b>Delete Room</b>\n\nSelect the room to delete:";
    await dependencies.sendMessage(title, {
      chatId,
      replyMarkup: {
        inline_keyboard: [
          ...rooms.map((room) => [
            {
              text: `${data === "admin_edit_price" ? `${room.name} — ${formatNaira(room.pricePerNight)}` : room.name}`,
              callback_data: `${prefix}${room.slug}`,
            },
          ]),
          [{ text: "❌ Cancel", callback_data: "admin_rooms" }],
        ],
      },
    });
    return true;
  }

  if (data === "admin_add_room") {
    await setState(chatId, userId, "adding_room_name", {});
    await dependencies.sendMessage("➕ <b>Add New Room</b>\n\n<b>Step 1/7:</b> Type the room name.\n\nType /cancel to stop.", { chatId });
    return true;
  }

  if (data.startsWith("ep_")) {
    const slug = data.slice(3);
    const room = (await getStoredRooms()).find((item) => item.slug === slug);
    if (!room) {
      await dependencies.sendMessage("❌ Room not found.", { chatId });
      return true;
    }
    await setState(chatId, userId, "awaiting_new_price", {
      slug,
      roomName: room.name,
      oldPrice: room.pricePerNight,
    });
    await dependencies.sendMessage(
      `💰 Current price for <b>${escapeHtml(room.name)}</b> is <b>${formatNaira(room.pricePerNight)}</b>/night.\n\nType the new price in Naira (for example, <code>500000</code>), or /cancel.`,
      { chatId },
    );
    return true;
  }

  if (data.startsWith("ephoto_")) {
    const slug = data.slice(7);
    const room = (await getStoredRooms()).find((item) => item.slug === slug);
    if (!room) {
      await dependencies.sendMessage("❌ Room not found.", { chatId });
      return true;
    }
    await setState(chatId, userId, "awaiting_room_photo", { slug, roomName: room.name });
    await dependencies.sendMessage(
      `📸 Send a new photo for <b>${escapeHtml(room.name)}</b>.\n\nType /cancel to stop.`,
      { chatId },
    );
    return true;
  }

  if (data.startsWith("delroom_")) {
    const slug = data.slice("delroom_".length);
    const room = (await getStoredRooms()).find((item) => item.slug === slug);
    if (!room) {
      await dependencies.sendMessage("❌ Room not found.", { chatId });
      return true;
    }
    await dependencies.sendMessage(
      `⚠️ Delete <b>${escapeHtml(room.name)}</b> from the website? Existing reservation records will remain.`,
      {
        chatId,
        replyMarkup: {
          inline_keyboard: [[
            { text: "✅ Yes, Delete", callback_data: `confirmdelroom_${slug}` },
            { text: "❌ Keep Room", callback_data: "admin_rooms" },
          ]],
        },
      },
    );
    return true;
  }

  if (data.startsWith("confirmdelroom_")) {
    const slug = data.slice("confirmdelroom_".length);
    const deleted = await deleteStoredRoom(slug);
    await dependencies.sendMessage(
      deleted ? "✅ Room deleted from the website." : "❌ Room not found.",
      { chatId },
    );
    await sendAdminMenu(chatId, dependencies);
    return true;
  }

  if (data === "admin_view_bookings" || data === "admin_cancel_booking") {
    const bookings = (await getStoredBookings()).filter((booking) => booking.status !== "cancelled");
    if (bookings.length === 0) {
      await dependencies.sendMessage("📭 No active reservations or blocked dates.", { chatId });
      return true;
    }
    if (data === "admin_view_bookings") {
      const lines = bookings.slice(0, 20).map((booking, index) => {
        const status = booking.status === "blocked" ? "🔒 BLOCKED" : "✅ CONFIRMED";
        const checkout = booking.actualCheckOut || booking.checkOut;
        return [
          `${index + 1}. <b>${escapeHtml(booking.roomName)}</b> (${status})`,
          `   📅 ${booking.checkIn} → ${checkout} (${booking.nights} nights)`,
          `   👤 ${escapeHtml(booking.guestName)} · 📞 ${escapeHtml(booking.guestPhone || "N/A")}`,
          `   🔖 <code>${escapeHtml(booking.reference)}</code>`,
        ].join("\n");
      });
      const more = bookings.length > 20 ? `\n\nShowing 20 of ${bookings.length}.` : "";
      const retryButtons = bookings.slice(0, 20).map((booking) => [{
        text: `📨 Retry pending alerts · ${booking.roomName.slice(0, 18)} · ${booking.checkIn}`,
        callback_data: `notify_${booking.reference}`,
      }]);
      await dependencies.sendMessage(
        `📋 <b>Active Reservations &amp; Blocks</b>\n━━━━━━━━━━━━━━━━━━━━━━\n${lines.join("\n\n")}${more}`,
        {
          chatId,
          replyMarkup: { inline_keyboard: retryButtons },
        },
      );
      return true;
    }
    await dependencies.sendMessage("🔓 Select a reservation to release its dates:", {
      chatId,
      replyMarkup: {
        inline_keyboard: [
          ...bookings.map((booking) => [{
            text: `${booking.roomName.slice(0, 18)}: ${booking.checkIn}`,
            callback_data: `cbr_${booking.reference}`,
          }]),
          [{ text: "❌ Cancel", callback_data: "admin_bookings" }],
        ],
      },
    });
    return true;
  }

  if (data.startsWith("cbr_")) {
    const reference = data.slice(4);
    const booking = (await getStoredBookings()).find((item) => item.reference === reference);
    if (!booking || booking.status === "cancelled") {
      await dependencies.sendMessage("❌ Active reservation not found.", { chatId });
      return true;
    }
    await dependencies.sendMessage(
      `⚠️ Release <b>${escapeHtml(booking.roomName)}</b> for <code>${escapeHtml(reference)}</code>? This frees the dates on the website.`,
      {
        chatId,
        replyMarkup: {
          inline_keyboard: [[
            { text: "✅ Confirm release", callback_data: `confirmcancel_${reference}` },
            { text: "❌ Keep booking", callback_data: "admin_bookings" },
          ]],
        },
      },
    );
    return true;
  }

  if (data.startsWith("confirmcancel_")) {
    const reference = data.slice("confirmcancel_".length);
    const cancelled = await cancelStoredBooking(reference);
    await dependencies.sendMessage(
      cancelled ? "✅ Reservation cancelled and dates released." : "❌ Active reservation not found.",
      { chatId },
    );
    await sendBookingsMenu(chatId, dependencies);
    return true;
  }

  if (data.startsWith("notify_")) {
    const reference = data.slice("notify_".length);
    const booking = (await getStoredBookings()).find((item) => item.reference === reference);
    if (!booking || booking.status !== "confirmed") {
      await dependencies.sendMessage("❌ Confirmed booking not found.", { chatId });
      return true;
    }
    await dispatchBookingNotifications({
      reference: booking.reference,
      roomSlug: booking.roomSlug,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      nights: booking.nights,
      amountKobo: booking.amountKobo,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
    }, booking.roomName);
    await dependencies.sendMessage(
      "📨 Pending booking notifications checked. Already-delivered messages were not sent again; check your email and Vercel logs for any delivery errors.",
      { chatId },
    );
    return true;
  }

  if (data === "admin_block_dates") {
    const rooms = await getStoredRooms();
    if (rooms.length === 0) {
      await dependencies.sendMessage("📭 No rooms are currently listed.", { chatId });
      return true;
    }
    await dependencies.sendMessage("🔒 Select the room whose dates you want to block:", {
      chatId,
      replyMarkup: {
        inline_keyboard: [
          ...rooms.map((room) => [{
            text: `🔒 ${room.name}`,
            callback_data: `blk_${room.slug}`,
          }]),
          [{ text: "❌ Cancel", callback_data: "admin_bookings" }],
        ],
      },
    });
    return true;
  }

  if (data.startsWith("blk_")) {
    const slug = data.slice(4);
    const room = (await getStoredRooms()).find((item) => item.slug === slug);
    if (!room) {
      await dependencies.sendMessage("❌ Room not found.", { chatId });
      return true;
    }
    await setState(chatId, userId, "blocking_check_in", {
      roomSlug: room.slug,
      roomName: room.name,
    });
    await dependencies.sendMessage(
      `🔒 Blocking dates for <b>${escapeHtml(room.name)}</b>.\n\nStep 1/3: Enter the check-in date as <code>YYYY-MM-DD</code>, or /cancel.`,
      { chatId },
    );
    return true;
  }

  if (data === "admin_new_post") {
    await setState(chatId, userId, "blog_title", {});
    await dependencies.sendMessage("✍️ <b>Post New Blog</b>\n\nStep 1/4: Type the blog title, or /cancel.", { chatId });
    return true;
  }

  if (data === "admin_list_posts" || data === "admin_delete_post") {
    const posts = await getStoredPosts();
    if (posts.length === 0) {
      await dependencies.sendMessage("📭 No blog posts are currently published.", { chatId });
      return true;
    }
    if (data === "admin_list_posts") {
      const lines = posts.slice(0, 30).map(
        (post, index) => `${index + 1}. <b>${escapeHtml(post.title)}</b>\n   📅 ${post.date} · <code>${escapeHtml(post.slug)}</code>`,
      );
      await dependencies.sendMessage(
        `📋 <b>Blog Posts (${posts.length})</b>\n━━━━━━━━━━━━━━━━━━━━━━\n${lines.join("\n\n")}`,
        { chatId },
      );
      return true;
    }
    await dependencies.sendMessage("🗑️ Select a post to delete:", {
      chatId,
      replyMarkup: {
        inline_keyboard: [
          ...posts.map((post) => [{
            text: `🗑️ ${post.title.slice(0, 40)}`,
            callback_data: `dp_${post.slug}`,
          }]),
          [{ text: "❌ Cancel", callback_data: "admin_blog" }],
        ],
      },
    });
    return true;
  }

  if (data.startsWith("dp_")) {
    const slug = data.slice(3);
    const post = (await getStoredPosts()).find((item) => item.slug === slug);
    if (!post) {
      await dependencies.sendMessage("❌ Blog post not found.", { chatId });
      return true;
    }
    await dependencies.sendMessage(`⚠️ Delete <b>${escapeHtml(post.title)}</b>?`, {
      chatId,
      replyMarkup: {
        inline_keyboard: [[
          { text: "✅ Yes, Delete", callback_data: `confirmdp_${slug}` },
          { text: "❌ Keep Post", callback_data: "admin_blog" },
        ]],
      },
    });
    return true;
  }

  if (data.startsWith("confirmdp_")) {
    const slug = data.slice("confirmdp_".length);
    const deleted = await deleteStoredPost(slug);
    await dependencies.sendMessage(
      deleted ? "✅ Blog post deleted from the website." : "❌ Blog post not found.",
      { chatId },
    );
    await sendAdminMenu(chatId, dependencies);
    return true;
  }

  return true;
}

export async function handleTelegramAdminMessage(
  message: AdminTelegramMessage,
  dependencies: TelegramAdminDependencies,
): Promise<boolean> {
  if (typeof message.text !== "string" || !message.from) return false;
  const text = message.text.trim();
  const command = text.split(/\s+/)[0].toLowerCase().split("@")[0];
  const chatId = message.chat.id;
  const userId = message.from.id;
  const isAdmin = dependencies.isAdmin(userId, chatId, message.chat.type);

  if (command === "/admin") {
    if (!isAdmin) {
      await dependencies.sendMessage("⛔ Admin access is restricted to authorized hotel staff.", { chatId });
      return true;
    }
    await clearTelegramAdminState(chatId, userId);
    await sendAdminMenu(chatId, dependencies);
    return true;
  }

  const state = isAdmin ? await getTelegramAdminState(chatId, userId) : null;
  if (command === "/cancel") {
    if (state) {
      await clearTelegramAdminState(chatId, userId);
      await dependencies.sendMessage("❌ Operation cancelled.", { chatId });
      await sendAdminMenu(chatId, dependencies);
    } else {
      await dependencies.sendMessage("Nothing to cancel.", { chatId });
    }
    return true;
  }
  if (!state) return false;

  const data = state.data;
  if (state.step === "blocking_check_in") {
    if (!isDateOnly(text) || text < getTodayInLagos()) {
      await dependencies.sendMessage("❌ Enter a valid check-in date today or later as YYYY-MM-DD.", { chatId });
      return true;
    }
    await setState(chatId, userId, "blocking_check_out", { ...data, checkIn: text });
    await dependencies.sendMessage(
      `📅 Check-in: <b>${text}</b>\n\nStep 2/3: Enter the check-out date as <code>YYYY-MM-DD</code>.`,
      { chatId },
    );
    return true;
  }

  if (state.step === "blocking_check_out") {
    const checkIn = getString(data, "checkIn");
    if (!checkIn || !isDateOnly(text) || text <= checkIn) {
      await dependencies.sendMessage("❌ Check-out must be a valid date after the check-in date.", { chatId });
      return true;
    }
    await setState(chatId, userId, "blocking_reason", { ...data, checkOut: text });
    await dependencies.sendMessage(
      `📅 Dates: <b>${checkIn} → ${text}</b>\n\nStep 3/3: Type the reason for blocking these dates.`,
      { chatId },
    );
    return true;
  }

  if (state.step === "blocking_reason") {
    const roomSlug = getString(data, "roomSlug");
    const roomName = getString(data, "roomName");
    const checkIn = getString(data, "checkIn");
    const checkOut = getString(data, "checkOut");
    if (!roomSlug || !roomName || !checkIn || !checkOut) {
      await clearTelegramAdminState(chatId, userId);
      await dependencies.sendMessage("❌ This block request expired. Start again with /admin.", { chatId });
      return true;
    }
    const result = await blockRoomDates(roomSlug, roomName, checkIn, checkOut, text);
    await clearTelegramAdminState(chatId, userId);
    await dependencies.sendMessage(
      result.ok
        ? `🔒 <b>Room dates blocked</b>\n🏨 ${escapeHtml(roomName)}\n📅 ${checkIn} → ${checkOut}\n🏷️ ${escapeHtml(text)}`
        : `⚠️ Could not block those dates: ${escapeHtml(result.message)}`,
      { chatId },
    );
    await sendAdminMenu(chatId, dependencies);
    return true;
  }

  if (state.step === "awaiting_new_price") {
    const price = parsePositiveInteger(text);
    const slug = getString(data, "slug");
    if (!price) {
      await dependencies.sendMessage("❌ Enter a positive price in Naira, for example 500000.", { chatId });
      return true;
    }
    if (!slug) {
      await clearTelegramAdminState(chatId, userId);
      await dependencies.sendMessage("❌ Room selection expired. Start again with /admin.", { chatId });
      return true;
    }
    const room = await updateRoomPrice(slug, price);
    await clearTelegramAdminState(chatId, userId);
    await dependencies.sendMessage(
      room
        ? `✅ <b>Price updated</b>\n🏨 ${escapeHtml(room.name)}\n💰 ${formatNaira(price)} per night`
        : "❌ Room not found.",
      { chatId },
    );
    await sendAdminMenu(chatId, dependencies);
    return true;
  }

  if (state.step === "adding_room_name") {
    const name = text.slice(0, 80).trim();
    const slug = slugify(name);
    if (!slug) {
      await dependencies.sendMessage("❌ Use a room name with letters or numbers.", { chatId });
      return true;
    }
    const rooms = await getStoredRooms();
    if (rooms.some((room) => room.slug === slug)) {
      await dependencies.sendMessage("❌ A room with that name already exists. Enter a different name.", { chatId });
      return true;
    }
    await setState(chatId, userId, "adding_room_price", { name, slug });
    await dependencies.sendMessage(
      `👍 Room: <b>${escapeHtml(name)}</b>\n\nStep 2/7: Enter the nightly price in Naira.`,
      { chatId },
    );
    return true;
  }

  if (state.step === "adding_room_price") {
    const price = parsePositiveInteger(text);
    if (!price) {
      await dependencies.sendMessage("❌ Enter a positive price in Naira, for example 500000.", { chatId });
      return true;
    }
    await setState(chatId, userId, "adding_room_beds", { ...data, pricePerNight: price });
    await dependencies.sendMessage(`💰 ${formatNaira(price)} per night.\n\nStep 3/7: Enter the bed configuration.`, { chatId });
    return true;
  }

  if (state.step === "adding_room_beds") {
    if (!text || text.length > 100) {
      await dependencies.sendMessage("❌ Enter a bed description of up to 100 characters.", { chatId });
      return true;
    }
    await setState(chatId, userId, "adding_room_guests", { ...data, beds: text });
    await dependencies.sendMessage("Step 4/7: Enter the maximum number of guests (1–20).", { chatId });
    return true;
  }

  if (state.step === "adding_room_guests") {
    const guests = Number.parseInt(text, 10);
    if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
      await dependencies.sendMessage("❌ Enter a whole number from 1 to 20.", { chatId });
      return true;
    }
    const guestsLabel = guests <= 2 ? `${guests} Guests` : `${guests - 1}-${guests} Guests`;
    await setState(chatId, userId, "adding_room_size", { ...data, maxGuests: guests, guestsLabel });
    await dependencies.sendMessage("Step 5/7: Enter the room size in square feet.", { chatId });
    return true;
  }

  if (state.step === "adding_room_size") {
    const size = parsePositiveInteger(text);
    if (!size) {
      await dependencies.sendMessage("❌ Enter a positive room size in square feet.", { chatId });
      return true;
    }
    await setState(chatId, userId, "adding_room_description", { ...data, sizeSqft: size });
    await dependencies.sendMessage("Step 6/7: Enter a short room description.", { chatId });
    return true;
  }

  if (state.step === "adding_room_description") {
    if (!text || text.length > 500) {
      await dependencies.sendMessage("❌ Enter a description of up to 500 characters.", { chatId });
      return true;
    }
    await setState(chatId, userId, "adding_room_photo", {
      ...data,
      tagline: text,
      description: text,
    });
    await dependencies.sendMessage("Step 7/7: Send a room photo. It will be stored in Cloudinary.", { chatId });
    return true;
  }

  if (state.step === "blog_title") {
    const title = text.slice(0, 120).trim();
    const slug = slugify(title);
    if (!slug) {
      await dependencies.sendMessage("❌ Enter a title with letters or numbers.", { chatId });
      return true;
    }
    const posts = await getStoredPosts();
    if (posts.some((post) => post.slug === slug)) {
      await dependencies.sendMessage("❌ A blog post with that title already exists. Enter a different title.", { chatId });
      return true;
    }
    await setState(chatId, userId, "blog_excerpt", {
      title,
      slug,
      date: getTodayInLagos(),
    });
    await dependencies.sendMessage("Step 2/4: Type a short excerpt for the blog post.", { chatId });
    return true;
  }

  if (state.step === "blog_excerpt") {
    if (!text || text.length > 500) {
      await dependencies.sendMessage("❌ Enter an excerpt of up to 500 characters.", { chatId });
      return true;
    }
    await setState(chatId, userId, "blog_body", { ...data, excerpt: text, body: [] });
    await dependencies.sendMessage(
      "Step 3/4: Send the blog paragraphs one at a time. Type /done when finished.",
      { chatId },
    );
    return true;
  }

  if (state.step === "blog_body") {
    const body = Array.isArray(data.body)
      ? data.body.filter((item): item is string => typeof item === "string")
      : [];
    if (command === "/done") {
      if (body.length === 0) {
        await dependencies.sendMessage("❌ Add at least one paragraph before typing /done.", { chatId });
        return true;
      }
      await setState(chatId, userId, "blog_photo", { ...data, body });
      await dependencies.sendMessage("Step 4/4: Send a cover photo, or type /skip to use the default image.", { chatId });
      return true;
    }
    if (text.length > 3000 || body.length >= 30) {
      await dependencies.sendMessage("❌ Paragraphs must be under 3,000 characters; a post can have up to 30 paragraphs.", { chatId });
      return true;
    }
    await setState(chatId, userId, "blog_body", { ...data, body: [...body, text] });
    await dependencies.sendMessage(`✅ Paragraph ${body.length + 1} saved. Send another or type /done.`, { chatId });
    return true;
  }

  if (state.step === "blog_photo" && command === "/skip") {
    const title = getString(data, "title");
    const slug = getString(data, "slug");
    const excerpt = getString(data, "excerpt");
    const date = getString(data, "date");
    const body = Array.isArray(data.body)
      ? data.body.filter((item): item is string => typeof item === "string")
      : [];
    if (!title || !slug || !excerpt || !date || body.length === 0) {
      await clearTelegramAdminState(chatId, userId);
      await dependencies.sendMessage("❌ The blog draft is incomplete. Start again with /admin.", { chatId });
      return true;
    }
    const post: Post = {
      slug,
      title,
      excerpt,
      date,
      image: "/images/blog/bonfire-nights.webp",
      body,
    };
    await addStoredPost(post);
    await clearTelegramAdminState(chatId, userId);
    await dependencies.sendMessage(`✅ Blog post published: <b>${escapeHtml(title)}</b>`, { chatId });
    await sendAdminMenu(chatId, dependencies);
    return true;
  }

  if (state.step === "awaiting_room_photo" || state.step === "adding_room_photo" || state.step === "blog_photo") {
    await dependencies.sendMessage(
      state.step === "blog_photo"
        ? "📸 Send a cover photo, or type /skip."
        : "📸 Send a photo, or type /cancel to stop.",
      { chatId },
    );
    return true;
  }

  await clearTelegramAdminState(chatId, userId);
  await dependencies.sendMessage("That admin step expired. Send /admin to start again.", { chatId });
  return true;
}

export async function handleTelegramAdminPhoto(
  message: AdminTelegramMessage,
  dependencies: TelegramAdminDependencies,
): Promise<boolean> {
  if (!message.photo?.length || !message.from) return false;
  const chatId = message.chat.id;
  const userId = message.from.id;
  if (!dependencies.isAdmin(userId, chatId, message.chat.type)) return false;

  const state = await getTelegramAdminState(chatId, userId);
  if (
    !state ||
    !["awaiting_room_photo", "adding_room_photo", "blog_photo"].includes(state.step)
  ) {
    return false;
  }

  const fileId = message.photo[message.photo.length - 1].file_id;
  await dependencies.sendMessage("⏳ Uploading photo to Cloudinary…", { chatId });
  try {
    const imageUrl = await saveTelegramPhotoToCloudinary(fileId);
    if (state.step === "awaiting_room_photo") {
      const slug = getString(state.data, "slug");
      if (!slug) throw new Error("Room selection expired.");
      const room = await updateRoomImage(slug, imageUrl);
      if (!room) throw new Error("Room not found.");
      await clearTelegramAdminState(chatId, userId);
      await dependencies.sendMessage(
        `✅ Photo updated for <b>${escapeHtml(room.name)}</b>.`,
        { chatId },
      );
      await sendAdminMenu(chatId, dependencies);
      return true;
    }

    if (state.step === "adding_room_photo") {
      const name = getString(state.data, "name");
      const slug = getString(state.data, "slug");
      const tagline = getString(state.data, "tagline");
      const description = getString(state.data, "description");
      const beds = getString(state.data, "beds");
      const guestsLabel = getString(state.data, "guestsLabel");
      const pricePerNight = getNumber(state.data, "pricePerNight");
      const maxGuests = getNumber(state.data, "maxGuests");
      const sizeSqft = getNumber(state.data, "sizeSqft");
      if (
        !name || !slug || !tagline || !description || !beds || !guestsLabel ||
        pricePerNight === null || maxGuests === null || sizeSqft === null
      ) {
        throw new Error("Room details are incomplete.");
      }
      const room: Room = {
        slug,
        name,
        tagline,
        description,
        sizeSqft,
        beds,
        guestsLabel,
        maxGuests,
        pricePerNight,
        image: imageUrl,
        heroImage: imageUrl,
        gallery: [imageUrl],
        amenities: ["Breakfast", "Smart TV", "Wi-Fi", "Mini Bar"],
      };
      await addStoredRoom(room);
      await clearTelegramAdminState(chatId, userId);
      await dependencies.sendMessage(
        `✅ <b>New room published</b>\n🏨 ${escapeHtml(name)}\n💰 ${formatNaira(pricePerNight)} per night`,
        { chatId },
      );
      await sendAdminMenu(chatId, dependencies);
      return true;
    }

    const title = getString(state.data, "title");
    const slug = getString(state.data, "slug");
    const excerpt = getString(state.data, "excerpt");
    const date = getString(state.data, "date");
    const body = Array.isArray(state.data.body)
      ? state.data.body.filter((item): item is string => typeof item === "string")
      : [];
    if (!title || !slug || !excerpt || !date || body.length === 0) {
      throw new Error("Blog draft is incomplete.");
    }
    const post: Post = { slug, title, excerpt, date, image: imageUrl, heroImage: imageUrl, body };
    await addStoredPost(post);
    await clearTelegramAdminState(chatId, userId);
    await dependencies.sendMessage(`✅ Blog post published: <b>${escapeHtml(title)}</b>`, { chatId });
    await sendAdminMenu(chatId, dependencies);
    return true;
  } catch (error) {
    console.error("[Telegram Admin] Could not save admin photo.", {
      chatId,
      userId,
      error,
    });
    const messageText = error instanceof Error ? error.message : "Photo upload failed.";
    await dependencies.sendMessage(`❌ ${escapeHtml(messageText)} Please try again or type /cancel.`, { chatId });
    return true;
  }
}
