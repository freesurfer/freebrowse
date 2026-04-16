const ADJECTIVES = [
  "Fantastic", "Bold", "Brave", "Calm", "Clever", "Curious", "Dapper",
  "Eager", "Fierce", "Gentle", "Happy", "Jolly", "Kind", "Lively",
  "Merry", "Noble", "Playful", "Proud", "Quick", "Quiet", "Radiant",
  "Silly", "Spry", "Sunny", "Swift", "Tidy", "Tiny", "Vivid",
  "Witty", "Wise", "Zany", "Zesty", "Amber", "Cosmic", "Dusty",
  "Golden", "Misty", "Nimble", "Plucky", "Steady",
];

const ANIMALS = [
  "Pony", "Badger", "Beaver", "Bison", "Cheetah", "Dolphin", "Eagle",
  "Ferret", "Finch", "Fox", "Gecko", "Giraffe", "Hawk", "Hedgehog",
  "Heron", "Jaguar", "Koala", "Lemur", "Lynx", "Magpie", "Mongoose",
  "Narwhal", "Newt", "Octopus", "Osprey", "Otter", "Panda", "Penguin",
  "Pelican", "Puffin", "Raccoon", "Raven", "Rhino", "Salmon", "Seal",
  "Sloth", "Stoat", "Tapir", "Tiger", "Walrus",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomSessionName(): string {
  return `${pick(ADJECTIVES)}${pick(ANIMALS)}`;
}
