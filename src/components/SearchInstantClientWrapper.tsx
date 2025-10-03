"use client";
import SearchInstantClient from "./SearchInstantClient";

export default function SearchInstantClientWrapper(
  props: React.ComponentProps<typeof SearchInstantClient>
) {
  return <SearchInstantClient {...props} />;
}
