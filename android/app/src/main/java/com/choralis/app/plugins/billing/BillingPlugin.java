package com.choralis.app.plugins.billing;

import android.app.Activity;
import android.content.Context;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "Billing")
public class BillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;

    @Override
    public void load() {
        Context ctx = getContext();
        billingClient = BillingClient.newBuilder(ctx)
                .setListener(this)
                .enablePendingPurchases()
                .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    notifyListeners("billingReady", new JSObject());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {}
        });
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ready", billingClient != null && billingClient.isReady());
        call.resolve(ret);
    }

    @PluginMethod
    public void purchaseRemoveAds(PluginCall call) {
        if (billingClient == null || !billingClient.isReady()) {
            call.reject("Billing not ready");
            return;
        }

        pendingPurchaseCall = call;

        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        products.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId("remove_ads")
                .setProductType(BillingClient.ProductType.INAPP)
                .build());

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(products)
                .build();

        billingClient.queryProductDetailsAsync(params, (result, productDetailsList) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || productDetailsList.isEmpty()) {
                call.reject("Product not found. Make sure 'remove_ads' is configured in Play Console.");
                return;
            }

            ProductDetails productDetails = productDetailsList.get(0);

            Activity activity = getActivity();
            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(
                            BillingFlowParams.ProductDetailsParams.newBuilder()
                                    .setProductDetails(productDetails)
                                    .build()
                    ))
                    .build();

            billingClient.launchBillingFlow(activity, flowParams);
        });
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        if (billingClient == null || !billingClient.isReady()) {
            call.reject("Billing not ready");
            return;
        }

        billingClient.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder()
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build(),
                (result, purchasesList) -> {
                    if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                        call.reject("Failed to query purchases");
                        return;
                    }

                    boolean found = false;
                    for (Purchase purchase : purchasesList) {
                        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            found = true;
                            break;
                        }
                    }

                    JSObject ret = new JSObject();
                    ret.put("purchased", found);
                    call.resolve(ret);
                }
        );
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    if (pendingPurchaseCall != null) {
                        JSObject ret = new JSObject();
                        ret.put("purchased", true);
                        ret.put("purchaseToken", purchase.getPurchaseToken());
                        pendingPurchaseCall.resolve(ret);
                        pendingPurchaseCall = null;
                    }
                    notifyListeners("purchaseSuccess", new JSObject());
                }
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Purchase cancelled by user");
                pendingPurchaseCall = null;
            }
        } else {
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Purchase failed: " + billingResult.getDebugMessage());
                pendingPurchaseCall = null;
            }
        }
    }
}
