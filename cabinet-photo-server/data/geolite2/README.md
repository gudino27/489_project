# MaxMind GeoLite2 Database Setup

This directory contains the MaxMind GeoLite2 database for self-hosted IP geolocation lookups.

## Why Self-Hosted?

- **Privacy Compliance**: No user IP addresses shared with third parties
- **No External API Calls**: Faster, more reliable
- **City-Level Only**: We collect city, region, country (NO precise lat/long)
- **Free**: MaxMind GeoLite2 is free for commercial use

## Setup Instructions

### 1. Create MaxMind Account
Visit: https://www.maxmind.com/en/geolite2/signup
- Sign up for a free account
- Verify your email address

### 2. Download GeoLite2-City Database
1. Log in to your MaxMind account
2. Navigate to: https://www.maxmind.com/en/accounts/current/geoip/downloads
3. Find "GeoLite2 City" in the list
4. Click "Download GZIP" for the binary `.mmdb` format
5. Extract the `.mmdb` file from the archive

### 3. Install Database
Place the extracted file in this directory:
```
cabinet-photo-server/data/geolite2/GeoLite2-City.mmdb
```

The application will automatically detect and load the database on startup.

### 4. Update Schedule
MaxMind releases database updates on the **first Tuesday of each month**.

To keep geolocation accurate:
- Download the latest database monthly
- Replace the existing `GeoLite2-City.mmdb` file
- Restart the application

## Database Location

**Required path**: `./data/geolite2/GeoLite2-City.mmdb`

The application will log warnings if the database is not found and return "Unknown" for all geolocation lookups.

## Testing

After placing the database, restart the server and check logs for:
```
MaxMind GeoLite2 database loaded successfully
```

Test geolocation by:
1. Sending a testimonial link
2. Opening it (triggers geolocation tracking)
3. Check admin panel for city-level location

## Privacy Notes

- Only city, region, and country are collected
- Latitude and longitude are **NOT** stored (privacy compliance)
- No user data is sent to third-party APIs
- Used for fraud prevention and delivery confirmation only

## Troubleshooting

**Error: "MaxMind GeoLite2 database not found"**
- Ensure the file is named exactly: `GeoLite2-City.mmdb`
- Check the file is in the correct directory
- Verify file permissions (should be readable)

**Error: "Error initializing MaxMind reader"**
- Database file may be corrupted - re-download
- Ensure you downloaded the binary `.mmdb` format (not CSV)
- Check file size (should be ~70-80MB)

## License

GeoLite2 databases are distributed under the [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).

This product includes GeoLite2 data created by MaxMind, available from https://www.maxmind.com.
