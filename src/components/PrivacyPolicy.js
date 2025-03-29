import React from 'react';

function PrivacyPolicy() {
  return (
    <div className="privacy-policy">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <section>
        <h2>1. Introduction</h2>
        <p>Welcome to The License Plate Game. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we handle your data when you visit our website and tell you about your privacy rights.</p>
      </section>

      <section>
        <h2>2. Data We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li>Account information (name, email) through Google OAuth</li>
          <li>Game progress data (visited states)</li>
          <li>Usage data and analytics</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Data</h2>
        <p>We use your data to:</p>
        <ul>
          <li>Provide and maintain our service</li>
          <li>Track your game progress</li>
          <li>Improve our service</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>
      </section>

      <section>
        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
        </ul>
      </section>

      <section>
        <h2>6. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us.</p>
      </section>
    </div>
  );
}

export default PrivacyPolicy; 