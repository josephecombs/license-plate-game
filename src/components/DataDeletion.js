import React from 'react';

function DataDeletion() {
  return (
    <div className="data-deletion">
      <h1>Data Deletion Request</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <section>
        <h2>Request Data Deletion</h2>
        <p>If you would like to request the deletion of your personal data from Plate Chase, please contact us directly.</p>
        <p>To request data deletion, please email us at:</p>
        <p><strong>joseph.e.combs@gmail.com</strong></p>
        <p>Please include the following information in your email:</p>
        <ul>
          <li>Your full name</li>
          <li>The email address associated with your Plate Chase account</li>
          <li>A clear statement that you want your data deleted</li>
          <li>Any additional information that may help us identify your account</li>
        </ul>
      </section>

      <section>
        <h2>What Data Will Be Deleted</h2>
        <p>When you request data deletion, we will remove:</p>
        <ul>
          <li>Your account information (name, email)</li>
          <li>Your game progress data (visited states)</li>
          <li>Any other personal data associated with your account</li>
        </ul>
        <p>Please note that some data may be retained for legal or security purposes as required by law.</p>
      </section>

      <section>
        <h2>Response Time</h2>
        <p>We will process your data deletion request within 30 days of receiving your email. You will receive a confirmation email once your data has been deleted.</p>
      </section>

      <section>
        <h2>Questions</h2>
        <p>If you have any questions about this process or our data handling practices, please contact us at the email address above.</p>
      </section>
    </div>
  );
}

export default DataDeletion;
