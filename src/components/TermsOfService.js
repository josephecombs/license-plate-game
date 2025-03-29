import React from 'react';

function TermsOfService() {
  return (
    <div className="terms-of-service">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <section>
        <h2>1. Agreement to Terms</h2>
        <p>By accessing The License Plate Game, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
      </section>

      <section>
        <h2>2. Use License</h2>
        <p>Permission is granted to temporarily access The License Plate Game for personal, non-commercial use only. This license does not include:</p>
        <ul>
          <li>Modifying or copying the materials</li>
          <li>Using the materials for any commercial purpose</li>
          <li>Attempting to decompile or reverse engineer any software contained in The License Plate Game</li>
          <li>Removing any copyright or other proprietary notations</li>
        </ul>
      </section>

      <section>
        <h2>3. User Responsibilities</h2>
        <p>As a user of The License Plate Game, you agree to:</p>
        <ul>
          <li>Provide accurate information when creating an account</li>
          <li>Maintain the security of your account</li>
          <li>Not use the service for any illegal purposes</li>
          <li>Not interfere with the proper working of the service</li>
        </ul>
      </section>

      <section>
        <h2>4. Disclaimer</h2>
        <p>The materials on The License Plate Game are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
      </section>

      <section>
        <h2>5. Limitations</h2>
        <p>In no event shall The License Plate Game or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use The License Plate Game.</p>
      </section>

      <section>
        <h2>6. Changes to Terms</h2>
        <p>We reserve the right to modify these terms at any time. We will notify users of any material changes via the website or email.</p>
      </section>

      <section>
        <h2>7. Contact Information</h2>
        <p>If you have any questions about these Terms of Service, please contact us.</p>
      </section>
    </div>
  );
}

export default TermsOfService; 