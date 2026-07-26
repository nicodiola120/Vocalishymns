package com.choralis.app.plugins.wifishare;

import android.content.Context;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.util.Log;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;

public class NsdHelper {
    private static final String TAG = "ChoralisNsd";
    private static final String SERVICE_TYPE = "_choralis._tcp.";

    private Context context;
    private NsdManager nsdManager;
    private NsdManager.RegistrationListener registrationListener;
    private NsdManager.DiscoveryListener discoveryListener;
    private NsdManager.ResolveListener resolveListener;
    private boolean registered = false;
    private boolean discovering = false;
    private int port;
    private String serviceName;
    private String deviceId;

    private ConcurrentHashMap<String, DiscoveredPeer> peers = new ConcurrentHashMap<>();
    private Callback callback;

    public static class DiscoveredPeer {
        public String id;
        public String name;
        public String ip;
        public int port;

        public DiscoveredPeer(String id, String name, String ip, int port) {
            this.id = id;
            this.name = name;
            this.ip = ip;
            this.port = port;
        }
    }

    public interface Callback {
        void onPeerFound(DiscoveredPeer peer);
        void onPeerLost(String peerId);
        void onError(String message);
    }

    public NsdHelper(Context context, int port, String serviceName, String deviceId, Callback callback) {
        this.context = context;
        this.port = port;
        this.serviceName = serviceName;
        this.deviceId = deviceId;
        this.callback = callback;
        this.nsdManager = (NsdManager) context.getSystemService(Context.NSD_SERVICE);
    }

    public void start() {
        registerService();
        discoverServices();
    }

    public void stop() {
        unregisterService();
        stopDiscovery();
    }

    public DiscoveredPeer[] getPeers() {
        return peers.values().toArray(new DiscoveredPeer[0]);
    }

    private void registerService() {
        if (registered) return;
        try {
            NsdServiceInfo serviceInfo = new NsdServiceInfo();
            serviceInfo.setServiceName(serviceName + " (" + deviceId.substring(0, 6) + ")");
            serviceInfo.setServiceType(SERVICE_TYPE);
            serviceInfo.setPort(port);

            registrationListener = new NsdManager.RegistrationListener() {
                @Override
                public void onServiceRegistered(NsdServiceInfo info) {
                    registered = true;
                    Log.d(TAG, "Service registered: " + info.getServiceName());
                }

                @Override
                public void onRegistrationFailed(NsdServiceInfo info, int errorCode) {
                    Log.e(TAG, "Registration failed: " + errorCode);
                    if (callback != null) callback.onError("NSD registration failed: " + errorCode);
                }

                @Override
                public void onServiceUnregistered(NsdServiceInfo info) {
                    registered = false;
                    Log.d(TAG, "Service unregistered");
                }

                @Override
                public void onUnregistrationFailed(NsdServiceInfo info, int errorCode) {
                    Log.e(TAG, "Unregistration failed: " + errorCode);
                }
            };

            nsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, registrationListener);
        } catch (Exception e) {
            if (callback != null) callback.onError("Register error: " + e.getMessage());
        }
    }

    private void unregisterService() {
        if (!registered || registrationListener == null) return;
        try {
            nsdManager.unregisterService(registrationListener);
        } catch (Exception ignored) {}
        registered = false;
    }

    private void discoverServices() {
        if (discovering) return;
        try {
            discoveryListener = new NsdManager.DiscoveryListener() {
                @Override
                public void onStartDiscoveryFailed(String serviceType, int errorCode) {
                    Log.e(TAG, "Discovery start failed: " + errorCode);
                    if (callback != null) callback.onError("Discovery start failed: " + errorCode);
                }

                @Override
                public void onStopDiscoveryFailed(String serviceType, int errorCode) {
                    Log.e(TAG, "Discovery stop failed: " + errorCode);
                }

                @Override
                public void onDiscoveryStarted(String serviceType) {
                    discovering = true;
                    Log.d(TAG, "Discovery started: " + serviceType);
                }

                @Override
                public void onDiscoveryStopped(String serviceType) {
                    discovering = false;
                    Log.d(TAG, "Discovery stopped");
                }

                @Override
                public void onServiceFound(NsdServiceInfo serviceInfo) {
                    Log.d(TAG, "Service found: " + serviceInfo.getServiceName());
                    resolveService(serviceInfo);
                }

                @Override
                public void onServiceLost(NsdServiceInfo serviceInfo) {
                    Log.d(TAG, "Service lost: " + serviceInfo.getServiceName());
                    String serviceName = serviceInfo.getServiceName();
                    for (DiscoveredPeer peer : peers.values()) {
                        if (serviceName.contains(peer.id.substring(0, 6))) {
                            peers.remove(peer.id);
                            if (callback != null) callback.onPeerLost(peer.id);
                            break;
                        }
                    }
                }
            };

            nsdManager.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, discoveryListener);
        } catch (Exception e) {
            if (callback != null) callback.onError("Discover error: " + e.getMessage());
        }
    }

    private void stopDiscovery() {
        if (!discovering || discoveryListener == null) return;
        try {
            nsdManager.stopServiceDiscovery(discoveryListener);
        } catch (Exception ignored) {}
        discovering = false;
    }

    private void resolveService(NsdServiceInfo serviceInfo) {
        try {
            resolveListener = new NsdManager.ResolveListener() {
                @Override
                public void onResolveFailed(NsdServiceInfo info, int errorCode) {
                    Log.e(TAG, "Resolve failed: " + errorCode);
                }

                @Override
                public void onServiceResolved(NsdServiceInfo info) {
                    Log.d(TAG, "Resolved: " + info.getServiceName() + " -> " +
                        info.getHost().getHostAddress() + ":" + info.getPort());

                    if (info.getHost() == null) return;

                    String ip = info.getHost().getHostAddress();
                    int resolvedPort = info.getPort();
                    String resolvedName = info.getServiceName();

                    String peerId = "peer_" + ip.replace(".", "_") + "_" + resolvedPort;

                    if (peers.containsKey(peerId)) return;

                    if (ip.equals(getLocalIpAddress()) && resolvedPort == port) return;

                    DiscoveredPeer peer = new DiscoveredPeer(peerId, resolvedName, ip, resolvedPort);
                    peers.put(peerId, peer);
                    if (callback != null) callback.onPeerFound(peer);
                }
            };

            nsdManager.resolveService(serviceInfo, resolveListener);
        } catch (Exception e) {
            Log.e(TAG, "Resolve error: " + e.getMessage());
        }
    }

    private String getLocalIpAddress() {
        try {
            for (NetworkInterface iface : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                for (InetAddress addr : Collections.list(iface.getInetAddresses())) {
                    if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {}
        return "127.0.0.1";
    }
}
