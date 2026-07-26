package com.choralis.app.plugins.wifishare;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.UUID;

@CapacitorPlugin(name = "WiFiShare")
public class WiFiSharePlugin extends Plugin {

    private static final String TAG = "WiFiSharePlugin";
    private static final int DEFAULT_PORT = 4876;

    private SimpleHttpServer httpServer;
    private NsdHelper nsdHelper;
    private boolean isRunning = false;
    private String deviceName = "Choralis";
    private String deviceId;

    @Override
    public void load() {
        deviceId = UUID.randomUUID().toString().substring(0, 8);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (isRunning) {
            call.resolve();
            return;
        }

        deviceName = call.getString("deviceName", "Choralis");

        try {
            httpServer = new SimpleHttpServer(DEFAULT_PORT, deviceName, deviceId, new SimpleHttpServer.Callback() {
                @Override
                public void onTransferRequest(String fromDevice, String fromId, String hymnName, byte[] fileData) {
                    String requestId = UUID.randomUUID().toString();
                    String tempDir = getContext().getCacheDir() + "/choralis_transfers/";
                    new File(tempDir).mkdirs();
                    String tempPath = tempDir + requestId + ".zip";
                    try {
                        FileOutputStream fos = new FileOutputStream(tempPath);
                        fos.write(fileData);
                        fos.close();
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to save temp file: " + e.getMessage());
                        return;
                    }

                    JSObject data = new JSObject();
                    data.put("requestId", requestId);
                    data.put("from", fromDevice);
                    data.put("fromId", fromId);
                    data.put("hymnName", hymnName);
                    data.put("filePath", tempPath);
                    new Handler(Looper.getMainLooper()).post(() -> notifyListeners("transferRequest", data));
                }

                @Override
                public void onError(String message) {
                    JSObject data = new JSObject();
                    data.put("message", message);
                    new Handler(Looper.getMainLooper()).post(() -> notifyListeners("serverError", data));
                }
            });
            httpServer.start();

            String localIp = getLocalIpAddress();
            int port = httpServer.getPort();

            nsdHelper = new NsdHelper(getContext(), port, deviceName, deviceId, new NsdHelper.Callback() {
                @Override
                public void onPeerFound(NsdHelper.DiscoveredPeer peer) {
                    JSObject data = new JSObject();
                    data.put("id", peer.id);
                    data.put("name", peer.name);
                    data.put("ip", peer.ip);
                    data.put("port", peer.port);
                    notifyListeners("peerFound", data);
                }

                @Override
                public void onPeerLost(String peerId) {
                    JSObject data = new JSObject();
                    data.put("id", peerId);
                    notifyListeners("peerLost", data);
                }

                @Override
                public void onError(String message) {
                    JSObject data = new JSObject();
                    data.put("message", message);
                    notifyListeners("discoveryError", data);
                }
            });
            nsdHelper.start();

            isRunning = true;

            JSObject result = new JSObject();
            result.put("ip", localIp);
            result.put("port", port);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start: " + e.getMessage());
            call.reject("Failed to start WiFi sharing: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        if (httpServer != null) httpServer.stop();
        if (nsdHelper != null) nsdHelper.stop();
        isRunning = false;
        call.resolve();
    }

    @PluginMethod
    public void getPeers(PluginCall call) {
        if (nsdHelper == null) {
            call.resolve(new JSObject().put("peers", new JSArray()));
            return;
        }
        NsdHelper.DiscoveredPeer[] peers = nsdHelper.getPeers();
        JSArray arr = new JSArray();
        for (NsdHelper.DiscoveredPeer p : peers) {
            JSObject obj = new JSObject();
            obj.put("id", p.id);
            obj.put("name", p.name);
            obj.put("ip", p.ip);
            obj.put("port", p.port);
            arr.put(obj);
        }
        call.resolve(new JSObject().put("peers", arr));
    }

    @PluginMethod
    public void sendFile(PluginCall call) {
        String peerIp = call.getString("peerIp");
        int peerPort = call.getInt("peerPort", DEFAULT_PORT);
        String filePath = call.getString("filePath");
        String hymnName = call.getString("hymnName");

        if (peerIp == null || filePath == null) {
            call.reject("Missing required parameters");
            return;
        }

        try {
            String documentsDir = Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_DOCUMENTS
            ).getAbsolutePath();
            File file = new File(documentsDir, filePath);

            if (!file.exists()) {
                call.reject("File not found: " + file.getAbsolutePath());
                return;
            }

            java.io.FileInputStream fis = new java.io.FileInputStream(file);
            byte[] fileData = new byte[(int) file.length()];
            fis.read(fileData);
            fis.close();

            java.net.Socket socket = new java.net.Socket(peerIp, peerPort);
            socket.setSoTimeout(30000);
            java.io.OutputStream out = socket.getOutputStream();
            java.io.InputStream in = socket.getInputStream();

            String header = "POST /transfer-request HTTP/1.1\r\n" +
                "Host: " + peerIp + ":" + peerPort + "\r\n" +
                "Content-Type: application/octet-stream\r\n" +
                "Content-Length: " + fileData.length + "\r\n" +
                "X-From-Device: " + deviceName + "\r\n" +
                "X-From-Id: " + deviceId + "\r\n" +
                "X-Hymn-Name: " + hymnName + "\r\n" +
                "Connection: close\r\n" +
                "\r\n";

            out.write(header.getBytes("UTF-8"));
            out.write(fileData);
            out.flush();

            StringBuilder response = new StringBuilder();
            byte[] buf = new byte[4096];
            int n;
            while ((n = in.read(buf)) != -1) {
                response.append(new String(buf, 0, n, "UTF-8"));
            }
            socket.close();

            call.resolve(new JSObject().put("status", "sent"));
        } catch (Exception e) {
            Log.e(TAG, "Failed to send file: " + e.getMessage());
            call.reject("Failed to send file: " + e.getMessage());
        }
    }

    @PluginMethod
    public void acceptFile(PluginCall call) {
        String requestId = call.getString("requestId");
        String filePath = call.getString("filePath");
        String hymnName = call.getString("hymnName");

        if (requestId == null || filePath == null) {
            call.reject("Missing parameters");
            return;
        }

        String documentsDir = Environment.getExternalStoragePublicDirectory(
            Environment.DIRECTORY_DOCUMENTS
        ).getAbsolutePath();
        String libraryDir = documentsDir + "/VocalisLibrary/My Hymns/";

        try {
            new File(libraryDir).mkdirs();
            String zipFileName = hymnName.replaceAll("[^a-zA-Z0-9 ]", "")
                .replaceAll("\\s+", "_").toLowerCase() + ".zip";
            String destPath = libraryDir + zipFileName;

            File tempFile = new File(filePath);
            File destFile = new File(destPath);
            if (tempFile.renameTo(destFile)) {
                call.resolve(new JSObject().put("filePath", "VocalisLibrary/My Hymns/" + zipFileName));
            } else {
                java.io.FileInputStream fis = new java.io.FileInputStream(tempFile);
                java.io.FileOutputStream fos = new java.io.FileOutputStream(destFile);
                byte[] buf = new byte[8192];
                int n;
                while ((n = fis.read(buf)) != -1) fos.write(buf, 0, n);
                fis.close();
                fos.close();
                tempFile.delete();
                call.resolve(new JSObject().put("filePath", "VocalisLibrary/My Hymns/" + zipFileName));
            }
        } catch (Exception e) {
            call.reject("Failed to accept file: " + e.getMessage());
        }
    }

    @PluginMethod
    public void declineFile(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath != null) {
            new File(filePath).delete();
        }
        call.resolve();
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
