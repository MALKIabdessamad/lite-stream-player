#!/bin/bash
#
# IPLAY - Full Android APK Build Script for a fresh Ubuntu VPS
# Run: chmod +x build-android.sh && ./build-android.sh
#
set -e

echo "============================================"
echo "  IPLAY - Android APK Builder"
echo "============================================"

# ---- 1. Install system dependencies ----
echo ""
echo "[1/8] Installing system dependencies..."
sudo apt update -y
sudo apt install -y curl git unzip wget openjdk-17-jdk-headless

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
echo "export JAVA_HOME=$JAVA_HOME" >> ~/.bashrc

# ---- 2. Install Node.js 20 ----
echo ""
echo "[2/8] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

# ---- 3. Install Android SDK (command-line tools only, no Android Studio) ----
echo ""
echo "[3/8] Setting up Android SDK..."
export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0

echo "export ANDROID_HOME=$ANDROID_HOME" >> ~/.bashrc
echo "export ANDROID_SDK_ROOT=$ANDROID_HOME" >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0' >> ~/.bashrc

if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
  mkdir -p $ANDROID_HOME/cmdline-tools
  cd $ANDROID_HOME/cmdline-tools
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O tools.zip
  unzip -q tools.zip
  mv cmdline-tools latest
  rm tools.zip
  cd -
fi

yes | sdkmanager --licenses > /dev/null 2>&1 || true
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" > /dev/null 2>&1

echo "Android SDK ready."

# ---- 4. Clone and install project ----
echo ""
echo "[4/8] Setting up project..."
if [ ! -f "package.json" ]; then
  echo "ERROR: Run this script from the project root directory!"
  echo "  git clone <your-repo-url> iplay && cd iplay && ./build-android.sh"
  exit 1
fi
npm install

# ---- 5. Add Android platform ----
echo ""
echo "[5/8] Adding Capacitor Android platform..."
npx cap add android 2>/dev/null || echo "Android platform already exists"

# ---- 6. Patch AndroidManifest.xml ----
echo ""
echo "[6/8] Patching AndroidManifest.xml..."
MANIFEST="android/app/src/main/AndroidManifest.xml"

# Add INTERNET permission if missing
if ! grep -q "android.permission.INTERNET" "$MANIFEST"; then
  sed -i 's|<application|<uses-permission android:name="android.permission.INTERNET" />\n    <application|' "$MANIFEST"
fi

# Add intent-filter for external player mode (video/*)
if ! grep -q "android.intent.action.VIEW" "$MANIFEST"; then
  # Insert intent-filter inside the main activity
  sed -i '/<activity/,/<\/activity>/ {
    /<\/activity>/i\
            <intent-filter>\
                <action android:name="android.intent.action.VIEW" />\
                <category android:name="android.intent.category.DEFAULT" />\
                <category android:name="android.intent.category.BROWSABLE" />\
                <data android:mimeType="video/*" />\
            </intent-filter>
  }' "$MANIFEST"
fi

# Add AdMob meta-data (required for admob plugin)
if ! grep -q "com.google.android.gms.ads.APPLICATION_ID" "$MANIFEST"; then
  sed -i 's|</application>|        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-3940256099942544~3347511713" />\n    </application>|' "$MANIFEST"
fi

echo "AndroidManifest.xml patched."

# ---- 7. Enable R8/ProGuard for release builds ----
echo ""
echo "[7/8] Enabling ProGuard/R8..."
GRADLE_FILE="android/app/build.gradle"

# Enable minification in release build type
if grep -q "minifyEnabled false" "$GRADLE_FILE"; then
  sed -i 's/minifyEnabled false/minifyEnabled true/' "$GRADLE_FILE"
  echo "ProGuard/R8 enabled."
else
  echo "ProGuard already configured."
fi

# ---- 8. Build the APK ----
echo ""
echo "[8/8] Building APK..."
npm run build
npx cap sync android

cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon

echo ""
echo "============================================"
echo "  BUILD COMPLETE!"
echo "============================================"
echo ""
echo "  Debug APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "  To build a signed RELEASE APK:"
echo "    1. Generate keystore:"
echo "       keytool -genkey -v -keystore iplay.keystore -alias iplay -keyalg RSA -keysize 2048 -validity 10000"
echo "    2. Build:"
echo "       cd android && ./gradlew assembleRelease"
echo ""
echo "  APK size should be lightweight thanks to R8 code shrinking."
echo "============================================"
