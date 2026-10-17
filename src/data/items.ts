export interface StarterItem {
  name: string;
  description: string;
  location: string;
  dateLost: string;
  status: "lost" | "found" | "claimed";
}

export const starterItems: StarterItem[] = [
  {
    name: "Pink Umbrella",
    description: "Left in the Library",
    location: "Library",
    dateLost: "2026-08-01T09:00:00.000Z",
    status: "lost",
  },
  {
    name: "Blue Water Bottle",
    description: "Found near the Gym",
    location: "Gym",
    dateLost: "2026-08-02T10:00:00.000Z",
    status: "found",
  },
];
