import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { rooms as initialRooms, type Room } from "@/content/rooms";
import { posts as initialPosts, type Post } from "@/content/posts";
import { findRoomAvailabilityConflict } from "@/lib/booking-rules";
import type { Collection, Document } from "mongodb";
import { getMongoDb } from "./mongodb";
export { datesOverlap } from "@/lib/booking-rules";

const LOCAL_DATA_DIR = path.resolve(process.cwd(), "data");

type SiteContentDocument = Document & { _id: string; items: unknown };

let siteContentCollectionPromise: Promise<Collection<SiteContentDocument>> | undefined;

function getSiteContentCollection(): Promise<Collection<SiteContentDocument>> {
  if (!siteContentCollectionPromise) {
    siteContentCollectionPromise = getMongoDb()
      .then((db) => db.collection<SiteContentDocument>("site_content"))
      .catch((error: unknown) => {
        siteContentCollectionPromise = undefined;
        throw error;
      });
  }
  return siteContentCollectionPromise;
}

function isRoom(value: unknown): value is Room {
  if (typeof value !== "object" || value === null) return false;
  const room = value as Record<string, unknown>;
  return (
    typeof room.slug === "string" &&
    typeof room.name === "string" &&
    typeof room.tagline === "string" &&
    typeof room.description === "string" &&
    typeof room.sizeSqft === "number" &&
    typeof room.beds === "string" &&
    typeof room.guestsLabel === "string" &&
    typeof room.maxGuests === "number" &&
    typeof room.pricePerNight === "number" &&
    typeof room.image === "string" &&
    Array.isArray(room.gallery) &&
    room.gallery.every((item) => typeof item === "string") &&
    Array.isArray(room.amenities) &&
    room.amenities.every((item) => typeof item === "string")
  );
}

function isPost(value: unknown): value is Post {
  if (typeof value !== "object" || value === null) return false;
  const post = value as Record<string, unknown>;
  return (
    typeof post.slug === "string" &&
    typeof post.title === "string" &&
    typeof post.excerpt === "string" &&
    typeof post.date === "string" &&
    typeof post.image === "string" &&
    Array.isArray(post.body) &&
    post.body.every((item) => typeof item === "string")
  );
}

function getLocalRooms(): Room[] | null {
  if (process.env.NODE_ENV === "production") return null;
  const file = path.join(LOCAL_DATA_DIR, "rooms.json");
  if (!fs.existsSync(file)) return null;
  try {
    const data: unknown = JSON.parse(fs.readFileSync(file, "utf-8"));
    if (Array.isArray(data) && data.every(isRoom)) return data;
    throw new Error("Local room content is invalid.");
  } catch (error) {
    console.error("[Store] Could not read local rooms.json.", error);
    return null;
  }
}

function getLocalPosts(): Post[] | null {
  if (process.env.NODE_ENV === "production") return null;
  const file = path.join(LOCAL_DATA_DIR, "posts.json");
  if (!fs.existsSync(file)) return null;
  try {
    const data: unknown = JSON.parse(fs.readFileSync(file, "utf-8"));
    if (Array.isArray(data) && data.every(isPost)) return data;
    throw new Error("Local blog content is invalid.");
  } catch (error) {
    console.error("[Store] Could not read local posts.json.", error);
    return null;
  }
}

function revalidateSiteContent(): void {
  revalidatePath("/", "layout");
  revalidatePath("/rooms");
  revalidatePath("/rooms/[slug]", "page");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
}

export async function getStoredRooms(): Promise<Room[]> {
  if (!process.env.MONGODB_URI?.trim()) {
    return getLocalRooms() ?? structuredClone(initialRooms);
  }
  const document = await (await getSiteContentCollection()).findOne({ _id: "rooms" });
  if (!document) return getLocalRooms() ?? structuredClone(initialRooms);
  if (!Array.isArray(document.items) || !document.items.every(isRoom)) {
    throw new Error("Stored room content is invalid.");
  }
  return document.items;
}

export async function saveStoredRooms(rooms: Room[]): Promise<void> {
  await (await getSiteContentCollection()).replaceOne(
    { _id: "rooms" },
    { _id: "rooms", items: rooms },
    { upsert: true },
  );
  revalidateSiteContent();
}

export async function updateRoomPrice(slug: string, newPrice: number): Promise<Room | null> {
  const rooms = await getStoredRooms();
  const index = rooms.findIndex((r) => r.slug === slug);
  if (index === -1) return null;

  rooms[index] = { ...rooms[index], pricePerNight: newPrice };
  await saveStoredRooms(rooms);
  return rooms[index];
}

export async function updateRoomImage(slug: string, newImageUrl: string): Promise<Room | null> {
  const rooms = await getStoredRooms();
  const index = rooms.findIndex((r) => r.slug === slug);
  if (index === -1) return null;

  rooms[index] = {
    ...rooms[index],
    image: newImageUrl,
    heroImage: newImageUrl,
    gallery: [newImageUrl, ...(rooms[index].gallery || [])],
  };
  await saveStoredRooms(rooms);
  return rooms[index];
}

export async function addStoredRoom(room: Room): Promise<Room> {
  const rooms = await getStoredRooms();
  const existing = rooms.findIndex((r) => r.slug === room.slug);
  if (existing >= 0) {
    rooms[existing] = room;
  } else {
    rooms.push(room);
  }
  await saveStoredRooms(rooms);
  return room;
}

export async function deleteStoredRoom(slug: string): Promise<boolean> {
  const rooms = await getStoredRooms();
  const updated = rooms.filter((room) => room.slug !== slug);
  if (updated.length === rooms.length) return false;
  await saveStoredRooms(updated);
  return true;
}

export async function getStoredPosts(): Promise<Post[]> {
  if (!process.env.MONGODB_URI?.trim()) {
    return getLocalPosts() ?? structuredClone(initialPosts);
  }
  const document = await (await getSiteContentCollection()).findOne({ _id: "posts" });
  if (!document) return getLocalPosts() ?? structuredClone(initialPosts);
  if (!Array.isArray(document.items) || !document.items.every(isPost)) {
    throw new Error("Stored blog content is invalid.");
  }
  return document.items;
}

export async function saveStoredPosts(posts: Post[]): Promise<void> {
  await (await getSiteContentCollection()).replaceOne(
    { _id: "posts" },
    { _id: "posts", items: posts },
    { upsert: true },
  );
  revalidateSiteContent();
}

export async function addStoredPost(post: Post): Promise<Post> {
  const posts = await getStoredPosts();
  const filtered = posts.filter((p) => p.slug !== post.slug);
  const updated = [post, ...filtered];
  await saveStoredPosts(updated);
  return post;
}

export async function deleteStoredPost(slug: string): Promise<boolean> {
  const posts = await getStoredPosts();
  const updated = posts.filter((p) => p.slug !== slug);
  if (updated.length === posts.length) return false;
  await saveStoredPosts(updated);
  return true;
}

// -------------------------------------------------------------
// BOOKINGS & CALENDAR COLLISION DETECTION
// -------------------------------------------------------------

export type StoredBooking = {
  reference: string;
  roomSlug: string;
  roomName: string;
  checkIn: string; // "YYYY-MM-DD"
  checkOut: string; // "YYYY-MM-DD"
  nights: number;
  guests: number;
  amountKobo: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  createdAt: string;
  actualCheckOut?: string;
  checkedOutAt?: string;
  status: "confirmed" | "blocked" | "cancelled";
};

type MongoStoredBooking = StoredBooking & Document & {
  telegramNotificationSentAt?: Date;
  telegramNotificationClaimedAt?: Date;
  emailNotificationSentAt?: Date;
  emailNotificationClaimedAt?: Date;
};

let bookingsCollectionPromise: Promise<Collection<MongoStoredBooking>> | undefined;

function getBookingsCollection(): Promise<Collection<MongoStoredBooking>> {
  if (!bookingsCollectionPromise) {
    bookingsCollectionPromise = getMongoDb()
      .then(async (db) => {
        const collection = db.collection<MongoStoredBooking>("bookings");
        await collection.createIndex({ reference: 1 }, { unique: true });
        return collection;
      })
      .catch((error: unknown) => {
        bookingsCollectionPromise = undefined;
        throw error;
      });
  }
  return bookingsCollectionPromise;
}

export async function getStoredBookings(): Promise<StoredBooking[]> {
  const documents = await (await getBookingsCollection()).find().toArray();
  return documents.map((document) => ({
    reference: document.reference,
    roomSlug: document.roomSlug,
    roomName: document.roomName,
    checkIn: document.checkIn,
    checkOut: document.checkOut,
    nights: document.nights,
    guests: document.guests,
    amountKobo: document.amountKobo,
    guestName: document.guestName,
    guestEmail: document.guestEmail,
    guestPhone: document.guestPhone,
    createdAt: document.createdAt,
    ...(document.actualCheckOut ? { actualCheckOut: document.actualCheckOut } : {}),
    ...(document.checkedOutAt ? { checkedOutAt: document.checkedOutAt } : {}),
    status: document.status,
  }));
}

export type TelegramAdminState = {
  step: string;
  data: Record<string, unknown>;
};

type TelegramAdminStateDocument = Document & {
  chatId: string;
  userId: string;
  step: string;
  data: Record<string, unknown>;
  updatedAt: Date;
};

let telegramAdminStatesCollectionPromise: Promise<Collection<TelegramAdminStateDocument>> | undefined;

function getTelegramAdminStatesCollection(): Promise<Collection<TelegramAdminStateDocument>> {
  if (!telegramAdminStatesCollectionPromise) {
    telegramAdminStatesCollectionPromise = getMongoDb()
      .then(async (db) => {
        const collection = db.collection<TelegramAdminStateDocument>("telegram_admin_states");
        await collection.createIndex({ chatId: 1, userId: 1 }, { unique: true });
        await collection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 86_400 });
        return collection;
      })
      .catch((error: unknown) => {
        telegramAdminStatesCollectionPromise = undefined;
        throw error;
      });
  }
  return telegramAdminStatesCollectionPromise;
}

export async function getTelegramAdminState(
  chatId: number,
  userId: number,
): Promise<TelegramAdminState | null> {
  const collection = await getTelegramAdminStatesCollection();
  const session = await collection.findOne({ chatId: String(chatId), userId: String(userId) });
  if (!session) return null;
  if (Date.now() - session.updatedAt.getTime() >= 86_400_000) {
    await collection.deleteOne({ _id: session._id });
    return null;
  }
  return { step: session.step, data: session.data };
}

export async function saveTelegramAdminState(
  chatId: number,
  userId: number,
  state: TelegramAdminState,
): Promise<void> {
  await (await getTelegramAdminStatesCollection()).updateOne(
    { chatId: String(chatId), userId: String(userId) },
    {
      $set: {
        step: state.step,
        data: state.data,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function clearTelegramAdminState(chatId: number, userId: number): Promise<void> {
  await (await getTelegramAdminStatesCollection()).deleteOne({
    chatId: String(chatId),
    userId: String(userId),
  });
}

function getLagosDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

/**
 * Checks whether a room is free for a given date range.
 * Returns { available: boolean, conflictingBooking?: StoredBooking }
 */
export async function checkRoomAvailability(
  roomSlug: string,
  checkIn: string,
  checkOut: string,
  excludeReference?: string,
): Promise<{ available: boolean; conflictingBooking?: StoredBooking }> {
  const bookings = await getStoredBookings();
  const conflictingBooking = findRoomAvailabilityConflict(
    bookings,
    roomSlug,
    checkIn,
    checkOut,
    excludeReference,
  );
  return conflictingBooking ? { available: false, conflictingBooking } : { available: true };
}

/**
 * Returns all active booked date ranges for a given room.
 */
export async function getBookedRangesForRoom(
  roomSlug: string,
): Promise<{ checkIn: string; checkOut: string; reference: string }[]> {
  const bookings = await getStoredBookings();
  const today = getLagosDate();

  return bookings
    .filter((b) => {
      const effectiveCheckOut = b.actualCheckOut ?? b.checkOut;
      return b.roomSlug === roomSlug && b.status !== "cancelled" && effectiveCheckOut >= today;
    })
    .map((b) => ({
      checkIn: b.checkIn,
      checkOut: b.actualCheckOut ?? b.checkOut,
      reference: b.reference,
    }))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

/**
 * Records or updates a confirmed booking in the persistent store.
 */
export async function recordBooking(booking: StoredBooking): Promise<boolean> {
  const collection = await getBookingsCollection();
  const existing = await collection.findOne({ reference: booking.reference });
  const { reference, ...fields } = booking;
  if (existing?.actualCheckOut) fields.actualCheckOut = existing.actualCheckOut;
  if (existing?.checkedOutAt) fields.checkedOutAt = existing.checkedOutAt;

  const result = await collection.updateOne(
    { reference },
    { $set: fields, $setOnInsert: { reference } },
    { upsert: true },
  );
  return result.upsertedCount === 1;
}

export async function claimBookingNotification(
  reference: string,
  channel: "telegram" | "email",
): Promise<boolean> {
  const collection = await getBookingsCollection();
  const staleClaim = new Date(Date.now() - 120_000);
  const result = await collection.updateOne(
    channel === "telegram"
      ? {
          reference,
          telegramNotificationSentAt: { $exists: false },
          $or: [
            { telegramNotificationClaimedAt: { $exists: false } },
            { telegramNotificationClaimedAt: { $lt: staleClaim } },
          ],
        }
      : {
          reference,
          emailNotificationSentAt: { $exists: false },
          $or: [
            { emailNotificationClaimedAt: { $exists: false } },
            { emailNotificationClaimedAt: { $lt: staleClaim } },
          ],
        },
    {
      $set: channel === "telegram"
        ? { telegramNotificationClaimedAt: new Date() }
        : { emailNotificationClaimedAt: new Date() },
    },
  );
  return result.modifiedCount === 1;
}

export async function markBookingNotificationSent(
  reference: string,
  channel: "telegram" | "email",
): Promise<void> {
  await (await getBookingsCollection()).updateOne(
    { reference },
    {
      $set: channel === "telegram"
        ? { telegramNotificationSentAt: new Date() }
        : { emailNotificationSentAt: new Date() },
      $unset: channel === "telegram"
        ? { telegramNotificationClaimedAt: "" }
        : { emailNotificationClaimedAt: "" },
    },
  );
}

export async function releaseBookingNotificationClaim(
  reference: string,
  channel: "telegram" | "email",
): Promise<void> {
  await (await getBookingsCollection()).updateOne(
    { reference },
    {
      $unset: channel === "telegram"
        ? { telegramNotificationClaimedAt: "" }
        : { emailNotificationClaimedAt: "" },
    },
  );
}

export async function markBookingCheckedOut(reference: string): Promise<{
  ok: boolean;
  message: string;
  booking?: StoredBooking;
}> {
  const collection = await getBookingsCollection();
  const booking = await collection.findOne({ reference });
  if (!booking) return { ok: false, message: "Booking not found." };
  if (booking.status !== "confirmed") {
    return { ok: false, message: "Only confirmed bookings can be checked out." };
  }
  if (booking.actualCheckOut) {
    return { ok: false, message: `Early checkout was already recorded for ${booking.actualCheckOut}.` };
  }

  const actualCheckOut = getLagosDate();
  if (actualCheckOut < booking.checkIn || actualCheckOut >= booking.checkOut) {
    return {
      ok: false,
      message: "This booking is not eligible for early checkout today. Its scheduled checkout date already frees the room automatically.",
    };
  }

  booking.actualCheckOut = actualCheckOut;
  booking.checkedOutAt = new Date().toISOString();
  const result = await collection.updateOne(
    { reference, status: "confirmed", actualCheckOut: { $exists: false } },
    { $set: { actualCheckOut, checkedOutAt: booking.checkedOutAt } },
  );
  if (result.modifiedCount !== 1) {
    return {
      ok: false,
      message: "Early checkout was already recorded.",
    };
  }
  return { ok: true, message: "Early checkout recorded.", booking: { ...booking } };
}

/**
 * Manually blocks room dates (e.g. offline walk-in guest or maintenance).
 */
export async function blockRoomDates(
  roomSlug: string,
  roomName: string,
  checkIn: string,
  checkOut: string,
  reason = "Reserved / Maintenance",
): Promise<{ ok: boolean; message: string; booking?: StoredBooking }> {
  const availability = await checkRoomAvailability(roomSlug, checkIn, checkOut);
  if (!availability.available) {
    return {
      ok: false,
      message: `Dates collide with an existing reservation (${availability.conflictingBooking?.checkIn} to ${availability.conflictingBooking?.checkOut}).`,
    };
  }

  const nights = Math.max(
    1,
    Math.round(
      (Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`)) / 86_400_000,
    ),
  );

  const blockRecord: StoredBooking = {
    reference: `block_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    roomSlug,
    roomName,
    checkIn,
    checkOut,
    nights,
    guests: 1,
    amountKobo: 0,
    guestName: `[Blocked] ${reason}`,
    guestEmail: "hotel@marksonhotel.com",
    guestPhone: "",
    createdAt: new Date().toISOString(),
    status: "blocked",
  };

  await recordBooking(blockRecord);
  return { ok: true, message: "Dates successfully blocked.", booking: blockRecord };
}

/**
 * Releases or cancels a booking.
 */
export async function cancelStoredBooking(reference: string): Promise<boolean> {
  const result = await (await getBookingsCollection()).updateOne(
    { reference, status: { $ne: "cancelled" } },
    { $set: { status: "cancelled" } },
  );
  return result.modifiedCount === 1;
}
