export function getTimezones() {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    return Intl.supportedValuesOf("timeZone");
  }

  return [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "America/Vancouver",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Madrid",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Asia/Singapore",
    "Australia/Sydney",
  ];
}
