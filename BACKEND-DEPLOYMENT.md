# Backend Deployment Guide

## 🚀 Fix CORS Issues - Redeploy Backend

The CORS changes you made need to be deployed to Render to take effect.

### **Step 1: Go to Render Dashboard**
1. Visit: https://render.com/dashboard
2. Find your service: `clip-flow-529p` (or similar name)

### **Step 2: Manual Deploy**
1. Click on your service
2. Click **"Manual Deploy"** 
3. Select **"Deploy Latest Commit"**
4. Wait for deployment to complete (2-3 minutes)

### **Step 3: Verify CORS Fixed**
After deployment:
1. Visit: https://clip-flow-529p.onrender.com
2. Should see your backend API running
3. Frontend should connect without CORS errors

### **Alternative: Wake Up Backend**
If you don't want to redeploy:
1. Visit: https://clip-flow-529p.onrender.com
2. Wait 30 seconds for service to wake up
3. Try your frontend again

### **Test CORS Fix**
1. Refresh your frontend: http://localhost:5173
2. Try uploading a video
3. No more CORS errors should appear

### **If Still Issues:**
Check Render logs:
1. Go to Render dashboard
2. Click your service
3. Click **"Logs"** tab
4. Look for any error messages

### **Current CORS Configuration:**
```javascript
// Your backend now allows:
- http://localhost:5173 (your dev server)
- http://localhost:3000
- http://localhost:8080
- All Netlify apps (*.netlify.app)
- Custom origins
```

**After redeployment, your ClipFlow app should work perfectly!** 🎬✨
