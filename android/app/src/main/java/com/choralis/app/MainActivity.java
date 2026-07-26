package com.choralis.app;

import com.getcapacitor.BridgeActivity;

import com.choralis.app.plugins.wifishare.WiFiSharePlugin;
import com.choralis.app.plugins.billing.BillingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(WiFiSharePlugin.class);
        registerPlugin(BillingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
