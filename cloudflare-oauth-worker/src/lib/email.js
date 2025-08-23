import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { STATE_NAMES } from '../constants/states.js';

/**
 * Send email notification using AWS SES
 */
export async function sendEmailNotification(env, to, from, subject, body) {
	try {
		const accessKey = env.AWS_ACCESS_KEY_ID;
		const secretKey = env.AWS_SECRET_ACCESS_KEY;
		const region = 'us-east-1'; // Change this to your SES region
		
		if (!accessKey || !secretKey) {
			console.error('❌ AWS credentials not found');
			return false;
		}
		
		// Create SES client
		const sesClient = new SESClient({
			region: region,
			credentials: {
				accessKeyId: accessKey,
				secretAccessKey: secretKey,
			},
		});
		
		// Create the email command
		const command = new SendEmailCommand({
			Source: from,
			Destination: {
				ToAddresses: [to],
			},
			Message: {
				Subject: {
					Data: subject,
				},
				Body: {
					Text: {
						Data: body,
					},
				},
			},
		});
		
		console.log('📧 Sending email via AWS SES...');
		console.log('📧 To:', to);
		console.log('📧 From:', from);
		console.log('📧 Subject:', subject);
		
		// Send the email
		const response = await sesClient.send(command);
		
		console.log('✅ Email sent successfully via AWS SES');
		console.log('📧 Message ID:', response.MessageId);
		return true;
		
	} catch (error) {
		console.error('❌ Error sending email via AWS SES:', error);
		return false;
	}
}

/**
 * Send state change email notifications
 */
export async function sendStateChangeEmail(env, userEmail, userName, action, stateId, previousStates, newStates) {
	const stateName = STATE_NAMES[stateId] || stateId;
	const timestamp = new Date().toLocaleString();
	const previousCount = previousStates.length;
	const newCount = newStates.length;
	
	const subject = `Plate Chase - State ${action}: ${stateName}`;
	
	const body = `
Hello from Plate Chase!

${userName} (${userEmail}) has ${action.toLowerCase()} ${stateName} from their license plate collection.

Details:
- Action: ${action}
- State: ${stateName}
- Previous total: ${previousCount} states
- New total: ${newCount} states
- Timestamp: ${timestamp}

Keep up the great work spotting those license plates!

Best regards,
The Plate Chase Team
`;

	// Log the email details for debugging
	console.log(`📧 Email notification:`);
	console.log(`   To: ${env.NOTIFICATION_EMAIL}`);
	console.log(`   From: support@platechase.com`);
	console.log(`   Subject: ${subject}`);

	// Debug all environment variables
	console.log('🔍 All env variables:', Object.keys(env));
	console.log(`🔑 AWS Access Key ID: ${env.AWS_ACCESS_KEY_ID ? env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`);
	console.log(`🔑 AWS Secret Access Key: ${env.AWS_SECRET_ACCESS_KEY ? env.AWS_SECRET_ACCESS_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
	console.log(`📧 Notification Email: ${env.NOTIFICATION_EMAIL || 'NOT SET'}`);

	// Use the new sendEmailNotification function
	const success = await sendEmailNotification(env, env.NOTIFICATION_EMAIL, 'support@platechase.com', subject, body);

	if (success) {
		console.log(`✅ Email notification sent for ${action} of ${stateName} by ${userEmail}`);
	} else {
		console.error(`❌ Failed to send email notification for ${action} of ${stateName} by ${userEmail}`);
	}
}
