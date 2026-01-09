# Add project specific ProGuard rules here.
# By default, the flags in this file are applied to production builds only.
#
# You can find general ProGuard rules for popular libraries at
# https://www.guardsquare.com/en/products/proguard/manual/examples

# Capacitor
-keep class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin
