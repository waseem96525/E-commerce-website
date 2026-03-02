# 🎨 Print3D Studio - 3D Printing E-Commerce Website

> A modern, full-featured e-commerce platform for custom 3D printed products with Firebase backend, admin panel, and seamless customer experience.

## ✨ Features

### Customer Features
- 🛍️ **Product Catalog** - Browse 3D printed figurines, home decor, and custom prints
- 🛒 **Shopping Cart** - Add to cart with real-time updates
- 💰 **Indian Rupee (₹)** - Fully localized pricing
- 📦 **Order Tracking** - Track orders with Order ID + mobile verification
- 🖼️ **3D Gallery** - Interactive lightbox gallery with uploaded product images
- 📞 **Contact Form** - Direct inquiries with WhatsApp integration
- 💬 **WhatsApp Button** - Floating button for instant customer support
- 📱 **Fully Responsive** - Works perfectly on all devices

### Admin Panel
- 🔐 **Firebase Authentication** - Secure admin login
- ➕ **Product Management** - Add, edit, delete products with image uploads
- 📸 **Image Upload** - Firebase Storage integration for product images and 3D models
- 🎨 **Icon Selector** - 37 emoji icons to choose from
- 📊 **Order Management** - View, update order status, contact customers via WhatsApp
- 👥 **Customer Management** - Track customer data and orders
- ⚙️ **Settings Panel** - Update contact info, working hours, and social media links
- 📈 **Dashboard** - Real-time statistics (products, orders, revenue, customers)

## 🚀 Live Demo

**🌐 Deployed on Vercel:** [Your Live URL Here]

- **Customer Site:** `/`
- **Admin Panel:** `/admin.html`
- **Order Tracking:** `/#track-order`
- **Gallery:** `/#gallery`
- **Contact:** `/#contact`

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript ES6 Modules
- **Backend:** Firebase v12.10.0 (Authentication, Firestore, Storage)
- **Hosting:** Vercel
- **Version Control:** Git & GitHub
- **Development Server:** Node.js HTTP Server
- **Icons:** Font Awesome 6.4.0

## 📦 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/print3d-studio.git
   cd print3d-studio
   ```

2. **Start development server**
   ```bash
   node server.js
   ```
   Or double-click `START-SERVER.bat` on Windows

3. **Open in browser**
   ```
   http://localhost:3000
   ```

### Deploy to Vercel

📖 **Full deployment guide:** See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)

**Quick deploy:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

Or use the **Vercel Dashboard** for zero-config deployment.

## 🔥 Firebase Setup

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
   - Your project: `e-commerce-app-af794`

2. **Enable Firebase Authentication**
   - Go to Authentication → Sign-in method
   - Enable "Email/Password" authentication
   - Create admin user via "Users" tab
     - Email: Your admin email
     - Password: Strong password

3. **Setup Firestore Database**
   - Go to Firestore Database → Create database
   - Start in production mode
   - Choose a location close to your users

4. **Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /products/{productId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       match /orders/{orderId} {
         allow create: if true;
         allow read, update, delete: if request.auth != null;
       }
       match /customers/{customerId} {
         allow create: if true;
         allow read: if request.auth != null;
       }
       match /contact_inquiries/{inquiryId} {
         allow create: if true;
         allow read, update, delete: if request.auth != null;
       }
       match /settings/{settingId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

5. **Firebase Storage Setup**
   - Go to Storage → Get Started
   - Configure security rules:
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

## 📂 Project Structure

```
ecommerce/
├── index.html              # Customer storefront
├── admin.html              # Admin dashboard
├── setup.html              # Firebase setup helper
├── styles.css             # Customer site styles
├── admin.css              # Admin panel styles
├── script.js              # Customer site logic
├── admin.js               # Admin panel logic
├── firebase-config.js     # Firebase SDK configuration
├── server.js              # Local development server
├── package.json           # Node.js configuration
├── vercel.json            # Vercel deployment config
├── .gitignore             # Git ignore rules
├── README.md              # This file
├── DEPLOYMENT-GUIDE.md    # Detailed deployment guide
├── HOW-TO-RUN.md          # Quick start guide
└── START-SERVER.bat       # Windows server launcher
```

## 🎯 Usage Guide

### Admin Panel

1. **Login** → Visit `/admin.html`, use Firebase credentials

2. **Dashboard** → View statistics (products, orders, revenue, customers)

3. **Product Management**
   - Add products with image upload
   - Select emoji icons from visual grid
   - Edit/delete existing products
   - Upload images and 3D model files

4. **Order Management**
   - View all orders with details
   - Update order status
   - Contact customers via WhatsApp

5. **Customer Management**
   - View customer database
   - Track order history

6. **Settings** ⚙️
   - Update contact information
   - Change working hours
   - Edit social media links
   - Modify WhatsApp number

### Customer Site

1. **Browse Products** → Filter by category (All, Figurines, Home Decor, Custom)

2. **Shopping Cart** → Add items, adjust quantities, view total

3. **Checkout** → Enter delivery details, place order

4. **Order Tracking** → Use Order ID + mobile number

5. **Gallery** → View 3D product showcase with lightbox

6. **Contact** → Submit inquiries, get WhatsApp redirect

## 📱 WhatsApp Integration

**Floating Button**: Bottom-right corner for instant chat

**Admin Contact**: Direct customer messaging from order panel

**Contact Form**: Optional WhatsApp redirect after form submission

**Edit Numbers**: Update in Admin Settings panel

## 🌐 Social Media Links

Managed through Admin Settings:
- YouTube Channel
- Instagram Profile  
- Facebook Page
- WhatsApp Business

## 🚀 Deployment

### Local Development

```bash
# Start server
node server.js

# OR double-click
START-SERVER.bat

# Visit
http://localhost:3000
```

### Deploy to Vercel via GitHub

**📖 Complete guide:** [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)

**Quick steps:**

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/print3d-studio.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Deploy (automatic!)

3. **Configure Firebase**
   - Set up authentication
   - Add security rules
   - Create admin user

4. **Test Live Site**
   - Browse products
   - Test cart & checkout
   - Login to admin panel
   - Update settings

**Auto-deploy**: Push to GitHub → Vercel automatically redeploys! 🎉

## 🔐 Security Best Practices

✅ **Use production mode** Firestore rules for live sites

✅ **Create strong passwords** for admin accounts

✅ **Regular backups** of Firestore data

✅ **Monitor Firebase Console** for suspicious activity

✅ **Update dependencies** regularly

✅ **Use HTTPS** (automatic with Vercel)

## 🛠️ Customization

### Change Store Name
- Update `firebase-config.js` comments
- Edit site titles in HTML files
- Modify footer branding

### Add New Features
- All code is modular and well-commented
- Follow existing patterns
- Test locally before deployment

### Styling
- Modify CSS variables in `:root`
- Update colors, fonts, spacing
- Maintain responsive design

## 🐛 Troubleshooting

## 🐛 Troubleshooting

### Products not loading
- Check Firestore rules allow public read
- Verify products collection exists
- Check browser console for errors

### Admin login fails
- Confirm admin user created in Firebase Authentication
- Verify Email/Password method is enabled
- Check credentials are correct

### Images not uploading
- Enable Firebase Storage in console
- Set storage security rules (see Firebase Setup)
- Check file size limits

### Deployment issues
- Verify all files are pushed to GitHub
- Check Vercel build logs
- Ensure Firebase config is correct

### Contact form not working
- Check Firestore rules for contact_inquiries
- Verify collection permissions
- Test internet connection

## 📚 Resources

- **Firebase:** [firebase.google.com/docs](https://firebase.google.com/docs)
- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **GitHub:** [docs.github.com](https://docs.github.com)
- **Font Awesome:** [fontawesome.com](https://fontawesome.com)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🎉 Acknowledgments

- Firebase for backend infrastructure
- Vercel for hosting
- Font Awesome for icons
- The open-source community

---

**Built with ❤️ for Print3D Studio**

**Version:** 1.0.0  
**Last Updated:** March 2, 2026

🌐 **Ready to deploy?** Check [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)

---
