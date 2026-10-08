package in.primordial.primehindi;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.widget.ImageView;
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
    private View splashPanel;
    private final Handler uiHandler = new Handler(Looper.getMainLooper());
    private long splashStartedAt;
    private WebChromeClient.CustomViewCallback customViewCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        splashStartedAt = SystemClock.elapsedRealtime();
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
                dismissSplashAfterMinimum();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    progress.setVisibility(View.GONE);
                    errorPanel.setVisibility(View.VISIBLE);
                    dismissSplashAfterMinimum();
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
        splashPanel = makeSplashPanel();
        frame.addView(splashPanel, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(frame);
        uiHandler.postDelayed(this::hideSplash, 8000);

        if (state == null) {
            web.loadUrl(HOME_URL);
        } else {
            web.restoreState(state);
            if (web.getUrl() == null) web.loadUrl(HOME_URL);
        }
    }

    // Branded launch screen shown while the live website starts loading.
    private View makeSplashPanel() {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(android.view.Gravity.CENTER_HORIZONTAL);
        panel.setPadding(dp(24), dp(28), dp(24), dp(24));
        GradientDrawable background = new GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                new int[]{0xff02040b, 0xff06143a, 0xff09051c});
        panel.setBackground(background);

        LinearLayout top = new LinearLayout(this);
        top.setGravity(android.view.Gravity.END | android.view.Gravity.CENTER_VERTICAL);
        TextView topMark = new TextView(this);
        topMark.setText("⌕     ☰");
        topMark.setTextColor(0xffdce8ff);
        topMark.setTextSize(24);
        top.addView(topMark);
        panel.addView(top, new LinearLayout.LayoutParams(-1, dp(42)));

        View topGap = new View(this);
        panel.addView(topGap, new LinearLayout.LayoutParams(1, dp(20)));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ic_launcher);
        logo.setContentDescription("Prime Hindi logo");
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams logoParams = new LinearLayout.LayoutParams(dp(112), dp(112));
        logoParams.gravity = android.view.Gravity.CENTER_HORIZONTAL;
        panel.addView(logo, logoParams);

        LinearLayout wordmark = new LinearLayout(this);
        wordmark.setGravity(android.view.Gravity.CENTER);
        TextView prime = new TextView(this);
        prime.setText("prime");
        prime.setTextColor(Color.WHITE);
        prime.setTextSize(38);
        prime.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        TextView hindi = new TextView(this);
        hindi.setText("hindi");
        hindi.setTextColor(0xff18c9f5);
        hindi.setTextSize(38);
        hindi.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        wordmark.addView(prime);
        wordmark.addView(hindi);
        panel.addView(wordmark, new LinearLayout.LayoutParams(-1, -2));

        TextView tagline = new TextView(this);
        tagline.setText("Anime  •  Movies  •  Fan Dubs");
        tagline.setTextColor(0xffc3cde5);
        tagline.setTextSize(14);
        tagline.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams taglineParams = new LinearLayout.LayoutParams(-1, -2);
        taglineParams.topMargin = dp(8);
        panel.addView(tagline, taglineParams);

        View heroGap = new View(this);
        panel.addView(heroGap, new LinearLayout.LayoutParams(1, 0, 1));

        TextView headline = new TextView(this);
        headline.setText("Your Favourite Anime\nNow in Hindi");
        headline.setTextColor(Color.WHITE);
        headline.setTextSize(29);
        headline.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        headline.setGravity(android.view.Gravity.CENTER);
        panel.addView(headline, new LinearLayout.LayoutParams(-1, -2));

        TextView subline = new TextView(this);
        subline.setText("Watch. Explore. Feel the Anime.");
        subline.setTextColor(0xffc3cde5);
        subline.setTextSize(15);
        subline.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams subParams = new LinearLayout.LayoutParams(-1, -2);
        subParams.topMargin = dp(16);
        panel.addView(subline, subParams);

        TextView start = new TextView(this);
        start.setText("Get Started    →");
        start.setTextColor(Color.WHITE);
        start.setTextSize(19);
        start.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        start.setGravity(android.view.Gravity.CENTER);
        GradientDrawable buttonBg = new GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{0xff00a8ff, 0xff315cff, 0xffc52cff});
        buttonBg.setCornerRadius(dp(30));
        start.setBackground(buttonBg);
        LinearLayout.LayoutParams startParams = new LinearLayout.LayoutParams(-1, dp(58));
        startParams.topMargin = dp(28);
        panel.addView(start, startParams);

        TextView signIn = new TextView(this);
        signIn.setText("Sign In");
        signIn.setTextColor(Color.WHITE);
        signIn.setTextSize(17);
        signIn.setGravity(android.view.Gravity.CENTER);
        GradientDrawable outline = new GradientDrawable();
        outline.setColor(0x16070d20);
        outline.setCornerRadius(dp(30));
        outline.setStroke(dp(1), 0xff40577f);
        signIn.setBackground(outline);
        LinearLayout.LayoutParams signParams = new LinearLayout.LayoutParams(-1, dp(54));
        signParams.topMargin = dp(12);
        panel.addView(signIn, signParams);

        TextView features = new TextView(this);
        features.setText("▷  HD Quality      ⚡  Fast Streaming\n♡  Built for Fans");
        features.setTextColor(0xffb9c9e8);
        features.setTextSize(13);
        features.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams featureParams = new LinearLayout.LayoutParams(-1, -2);
        featureParams.topMargin = dp(30);
        panel.addView(features, featureParams);

        TextView footer = new TextView(this);
        footer.setText("A world of anime, in your language.");
        footer.setTextColor(0xff4eaaff);
        footer.setTextSize(12);
        footer.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams footerParams = new LinearLayout.LayoutParams(-1, -2);
        footerParams.topMargin = dp(20);
        panel.addView(footer, footerParams);
        return panel;
    }

    private void dismissSplashAfterMinimum() {
        long remaining = 1800 - (SystemClock.elapsedRealtime() - splashStartedAt);
        uiHandler.postDelayed(this::hideSplash, Math.max(0, remaining));
    }

    private void hideSplash() {
        if (splashPanel != null && splashPanel.getVisibility() == View.VISIBLE) {
            splashPanel.animate().alpha(0f).setDuration(220).withEndAction(() -> {
                if (splashPanel != null) splashPanel.setVisibility(View.GONE);
            }).start();
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
