# 🚀 Deploy Print3D Studio to Vercel

This guide will help you deploy your Print3D Studio e-commerce website to Vercel through GitHub.

---

## 📋 Prerequisites

Before you start, make sure you have:
- ✅ A GitHub account ([Sign up here](https://github.com/signup))
- ✅ A Vercel account ([Sign up here](https://vercel.com/signup))
- ✅ Git installed on your computer ([Download here](https://git-scm.com/downloads))
- ✅ Your Firebase project is set up and configured

---

## 🔥 Step 1: Verify Firebase Configuration

**IMPORTANT:** Your Firebase credentials are currently in `firebase-config.js`. For security:

1. ✅ Make sure your Firebase project has proper security rules set up
2. ✅ Enable authentication methods in Firebase Console
3. ✅ Set up Firestore database rules
4. ✅ Configure Firebase Storage rules (as discussed earlier)

**Recommended Firebase Security Rules:**

### Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - Anyone can read, only authenticated users can write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders - Anyone can create, only authenticated admins can read/update
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    
    // Customers - Anyone can create, only authenticated admins can read
    match /customers/{customerId} {
      allow create: if true;
      allow read: if request.auth != null;
    }
    
    // Contact Inquiries - Anyone can create, only authenticated admins can read
    match /contact_inquiries/{inquiryId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    
    // Settings - Anyone can read, only authenticated admins can write
    match /settings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📦 Step 2: Initialize Git Repository

Open PowerShell in your project folder and run:

```powershell
# Navigate to your project folder
cd "C:\Users\PC\Desktop\New folder\ecommerce"

# Initialize Git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Print3D Studio E-commerce"
```

---

## 🌐 Step 3: Create GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in the details:
   - **Repository name:** `print3d-studio` (or any name you prefer)
   - **Description:** "3D Printing E-commerce Website"
   - **Visibility:** Choose **Public** or **Private**
   - ❌ **DO NOT** initialize with README (you already have one)
4. Click **"Create repository"**

---

## 📤 Step 4: Push Code to GitHub

After creating the repository, GitHub will show you commands. Run these in PowerShell:

```powershell
# Add GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/print3d-studio.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

---

## 🚀 Step 5: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel](https://vercel.com) and log in
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select **"Import from GitHub"** (authorize if needed)
5. Find and select your **`print3d-studio`** repository
6. Configure project:
   - **Framework Preset:** Select **"Other"** (it's a static site)
   - **Root Directory:** Leave as `.` (root)
   - **Build Command:** Leave empty (no build needed)
   - **Output Directory:** Leave empty
7. Click **"Deploy"**

🎉 **Your site will be live in 1-2 minutes!**

### Option B: Deploy via Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts, then deploy to production
vercel --prod
```

---

## 🔧 Step 6: Post-Deployment Configuration

### Update Admin Email (Important!)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → **Authentication** → **Users**
3. Click **"Add user"** and create an admin account:
   - **Email:** Your admin email (e.g., `admin@yourdomain.com`)
   - **Password:** Strong password
4. Save this email/password - you'll use it to log into the admin panel

### Test Your Deployment

1. **Customer Site:** `https://your-project.vercel.app`
2. **Admin Panel:** `https://your-project.vercel.app/admin.html`
3. **Test the following:**
   - ✅ Browse products
   - ✅ Add items to cart
   - ✅ Track orders
   - ✅ View gallery
   - ✅ Submit contact form
   - ✅ Login to admin panel
   - ✅ Add/edit products
   - ✅ Upload images
   - ✅ Change settings

---

## 🔄 Updating Your Live Site

Whenever you make changes:

```powershell
# Add changes
git add .

# Commit with a message
git commit -m "Description of your changes"

# Push to GitHub
git push

# Vercel will automatically redeploy! 🎉
```

---

## 🌍 Custom Domain Setup (Optional)

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `print3dstudio.com`)
4. Follow Vercel's instructions to update your DNS settings
5. Wait for DNS propagation (24-48 hours)

---

## 📱 Environment Variables (If Needed Later)

If you want to move Firebase config to environment variables:

1. In Vercel dashboard → **Settings** → **Environment Variables**
2. Add these variables:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - etc.
3. Update `firebase-config.js` to use `process.env.VARIABLE_NAME`

---

## 🛠️ Troubleshooting

### Problem: "Module not found" errors
**Solution:** Make sure all file references use relative paths (e.g., `./script.js` not `/script.js`)

### Problem: Firebase errors on deployed site
**Solution:** 
- Check Firebase security rules are properly set
- Verify Firebase config in `firebase-config.js`
- Check browser console for specific error messages

### Problem: Admin login not working
**Solution:**
- Create admin user in Firebase Authentication
- Check Firebase Authentication is enabled
- Verify email/password authentication method is enabled

### Problem: Images not uploading
**Solution:**
- Check Firebase Storage rules (see Step 1)
- Verify Storage is enabled in Firebase Console

### Problem: Contact form not saving
**Solution:**
- Check Firestore rules allow creating `contact_inquiries`
- Verify Firestore database exists

---

## 📞 Need Help?

- **Vercel Documentation:** https://vercel.com/docs
- **Firebase Documentation:** https://firebase.google.com/docs
- **GitHub Documentation:** https://docs.github.com

---

## 🎉 Congratulations!

Your Print3D Studio e-commerce website is now live on the internet! 🚀

**Share your live URL:**
- `https://your-project.vercel.app`

**Key URLs:**
- **Store:** `https://your-project.vercel.app`
- **Admin Panel:** `https://your-project.vercel.app/admin.html`
- **Track Orders:** `https://your-project.vercel.app#track-order`
- **Gallery:** `https://your-project.vercel.app#gallery`
- **Contact:** `https://your-project.vercel.app#contact`

---

## 📝 Quick Reference Commands

```powershell
# Check Git status
git status

# View commit history
git log --oneline

# Pull latest changes from GitHub
git pull

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main

# Merge branch
git merge feature-name
```

---

**Last Updated:** March 2, 2026
**Version:** 1.0.0
