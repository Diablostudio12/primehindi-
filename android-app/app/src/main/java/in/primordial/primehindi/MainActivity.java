package in.primordial.primehindi;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;

public class MainActivity extends AppCompatActivity {
    // Load the real Prime Hindi website so the app uses the same frontend, API proxy,
    // accounts, catalogue, posters, watchlist and playback as the website.
    private static final String HOME_URL = "https://primehindi.up.railway.app/";
    private static final int BRAND = Color.rgb(10, 13, 20);

    private FrameLayout frame;
    private WebView web;
    private ProgressBar progress;
    private View errorPanel;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        Window window = getWindow();
        window.setStatusBarColor(BRAND);
        window.setNavigationBarColor(BRAND);
        window.getDecorView().setSystemUiVisibility(0);

        frame = new FrameLayout(this);
        frame.setBackgroundColor(BRAND);

        web = new WebView(this);
        web.setBackgroundColor(BRAND);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(settings.getUserAgentString() + " PrimeHindiAndroid/3.0");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setProgressTintList(android.content.res.ColorStateList.valueOf(0xff2f6bff));
        progress.setBackgroundColor(BRAND);

        errorPanel = makeErrorPanel();
        errorPanel.setVisibility(View.GONE);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return routeUrl(request.getUrl().toString());
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
                errorPanel.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                errorPanel.setVisibility(View.GONE);
                CookieManager.getInstance().flush();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    progress.setVisibility(View.GONE);
                    errorPanel.setVisibility(View.VISIBLE);
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                customView = view;
                customViewCallback = callback;
                frame.addView(customView, new FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT));
                web.setVisibility(View.GONE);
                progress.setVisibility(View.GONE);
                WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
                getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_FULLSCREEN |
                        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
            }

            @Override
            public void onHideCustomView() {
                hideCustomView();
            }
        });

        frame.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, dp(3), android.view.Gravity.TOP);
        frame.addView(progress, progressParams);
        frame.addView(errorPanel, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(frame);

        if (state == null) {
            web.loadUrl(HOME_URL);
        } else {
            web.restoreState(state);
            if (web.getUrl() == null) web.loadUrl(HOME_URL);
        }
    }

    private View makeErrorPanel() {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(android.view.Gravity.CENTER);
        panel.setPadding(dp(28), dp(24), dp(28), dp(24));
        panel.setBackgroundColor(BRAND);

        TextView title = new TextView(this);
        title.setText("Can't connect to Prime Hindi");
        title.setTextColor(Color.WHITE);
        title.setTextSize(22);
        title.setGravity(android.view.Gravity.CENTER);
        panel.addView(title, new LinearLayout.LayoutParams(-1, -2));

        TextView message = new TextView(this);
        message.setText("Check your internet connection and try again.");
        message.setTextColor(0xffaeb8ca);
        message.setTextSize(15);
        message.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams messageParams = new LinearLayout.LayoutParams(-1, -2);
        messageParams.topMargin = dp(12);
        panel.addView(message, messageParams);

        Button retry = new Button(this);
        retry.setText("Try Again");
        retry.setTextColor(Color.WHITE);
        retry.setAllCaps(false);
        retry.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xff2f6bff));
        LinearLayout.LayoutParams retryParams = new LinearLayout.LayoutParams(-1, dp(52));
        retryParams.topMargin = dp(22);
        panel.addView(retry, retryParams);
        retry.setOnClickListener(v -> {
            errorPanel.setVisibility(View.GONE);
            web.reload();
            if (web.getUrl() == null) web.loadUrl(HOME_URL);
        });
        return panel;
    }

    // Keep website pages inside the app. Open unrelated external links in the browser;
    // allow Google authentication links to use the browser rather than a blocked WebView flow.
    private boolean routeUrl(String raw) {
        Uri uri = Uri.parse(raw);
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        if (scheme.equals("http") || scheme.equals("https")) {
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            if (host.equals("primehindi.up.railway.app") ||
                    host.equals("primordialstreams.up.railway.app") ||
                    host.equals("primordial-streaming-backend-production.up.railway.app") ||
                    host.endsWith(".google.com") || host.equals("accounts.google.com") ||
                    host.equals("gstatic.com") || host.endsWith(".gstatic.com")) {
                if (host.endsWith("google.com") || host.endsWith("gstatic.com")) {
                    openExternal(raw);
                    return true;
                }
                return false;
            }
            openExternal(raw);
            return true;
        }
        if (scheme.equals("tel") || scheme.equals("mailto") || scheme.equals("sms") ||
                scheme.equals("market") || scheme.equals("intent")) {
            openExternal(raw);
            return true;
        }
        return true;
    }

    private void openExternal(String url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No app found to open this link", Toast.LENGTH_SHORT).show();
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void hideCustomView() {
        if (customView == null) return;
        frame.removeView(customView);
        customView = null;
        web.setVisibility(View.VISIBLE);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().getDecorView().setSystemUiVisibility(0);
        if (customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
            customViewCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (customView != null) {
            hideCustomView();
        } else if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (web != null) web.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.stopLoading();
            web.setWebChromeClient(null);
            web.setWebViewClient(null);
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
