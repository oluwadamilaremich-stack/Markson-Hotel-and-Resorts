import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { rooms as initialRooms, type Room } from "@/content/rooms";
import { posts as initialPosts, type Post } from "@/content/posts";
import { findRoomAvailabilityConflict } from "@/lib/booking-rules";
export { datesOverlap } from "@/lib/booking-rules";

const DATA_DIR = path.resolve(process.cwd(), "data");
const ROOMS_FILE = path.join(DATA_DIR, "rooms.json");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// -------------------------------------------------------------
// ROOMS PERSISTENCE
// -------------------------------------------------------------

export function getStoredRooms(): Room[] {
  ensureDirectoryExists();
  if (!fs.existsSync(ROOMS_FILE)) {
    // Seed initial data from code
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(initialRooms, null, 2), "utf-8");
    return initialRooms;
  }

  try {
    const raw = fs.readFileSync(ROOMS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as Room[]) : initialRooms;
  } catch (error) {
    console.error("[Store] Error reading rooms.json, falling back to initial rooms:", error);
    return initialRooms;
  }
}

export function saveStoredRooms(rooms: Room[]): void {
  ensureDirectoryExists();
  fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2), "utf-8");
  try {
    revalidatePath("/", "layout");
    revalidatePath("/rooms");
  } catch {
    // In background scripts or polling outside Next.js request context, revalidatePath is a no-op
  }
}

export function updateRoomPrice(slug: string, newPrice: number): Room | null {
  const rooms = getStoredRooms();
  const index = rooms.findIndex((r) => r.slug === slug);
  if (index === -1) return null;

  rooms[index] = { ...rooms[index], pricePerNight: newPrice };
  saveStoredRooms(rooms);
  return rooms[index];
}

export function updateRoomImage(slug: string, newImageUrl: string): Room | null {
  const rooms = getStoredRooms();
  const index = rooms.findIndex((r) => r.slug === slug);
  if (index === -1) return null;

  rooms[index] = {
    ...rooms[index],
    image: newImageUrl,
    heroImage: newImageUrl,
    gallery: [newImageUrl, ...(rooms[index].gallery || [])],
  };
  saveStoredRooms(rooms);
  return rooms[index];
}

export function addStoredRoom(room: Room): Room {
  const rooms = getStoredRooms();
  const existing = rooms.findIndex((r) => r.slug === room.slug);
  if (existing >= 0) {
    rooms[existing] = room;
  } else {
    rooms.push(room);
  }
  saveStoredRooms(rooms);
  return room;
}

// -------------------------------------------------------------
// BLOG POSTS PERSISTENCE
// -------------------------------------------------------------

export function getStoredPosts(): Post[] {
  ensureDirectoryExists();
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(initialPosts, null, 2), "utf-8");
    return initialPosts;
  }

  try {
    const raw = fs.readFileSync(POSTS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as Post[]) : initialPosts;
  } catch (error) {
    console.error("[Store] Error reading posts.json, falling back to initial posts:", error);
    return initialPosts;
  }
}

export function saveStoredPosts(posts: Post[]): void {
  ensureDirectoryExists();
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), "utf-8");
  try {
    revalidatePath("/", "layout");
    revalidatePath("/blog");
  } catch {
    // No-op if outside request context
  }
}

export function addStoredPost(post: Post): Post {
  const posts = getStoredPosts();
  // Prepend to show at the top of the blog list
  const filtered = posts.filter((p) => p.slug !== post.slug);
  const updated = [post, ...filtered];
  saveStoredPosts(updated);
  return post;
}

export function deleteStoredPost(slug: string): boolean {
  const posts = getStoredPosts();
  const updated = posts.filter((p) => p.slug !== slug);
  if (updated.length === posts.length) return false;
  saveStoredPosts(updated);
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

export function getStoredBookings(): StoredBooking[] {
  ensureDirectoryExists();
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2), "utf-8");
    return [];
  }

  try {
    const raw = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as StoredBooking[]) : [];
  } catch (error) {
    console.error("[Store] Error reading bookings.json:", error);
    return [];
  }
}

export function saveStoredBookings(bookings: StoredBooking[]): void {
  ensureDirectoryExists();
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf-8");
}

function getLagosDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

/**
 * Checks whether a room is free for a given date range.
 * Returns { available: boolean, conflictingBooking?: StoredBooking }
 */
export function checkRoomAvailability(
  roomSlug: string,
  checkIn: string,
  checkOut: string,
  excludeReference?: string,
): { available: boolean; conflictingBooking?: StoredBooking } {
  const bookings = getStoredBookings();
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
export function getBookedRangesForRoom(roomSlug: string): { checkIn: string; checkOut: string; reference: string }[] {
  const bookings = getStoredBookings();
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
export function recordBooking(booking: StoredBooking): boolean {
  const bookings = getStoredBookings();
  const existingIdx = bookings.findIndex((b) => b.reference === booking.reference);

  if (existingIdx >= 0) {
    bookings[existingIdx] = {
      ...booking,
      actualCheckOut: bookings[existingIdx].actualCheckOut,
      checkedOutAt: bookings[existingIdx].checkedOutAt,
    };
    saveStoredBookings(bookings);
    return false;
  } else {
    bookings.push(booking);
    saveStoredBookings(bookings);
    return true;
  }
}

export function markBookingCheckedOut(reference: string): {
  ok: boolean;
  message: string;
  booking?: StoredBooking;
} {
  const bookings = getStoredBookings();
  const booking = bookings.find((item) => item.reference === reference);
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
  saveStoredBookings(bookings);
  return { ok: true, message: "Early checkout recorded.", booking };
}

/**
 * Manually blocks room dates (e.g. offline walk-in guest or maintenance).
 */
export function blockRoomDates(
  roomSlug: string,
  roomName: string,
  checkIn: string,
  checkOut: string,
  reason = "Reserved / Maintenance",
): { ok: boolean; message: string; booking?: StoredBooking } {
  const availability = checkRoomAvailability(roomSlug, checkIn, checkOut);
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

  recordBooking(blockRecord);
  return { ok: true, message: "Dates successfully blocked.", booking: blockRecord };
}

/**
 * Releases or cancels a booking.
 */
export function cancelStoredBooking(reference: string): boolean {
  const bookings = getStoredBookings();
  const target = bookings.find((b) => b.reference === reference);
  if (!target) return false;

  target.status = "cancelled";
  saveStoredBookings(bookings);
  return true;
}
