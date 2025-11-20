package com.ptit.social

import android.app.Application
import com.ptit.social.data.local.PreferenceManager

class PTITSocialApp : Application() {

    companion object {
        lateinit var instance: PTITSocialApp
            private set
    }

    lateinit var preferenceManager: PreferenceManager

    override fun onCreate() {
        super.onCreate()
        instance = this
        preferenceManager = PreferenceManager(this)
    }
}
