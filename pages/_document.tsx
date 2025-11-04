import Document, { Html, Head, Main, NextScript } from 'next/document';
import React from 'react';

// Custom Document to include AdSense validation script in the <head>
export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* AdSense site validation script (required by AdSense to serve ads) */}
          {/* Replace client id if you want to change it later; this uses the user's provided client */}
          <script
            async
            data-ads-client="ca-pub-9093494357207877"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9093494357207877"
            crossOrigin="anonymous"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
