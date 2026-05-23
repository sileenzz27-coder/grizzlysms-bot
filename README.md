# GrizzlySMS Discord Bot

## Overview
Discord bot that provides temporary USA phone numbers via GrizzlySMS API for Instagram verification. Users request numbers privately, automatically receive SMS codes when they arrive, and can complete or cancel activations.

## Features
- **Persistent Setup Button** - Admin posts button once, users access anytime
- **Ephemeral Messages** - All interactions private to requesting user
- **Auto SMS Polling** - Bot checks for codes every 10 seconds (up to 10 minutes)
- **Admin Logging** - All activity logged to designated admin channel
- **2-Minute Wait** - Grizzly requires 2 minutes before cancellation is allowed

## Setup

### 1. Install Dependencies
```bash
cd "/Users/silenz/Documents/OFM/BOTS/GrizzlyBot"
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in:
```
DISCORD_TOKEN=your_discord_token
GRIZZLY_API_KEY=c91bbb82210b0219ae13741a7186e7be
ADMIN_LOG_CHANNEL_ID=channel_id_where_logs_appear
ALLOWED_ROLE_ID=not_required_removed_for_testing
```

Get tokens from:
- **Discord Token**: Discord Developer Portal → Applications → Copy Token
- **Admin Channel ID**: Right-click channel in Discord → Copy Channel ID

### 3. Start Bot
```bash
node index.js
```

Bot should appear online and register slash commands.

## Commands

### `/setup`
- **Admin Only**: Posts persistent "📱 Get a Number" button in current channel
- Button automatically pins the message
- Users can click button anytime to request a number

### `/getnumber`
- **Slash Command**: Alternative to button (same functionality)
- Requests temporary USA phone number from GrizzlySMS
- Private ephemeral response only visible to user

## Workflow

### User Flow
1. **Click "Get a Number"** button (from `/setup`)
2. **Receive number** in private message (format: `+1XXXXXXXXXX`)
3. **Enter number on Instagram** for verification
4. **Wait for SMS** - Code arrives automatically (max 10 minutes)
5. **Click "Complete"** when code received to mark activation as used
6. **Or click "Cancel"** after 2 minutes to release number

### Admin Logs
All activity logged to admin channel:
- 📱 User requested number
- 💬 Code received
- ✅ Registration completed
- ❌ Number cancelled
- ⏰ Request timed out

## API Integration

### Grizzly SMS
- **Base URL**: `https://api.grizzlysms.com/stubs/handler_api.php`
- **Service**: Instagram (ig)
- **Country**: USA (187)
- **Polling**: Every 10 seconds, max 60 attempts (10 minutes)

Status codes:
- `STATUS_WAIT_CODE` - Waiting for SMS
- `STATUS_OK:CODE` - Code received
- `STATUS_CANCEL` - Provider cancelled
- `-1` - User cancelled
- `6` - Activation complete

## Button Behavior

### Cancel Button
- **Enabled from start** but validates 2-minute wait on click
- Before 2 min: Shows countdown message
- After 2 min: Allows cancellation
- Grizzly policy prevents cancellations before 2 minutes

### Complete Button
- Only appears after SMS code arrives
- Marks activation as used with Grizzly
- No time restriction

## File Structure
```
GrizzlyBot/
├── index.js                    # Bot entry point
├── .env                        # Configuration (secrets)
├── .env.example                # Configuration template
├── package.json                # Dependencies
├── README.md                   # This file
└── src/
    ├── commands/
    │   ├── setup.js           # /setup command
    │   └── getnumber.js       # /getnumber command
    ├── handlers/
    │   └── buttonHandler.js   # Button click logic
    └── utils/
        ├── activationStore.js # In-memory activation storage
        ├── grizzlyAPI.js      # Grizzly API wrapper
        ├── polling.js         # SMS polling logic
        └── formatPhone.js     # Phone number formatting
```

## Error Handling

### Common Errors
- **"You do not have permission"** - No role validation (removed for testing)
- **"Activation not found"** - Activation expired or never existed
- **"No numbers available"** - Grizzly out of stock for that country
- **"Insufficient balance"** - Account has no balance

### Rate Limiting
- Grizzly may throttle rapid requests
- Discord rate-limits message edits (max ~10 per 10 seconds)
- Wait 30+ seconds between number requests if getting "No numbers" errors

## Troubleshooting

### Bot Won't Start
```bash
# Check token is valid
# Check Node.js version: node --version (needs v18+)
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
node index.js
```

### Numbers Not Arriving
- Check Grizzly API key is correct
- Verify country code is 187 (USA)
- Check service is "ig" (Instagram)
- Wait up to 10 minutes for SMS

### Buttons Not Working
- Kill bot: `killall -9 node`
- Restart: `node index.js`
- Discord sometimes caches outdated interactions

## Performance Notes
- **Polling**: Every 10 seconds × 60 attempts = 10-minute timeout
- **Storage**: In-memory Map (loses data on restart)
- **Logs**: Posted to Discord channel (no file logging)
- **Concurrent**: Supports multiple simultaneous activations

## Future Improvements
- Persistent storage (database instead of in-memory Map)
- File-based logging + Discord logs
- Role-based access control (currently disabled)
- Customizable polling interval
- Webhook notifications instead of channel logs

## Support
- **Grizzly Docs**: https://grizzlysms.com/api/
- **Discord.js Docs**: https://discord.js.org/
- **Check Bot Logs**: Terminal output + Admin Discord channel

---
**Created**: May 18, 2026  
**Status**: Fully Functional ✅
