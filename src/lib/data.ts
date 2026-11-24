import { getStoredRooms, getStoredPosts } from "./server/store";

export async function getRooms() {
  return getStoredRooms();
}

export async function getRoom(slug: string) {
  const rooms = await getStoredRooms();
  return rooms.find((r) => r.slug === slug) ?? null;
}

export async function getPosts() {
  const posts = await getStoredPosts();
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string) {
  const posts = await getStoredPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}
