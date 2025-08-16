#!/bin/bash

# Frontend Build Script for Static Export
# Run this to build your frontend for FTP upload

echo "🚀 Building frontend for static hosting..."

# Check if environment file exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Creating .env.local file..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://firenzebeauty.com.ar
EOF
    echo "📝 Please edit .env.local with your actual API URL before building"
    exit 1
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next
rm -rf out

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application for static export
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "out" ]; then
    echo "❌ Build failed! The 'out' directory was not created."
    exit 1
fi

# Create .htaccess for clean URLs and security
echo "📄 Creating .htaccess file..."
cat > out/.htaccess << EOF
# Enable clean URLs for Next.js
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^([^.]+)$ \$1.html [NC,L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Caching for performance
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
</IfModule>
EOF

echo "✅ Frontend build complete!"
echo ""
echo "📁 Your static files are ready in the 'out' directory:"
echo "   📂 $(pwd)/out/"
echo ""
echo "📡 Next steps:"
echo "   1. Upload all files from the 'out' directory to your web hosting"
echo "   2. Make sure to upload the .htaccess file for clean URLs"
echo "   3. Point your domain to the uploaded files"
echo ""
echo "💡 FTP Upload tips:"
echo "   - Upload the entire contents of the 'out' folder to your public_html (or www/htdocs)"
echo "   - Ensure .htaccess is uploaded and placed in the root directory"
echo "   - Test your site after upload to verify everything works" 