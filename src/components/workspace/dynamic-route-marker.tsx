import { connection } from "next/server";

/** Marks tenant workspace pages as request-rendered for dynamic metadata. */
export async function DynamicRouteMarker() {
  await connection();
  return null;
}
