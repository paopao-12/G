package com.anonymous.DavaoCommuterGuideNew

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {
    private val mReactNativeHost: ReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport() = BuildConfig.DEBUG
        override fun getPackages(): List<ReactPackage> = PackageList(this).packages
        override fun getJSMainModuleName() = "index"
    }

    override val reactNativeHost: ReactNativeHost
        get() = mReactNativeHost

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
    }
}