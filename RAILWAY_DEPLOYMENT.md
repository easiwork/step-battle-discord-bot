# 🚂 Railway Deployment Guide

This guide will help you deploy the Step Battle Discord Bot to Railway.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your bot code should be on GitHub
3. **Discord Bot Token**: From Discord Developer Portal
4. **Discord Client ID**: From Discord Developer Portal

## 🚀 Deployment Steps

### Step 1: Connect to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `step-battle-discord-bot` repository
5. Railway will automatically detect the project

### Step 2: Add Volume Service (for Database Persistence)

1. In your Railway project dashboard, click "New Service"
2. Select "Volume"
3. Name it `database-volume`
4. Railway will create a persistent storage location

### Step 3: Configure Environment Variables

In your Railway project dashboard, go to the "Variables" tab and add:

```bash
# Discord Bot Configuration
DISCORD_TOKEN=your_actual_discord_bot_token
DISCORD_CLIENT_ID=your_actual_discord_client_id

# Webhook Configuration
WEBHOOK_SECRET=your_secure_webhook_secret_key
PORT=8080

# Database Configuration (Railway Volume)
DATABASE_PATH=/data/step-battle.db
```

### Step 4: Configure Volume Mount

1. In your main service settings, go to "Settings" tab
2. Under "Volumes", add a new volume mount:
   - **Volume**: `database-volume`
   - **Mount Path**: `/data`

### Step 5: Deploy

1. Railway will automatically deploy when you push to your main branch
2. Or click "Deploy" in the Railway dashboard
3. Monitor the deployment logs for any issues

## 🔗 Update Discord Webhook URL

Once deployed, Railway will provide a public URL like:
```
https://your-app-name.railway.app
```

Update your Apple Shortcuts to use:
```
https://your-app-name.railway.app/webhook
```

## 📊 Monitoring

### Health Check
Railway will automatically monitor the health endpoint:
```
https://your-app-name.railway.app/health
```

### Logs
- View real-time logs in Railway dashboard
- Monitor bot activity and webhook requests
- Check for any errors or issues

## 🔧 Troubleshooting

### Common Issues

**1. Bot not starting**
- Check environment variables are set correctly
- Verify Discord token and client ID
- Check deployment logs for errors

**2. Database not persisting**
- Ensure volume is properly mounted to `/data`
- Check `DATABASE_PATH` is set to `/data/step-battle.db`

**3. Webhook not working**
- Verify `WEBHOOK_SECRET` is set correctly
- Check `PORT` environment variable is set to 8080
- Check the webhook URL is updated in Apple Shortcuts
- Monitor webhook logs in Railway dashboard

**4. Bot commands not working**
- Ensure bot has proper Discord permissions
- Check if bot is online in Discord
- Verify slash commands are registered

### Useful Commands

```bash
# Check Railway CLI (if installed)
railway status
railway logs
railway variables
```

## 💰 Cost Considerations

- **Railway Free Tier**: Limited usage per month
- **Volume Storage**: Small cost for persistent storage
- **Bandwidth**: Minimal for Discord bot usage

## 🔄 Auto-Deployment

Railway automatically deploys when you:
- Push to the `main` branch
- Make changes in Railway dashboard

## 📱 Update Apple Shortcuts

After deployment, update your Apple Shortcuts:

1. Open Shortcuts app
2. Edit your step submission shortcut
3. Update the webhook URL to your Railway URL
4. Test the shortcut to ensure it works

## 🎯 Next Steps

1. **Test the deployment** - Try the `/leaderboard` command
2. **Test webhook** - Submit steps via Apple Shortcuts
3. **Monitor logs** - Ensure everything is working
4. **Set up alerts** - Configure Railway notifications if needed

## 🆘 Support

If you encounter issues:
1. Check Railway deployment logs
2. Verify all environment variables
3. Test webhook endpoint manually
4. Check Discord bot permissions 