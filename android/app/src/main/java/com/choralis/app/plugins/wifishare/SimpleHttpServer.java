package com.choralis.app.plugins.wifishare;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SimpleHttpServer {
    private ServerSocket serverSocket;
    private ExecutorService threadPool;
    private boolean running = false;
    private int port;
    private Callback callback;
    private String deviceName;
    private String deviceId;

    public interface Callback {
        void onTransferRequest(String fromDevice, String fromId, String hymnName, byte[] fileData);
        void onError(String message);
    }

    public SimpleHttpServer(int port, String deviceName, String deviceId, Callback callback) {
        this.port = port;
        this.deviceName = deviceName;
        this.deviceId = deviceId;
        this.callback = callback;
    }

    public void start() throws IOException {
        serverSocket = new ServerSocket(port);
        serverSocket.setReuseAddress(true);
        port = serverSocket.getLocalPort();
        running = true;
        threadPool = Executors.newCachedThreadPool();
        new Thread(this::acceptLoop, "http-server-accept").start();
    }

    public void stop() {
        running = false;
        try { serverSocket.close(); } catch (Exception ignored) {}
        if (threadPool != null) threadPool.shutdownNow();
    }

    public int getPort() { return port; }

    private void acceptLoop() {
        while (running) {
            try {
                Socket client = serverSocket.accept();
                threadPool.submit(() -> handleClient(client));
            } catch (IOException e) {
                if (running) {
                    if (callback != null) callback.onError("Server accept error: " + e.getMessage());
                }
            }
        }
    }

    private void handleClient(Socket client) {
        try (
            Socket s = client;
            InputStream in = s.getInputStream();
            OutputStream out = s.getOutputStream()
        ) {
            s.setSoTimeout(30000);
            String requestLine = readLine(in);
            if (requestLine == null || requestLine.isEmpty()) return;

            String[] parts = requestLine.split(" ");
            String method = parts[0];
            String path = parts.length > 1 ? parts[1] : "/";
            Map<String, String> headers = readHeaders(in);

            if (method.equals("GET") && path.equals("/discover")) {
                String body = "{\"name\":\"" + escapeJson(deviceName) + "\",\"id\":\"" + escapeJson(deviceId) + "\"}";
                sendResponse(out, 200, "application/json", body.getBytes(StandardCharsets.UTF_8));
            } else if (method.equals("GET") && path.equals("/health")) {
                sendResponse(out, 200, "text/plain", "OK".getBytes(StandardCharsets.UTF_8));
            } else if (method.equals("POST") && path.equals("/transfer-request")) {
                int contentLength = 0;
                String contentLengthStr = headers.get("content-length");
                if (contentLengthStr != null) contentLength = Integer.parseInt(contentLengthStr);
                String fromDevice = headers.getOrDefault("x-from-device", "Unknown");
                String fromId = headers.getOrDefault("x-from-id", "");
                String hymnName = headers.getOrDefault("x-hymn-name", "Unknown Hymn");

                byte[] fileData = new byte[contentLength];
                int read = 0;
                while (read < contentLength) {
                    int n = in.read(fileData, read, contentLength - read);
                    if (n == -1) break;
                    read += n;
                }

                if (callback != null) {
                    callback.onTransferRequest(fromDevice, fromId, hymnName, fileData);
                }
                sendResponse(out, 200, "application/json", "{\"status\":\"received\"}".getBytes(StandardCharsets.UTF_8));
            } else {
                sendResponse(out, 404, "text/plain", "Not Found".getBytes(StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            if (callback != null) callback.onError("HTTP handler error: " + e.getMessage());
        }
    }

    private String readLine(InputStream in) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        int b;
        while ((b = in.read()) != -1) {
            if (b == '\r') continue;
            if (b == '\n') break;
            baos.write(b);
        }
        String result = baos.toString(StandardCharsets.UTF_8.name());
        return result.isEmpty() ? null : result;
    }

    private Map<String, String> readHeaders(InputStream in) throws IOException {
        Map<String, String> headers = new HashMap<>();
        String line;
        while ((line = readLine(in)) != null && !line.isEmpty()) {
            int colon = line.indexOf(":");
            if (colon > 0) {
                String key = line.substring(0, colon).trim().toLowerCase();
                String value = line.substring(colon + 1).trim();
                headers.put(key, value);
            }
        }
        return headers;
    }

    private void sendResponse(OutputStream out, int statusCode, String contentType, byte[] body) throws IOException {
        String status = statusCode == 200 ? "OK" : statusCode == 404 ? "Not Found" : "Error";
        String header = "HTTP/1.1 " + statusCode + " " + status + "\r\n" +
            "Content-Type: " + contentType + "\r\n" +
            "Content-Length: " + body.length + "\r\n" +
            "Connection: close\r\n" +
            "Access-Control-Allow-Origin: *\r\n" +
            "\r\n";
        out.write(header.getBytes(StandardCharsets.UTF_8));
        out.write(body);
        out.flush();
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
